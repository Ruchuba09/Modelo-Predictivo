"""Red neuronal que estima el riesgo usando solo informacion a nivel de proyecto.

Dos redes multicapa:
- Eventos: de las variables del proyecto a la probabilidad de cada tipo de evento (multietiqueta).
- Entidades: de las variables del proyecto y descriptores de la entidad (tipo, cargo, area, riesgo
  critico, tamano, antiguedad) a su probabilidad de evento. No usa el historial de la entidad.

No recibe identificadores de proyecto, cliente ni faena, para poder generalizar a proyectos nuevos.
Se entrena con el tramo antiguo, se detiene con el siguiente y se evalua con el mas reciente. La red
publicada es la misma que se evaluo; solo su calibracion se reajusta con esos dos tramos, que no entreno.

Uso por consola:
  python red_neuronal.py --db postgresql+psycopg2://usuario:clave@host/base --horizonte 4
"""
import argparse
import copy
import logging
import os
import threading
import warnings
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, log_loss, roc_auc_score
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sqlalchemy import create_engine, text
from threadpoolctl import threadpool_limits

from modelo_predictivo import (
    OBJETIVO_INCIDENTES,
    OBJETIVO_LESIONES,
    TIPOS_AVISO,
    TIPOS_SEGUIMIENTO,
    filtrar_objetivo,
    tasa_desde_probabilidad,
)
from horizontes import DIAS_POR_SEMANAS, SEMANAS_ENTRENABLES, es_derivado, factor, plazos_coherentes, probabilidad_de, riesgo_acumulado, semanas_modelo
import prueba_red
from traza_red import Traza
from motor_riesgo import (
    DIRECTORIO_MODELOS,
    huella_datos,
    _contexto_entidades,
    calidad_discriminacion,
    cargar_base,
    construir_niveles,
    construir_panel,
    semana_actual,
)

MIN_POR_CLASE = 20
MAX_EPOCAS = 80
PACIENCIA = 8
MAX_FILAS_ENTIDADES = 20000
SEMILLAS = (0, 1, 2, 3, 4)
# Desde redes pequenas y muy regularizadas hasta redes mas flexibles; las elige la validacion.
CONFIGURACIONES = (
    {"capas": (32,), "alpha": 1.0, "lr": 3e-4},
    {"capas": (32,), "alpha": 0.1, "lr": 1e-3},
    {"capas": (64, 32), "alpha": 1.0, "lr": 3e-4},
    {"capas": (64, 32), "alpha": 0.1, "lr": 3e-4},
    {"capas": (64, 32), "alpha": 1e-3, "lr": 1e-3},
    {"capas": (128, 64), "alpha": 0.01, "lr": 3e-4},
)
DIRECTORIO_RED = DIRECTORIO_MODELOS / "red_neuronal"
NIVELES_ENTIDAD = ("area", "cuadrilla", "trabajador", "actividad")
COLUMNAS_ENTIDAD_NUM = ["entidad_semanas_activa", "entidad_tamano"]
COLUMNAS_ENTIDAD_CAT = ["nivel", "categoria"]


# ------------------------------------------------------------------ datos

def _etiquetas_futuras(meta, eventos, h):
    """1 si la entidad tiene al menos un evento entre la semana t y t+h-1."""
    if eventos.empty:
        return pd.Series(0, index=meta.index, dtype=int)
    semanas = pd.to_datetime(eventos["fecha"])
    semanas = semanas - pd.to_timedelta(semanas.dt.weekday, unit="D")
    conteo = pd.DataFrame({"entidad": eventos["entidad"].to_numpy(), "semana": semanas.dt.normalize().to_numpy()})
    conteo = conteo.groupby(["entidad", "semana"]).size().rename("n").reset_index()
    n = meta[["entidad", "semana"]].merge(conteo, how="left", on=["entidad", "semana"])["n"].fillna(0)
    n.index = meta.index
    futuro = n.groupby(meta["entidad"]).transform(lambda s: s[::-1].rolling(h, min_periods=1).sum()[::-1])
    return (futuro > 0).astype(int)


def etiqueta_dias(meta, eventos, dias):
    """1 si la entidad tiene un evento en los primeros dias de la semana indicada."""
    return _etiquetas_futuras(meta, eventos[pd.to_datetime(eventos["fecha"]).dt.weekday < dias], 1)


def medir_conversion(p_semana, meta_prueba, meta_previa, eventos, plazos=(1, 2, 5)):
    """Compara la probabilidad derivada del modelo semanal con lo ocurrido en esos dias."""
    resultado = {}
    for dias in plazos:
        y = etiqueta_dias(meta_prueba, eventos, dias).to_numpy()
        p = 1 - (1 - np.clip(p_semana, 0, 0.999999)) ** (dias / 7)
        tasa_previa = float(etiqueta_dias(meta_previa, eventos, dias).mean()) if len(meta_previa) else float(y.mean())
        fila = {
            "filas": len(y), "positivos": int(y.sum()), "riesgo_predicho": round(float(p.mean()), 4), "tasa_real": round(float(y.mean()), 4),
            "log_loss": _metricas(y, p)["log_loss"], "log_loss_referencia": _metricas(y, np.full(len(y), tasa_previa))["log_loss"],
        }
        if len(np.unique(y)) == 2:
            fila["auc_roc"] = round(float(roc_auc_score(y, p)), 4)
        fila["supera_referencia"] = bool(fila["log_loss"] < fila["log_loss_referencia"])
        resultado[str(dias)] = fila
    return resultado


def preparar_eventos(base, h, hoy=None):
    """Panel proyecto-semana y una etiqueta por cada objetivo con suficientes ejemplos."""
    spine, eventos, _, numericas = construir_niveles(base, OBJETIVO_INCIDENTES, h, hoy)["proyecto"]
    X, meta = construir_panel(spine, eventos, h, (), numericas, hoy=hoy)
    # Las tarjetas PARE se predicen, pero no son variables: X se arma con incidentes como objetivo.
    fuente = eventos[~eventos["tipo"].isin(TIPOS_SEGUIMIENTO)]
    objetivos = [OBJETIVO_INCIDENTES, OBJETIVO_LESIONES, *sorted(fuente["tipo"].unique())]
    Y = pd.DataFrame({
        objetivo: _etiquetas_futuras(meta, filtrar_objetivo(fuente, objetivo), h) for objetivo in objetivos
    }, index=meta.index)
    observadas = meta["observada"]
    validos = [c for c in Y if Y.loc[observadas, c].sum() >= MIN_POR_CLASE and (1 - Y.loc[observadas, c]).sum() >= MIN_POR_CLASE]
    return X, Y[validos], meta


def preparar_entidades(base, X_proyecto, meta_proyecto, h, hoy=None):
    """Una fila por entidad y semana: variables del proyecto y descriptores, sin historial de la entidad."""
    niveles = construir_niveles(base, OBJETIVO_INCIDENTES, h, hoy)
    variables_proyecto = X_proyecto.add_prefix("proyecto_")
    variables_proyecto["id_proyecto"] = meta_proyecto["entidad"].to_numpy()
    variables_proyecto["semana"] = meta_proyecto["semana"].to_numpy()
    tablas = []
    for nivel in NIVELES_ENTIDAD:
        if nivel not in niveles or niveles[nivel][1].empty:
            continue
        spine, eventos, _, _ = niveles[nivel]
        Xe, me = construir_panel(spine, eventos, h, (), (), hoy=hoy)
        if "id_proyecto" not in me:
            continue
        ordenado = spine.sort_values(["entidad", "semana"]).drop_duplicates(["entidad", "semana"]).reset_index(drop=True)
        if nivel == "area":
            categoria = ordenado["entidad"].map(base.get("codigos_area", {}))
        elif nivel == "trabajador":
            categoria = ordenado["cargo"]
        elif nivel == "actividad":
            categoria = ordenado["riesgo_critico"]
        else:
            categoria = pd.Series("cuadrilla", index=ordenado.index)
        tablas.append(me[["entidad", "semana", "id_proyecto", "y", "observada"]].assign(
            nivel=nivel,
            categoria=categoria.fillna("sin_dato").astype(str).to_numpy(),
            entidad_semanas_activa=Xe["edad"].to_numpy(),
            entidad_tamano=Xe["tamano"].to_numpy() if "tamano" in Xe else np.nan,
        ))
    if not tablas:
        return None
    return pd.concat(tablas, ignore_index=True).merge(variables_proyecto, how="inner", on=["id_proyecto", "semana"])


def _preprocesador(numericas, categoricas):
    return ColumnTransformer([
        ("num", make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), numericas),
        ("cat", OneHotEncoder(handle_unknown="ignore", min_frequency=5, sparse_output=False), categoricas),
    ])


def dividir_temporal(semanas, h):
    """Mascaras de entrenamiento, validacion y prueba, con brecha para no solapar etiquetas."""
    q70, q85 = semanas.quantile(0.70), semanas.quantile(0.85)
    brecha = pd.Timedelta(weeks=h)
    return semanas < q70 - brecha, (semanas >= q70) & (semanas < q85 - brecha), semanas >= q85


# ------------------------------------------------------------------ entrenamiento

def _red(configuracion, semilla):
    return MLPClassifier(hidden_layer_sizes=configuracion["capas"], activation="relu", solver="adam", alpha=configuracion["alpha"],
                         batch_size=128, learning_rate_init=configuracion["lr"], max_iter=1, random_state=semilla)


def _probabilidades(red, Z):
    """Siempre n filas por m salidas, tanto en multietiqueta como en salida binaria."""
    p = red.predict_proba(Z)
    return p[:, [1]] if p.ndim == 2 and len(red.classes_) == 2 and p.shape[1] == 2 and red.n_outputs_ == 1 else p


def _perdida(y, p):
    return float(np.mean([log_loss(y[:, j], np.clip(p[:, j], 1e-6, 1 - 1e-6), labels=[0, 1]) for j in range(y.shape[1])]))


def _ensamble(redes, Z):
    return np.mean([_probabilidades(red, Z) for red in redes], axis=0)


def ajustar_red(Ztr, Ytr, Zva, Yva, configuracion, semilla=0, max_epocas=MAX_EPOCAS, paciencia=PACIENCIA, observador=None):
    """Entrena por epocas y conserva la mejor red segun las semanas de validacion."""
    red = _red(configuracion, semilla)
    clases = np.arange(Ytr.shape[1]) if Ytr.shape[1] > 1 else np.array([0, 1])
    objetivo = Ytr if Ytr.shape[1] > 1 else Ytr.ravel()
    mejor, mejor_perdida, mejor_epoca = None, np.inf, 0
    curva = []
    for epoca in range(1, max_epocas + 1):
        red.partial_fit(Ztr, objetivo, classes=clases)
        perdida = _perdida(Yva, _probabilidades(red, Zva))
        curva.append(round(perdida, 5))
        mejoro = perdida < mejor_perdida - 1e-4
        if mejoro:
            mejor, mejor_perdida, mejor_epoca = copy.deepcopy(red), perdida, epoca
        if observador:
            observador(red, epoca, _perdida(Ytr, _probabilidades(red, Ztr)), perdida, mejoro)
        if not mejoro and epoca - mejor_epoca >= paciencia:
            break
    return mejor, mejor_epoca, curva, mejor_perdida


def _logit(p):
    p = np.clip(p, 1e-6, 1 - 1e-6)
    return np.log(p / (1 - p)).reshape(-1, 1)


def _calibradores(y, p):
    """Una calibracion por salida; sin ambas clases se deja la salida tal como viene."""
    return [LogisticRegression(C=10.0).fit(_logit(p[:, j]), y[:, j]) if len(np.unique(y[:, j])) == 2 else None
            for j in range(y.shape[1])]


def _calibrar(calibradores, p):
    salida = p.copy()
    for j, calibrador in enumerate(calibradores):
        if calibrador is not None:
            salida[:, j] = calibrador.predict_proba(_logit(p[:, j]))[:, 1]
    return salida


def _calibracion(y, p, grupos=None):
    """Una calibracion general o, si hay grupos, una por grupo: cada nivel tiene su propia tasa."""
    if grupos is None:
        return {None: _calibradores(y, p)}
    return {grupo: _calibradores(y[grupos == grupo], p[grupos == grupo]) for grupo in np.unique(grupos)}


def _aplicar_calibracion(calibracion, p, grupos=None):
    if grupos is None:
        return _calibrar(calibracion[None], p)
    salida = p.copy()
    for grupo, calibradores in calibracion.items():
        en_grupo = grupos == grupo
        if en_grupo.any():
            salida[en_grupo] = _calibrar(calibradores, p[en_grupo])
    return salida


def _metricas(y, p):
    p = np.clip(p, 1e-6, 1 - 1e-6)
    metricas = {"brier": round(float(brier_score_loss(y, p)), 4), "log_loss": round(float(log_loss(y, p, labels=[0, 1])), 4)}
    if len(np.unique(y)) == 2:
        metricas["auc_roc"] = round(float(roc_auc_score(y, p)), 4)
        metricas["auc_pr"] = round(float(average_precision_score(y, p)), 4)
    return metricas


def _logistica_calibrada(Ztr, Ytr, Zva, Yva, Zte, grupos_val=None, grupos_test=None):
    """Referencia lineal con las mismas variables y la misma calibracion que la red."""
    salida = np.full((Zte.shape[0], Ytr.shape[1]), np.nan)
    for j in range(Ytr.shape[1]):
        if len(np.unique(Ytr[:, j])) == 2:
            modelo = LogisticRegression(C=0.1, max_iter=2000).fit(Ztr, Ytr[:, j])
            p_val = modelo.predict_proba(Zva)[:, 1].reshape(-1, 1)
            p_test = modelo.predict_proba(Zte)[:, 1].reshape(-1, 1)
            salida[:, [j]] = _aplicar_calibracion(_calibracion(Yva[:, [j]], p_val, grupos_val), p_test, grupos_test)
    return salida


def _comparar(y, p_red, p_logistica, p_prevalencia):
    fila = {
        "positivos_prueba": int(y.sum()), "filas_prueba": len(y),
        "red": _metricas(y, p_red), "prevalencia": _metricas(y, p_prevalencia),
    }
    referencias = [fila["prevalencia"]["log_loss"]]
    if not np.isnan(p_logistica).any():
        fila["logistica"] = _metricas(y, p_logistica)
        referencias.append(fila["logistica"]["log_loss"])
    mejor_referencia = min(referencias)
    fila["supera_referencias"] = bool(fila["red"]["log_loss"] < mejor_referencia)
    fila["mejora_log_loss_pct"] = round(100 * (mejor_referencia - fila["red"]["log_loss"]) / mejor_referencia, 2)
    if "auc_roc" in fila["red"]:
        fila["discriminacion"] = calidad_discriminacion(fila["red"]["auc_roc"])
    return fila


def entrenar_red(X, Y, semanas, observadas, h, categoricas=(), max_filas=None, columna_grupo=None, traza=None, nombre_red="eventos"):
    """Entrena, calibra y evalua una red. X e Y deben estar alineados por indice.

    Con una columna de grupo, la prevalencia de referencia y las metricas se calculan por grupo: mezclar niveles
    con tasas muy distintas haria que aprender solo el nivel pareciera una gran mejora.
    """
    Xo, Yo, so = X[observadas], Y[observadas], semanas[observadas]
    en_train, en_val, en_test = dividir_temporal(so, h)
    if min(en_train.sum(), en_val.sum(), en_test.sum()) == 0:
        raise ValueError("No hay suficientes semanas para separar entrenamiento, validacion y prueba.")
    prevalencia = pd.DataFrame(np.tile(Yo[en_train].mean().to_numpy(), (len(Yo), 1)), index=Yo.index, columns=Yo.columns)
    grupos = Xo[columna_grupo] if columna_grupo else None
    if grupos is not None:
        tasas = Yo[en_train].groupby(grupos[en_train]).mean()
        for columna in Yo:
            prevalencia[columna] = grupos.map(tasas[columna]).fillna(prevalencia[columna])
    if max_filas and en_train.sum() > max_filas:
        # Conserva todos los positivos: la calibracion corrige la proporcion resultante.
        y_max = Yo[en_train].max(axis=1)
        positivos = y_max.index[y_max == 1]
        negativos = y_max.index[y_max == 0]
        cupo = max(max_filas - len(positivos), len(positivos))
        negativos = np.random.default_rng(0).choice(negativos, min(cupo, len(negativos)), replace=False)
        en_train = pd.Series(False, index=Yo.index)
        en_train.loc[positivos.union(pd.Index(negativos))] = True
    numericas = [c for c in Xo.columns if c not in categoricas and Xo.loc[en_train, c].notna().any() and Xo.loc[en_train, c].nunique(dropna=True) > 1]
    preproceso = _preprocesador(numericas, list(categoricas))
    Ztr = preproceso.fit_transform(Xo[en_train])
    Zva, Zte = preproceso.transform(Xo[en_val]), preproceso.transform(Xo[en_test])
    Ytr, Yva, Yte = (Yo[m].to_numpy() for m in (en_train, en_val, en_test))

    if traza:
        # La fila que se propaga en el dibujo es la semana mas reciente de validacion.
        traza.iniciar_red(nombre_red, list(preproceso.get_feature_names_out()), Y.columns, Ztr, Ytr, Zva[-1])

    def observar(etapa, indice, configuracion, semilla):
        if not traza:
            return None
        return lambda red, epoca, perdida_train, perdida, mejoro: traza.registrar(nombre_red, red, etapa, indice, configuracion, semilla, epoca, perdida_train, perdida, mejoro)

    pruebas = [
        (i, configuracion, *ajustar_red(Ztr, Ytr, Zva, Yva, configuracion, observador=observar("busqueda", i, configuracion, 0)))
        for i, configuracion in enumerate(CONFIGURACIONES)
    ]
    indice_ganadora, configuracion, red, mejor_epoca, curva, _ = min(pruebas, key=lambda prueba: prueba[5])
    if traza:
        traza.elegir_ganadora(nombre_red, indice_ganadora)
    redes = [red, *(
        ajustar_red(Ztr, Ytr, Zva, Yva, configuracion, semilla, observador=observar("ensamble", indice_ganadora, configuracion, semilla))[0]
        for semilla in SEMILLAS[1:]
    )]
    p_val, p_test_cruda = _ensamble(redes, Zva), _ensamble(redes, Zte)
    grupos_val = None if grupos is None else grupos[en_val].to_numpy()
    grupos_test = None if grupos is None else grupos[en_test].to_numpy()
    p_test = _aplicar_calibracion(_calibracion(Yva, p_val, grupos_val), p_test_cruda, grupos_test)
    p_logistica = _logistica_calibrada(Ztr, Ytr, Zva, Yva, Zte, grupos_val, grupos_test)
    p_prevalencia = prevalencia[en_test].to_numpy()
    salidas = list(Y.columns)
    evaluacion = {nombre: _comparar(Yte[:, j], p_test[:, j], p_logistica[:, j], p_prevalencia[:, j]) for j, nombre in enumerate(salidas)}
    por_grupo = {}
    if grupos is not None:
        for grupo in sorted(np.unique(grupos_test)):
            m = grupos_test == grupo
            por_grupo[str(grupo)] = _comparar(Yte[m, 0], p_test[m, 0], p_logistica[m, 0], p_prevalencia[m, 0])

    # La red ya no cambia: la calibracion publicada usa tambien las semanas mas recientes.
    grupos_calibracion = None if grupos is None else np.concatenate([grupos_val, grupos_test])
    calibracion = _calibracion(np.vstack([Yva, Yte]), np.vstack([p_val, p_test_cruda]), grupos_calibracion)
    return {
        "preproceso": preproceso, "redes": redes, "configuracion": configuracion, "calibracion": calibracion,
        "columna_grupo": columna_grupo, "salidas": salidas,
        "evaluacion": evaluacion, "por_grupo": por_grupo, "epocas": mejor_epoca, "curva_validacion": curva,
        "filas_entrenamiento": int(en_train.sum()), "filas_validacion": int(en_val.sum()), "filas_prueba": int(en_test.sum()),
        "variables": len(numericas) + len(categoricas),
        "p_prueba": p_test, "indice_prueba": Yo.index[en_test], "p_logistica": p_logistica, "p_prevalencia": p_prevalencia,
        "y_prueba": Yte, "y_val": Yva, "indice_val": Yo.index[en_val],
        "p_val": _aplicar_calibracion(_calibracion(Yva, p_val, grupos_val), p_val, grupos_val),
    }


def predecir_red(ajuste, X):
    grupos = X[ajuste["columna_grupo"]].to_numpy() if ajuste["columna_grupo"] else None
    return _aplicar_calibracion(ajuste["calibracion"], _ensamble(ajuste["redes"], ajuste["preproceso"].transform(X)), grupos)


def _resumen(ajuste):
    return {clave: ajuste[clave] for clave in (
        "evaluacion", "por_grupo", "configuracion", "epocas", "curva_validacion", "filas_entrenamiento", "filas_validacion", "filas_prueba", "variables", "salidas",
    )}


def _cargar_base_red(engine):
    base = cargar_base(engine)
    areas = pd.read_sql(text("SELECT id_area, codigo_area FROM public.areas"), engine)
    base["codigos_area"] = dict(zip(areas["id_area"], areas["codigo_area"]))
    return base


CLAVES_TEMPORALES = ("p_prueba", "indice_prueba", "p_logistica", "p_prevalencia", "y_prueba", "y_val", "indice_val", "p_val")
PLAZOS_DIAS = (1, 2, 5)


def _armar_prueba(base, meta, tabla, eventos, entidades, horizonte):
    """Guarda lo necesario para probar la red despues: sus predicciones en semanas que no uso para aprender."""
    def bloque(ajuste, filas, filas_val, extra=()):
        return {
            "salidas": ajuste["salidas"], "y": ajuste["y_prueba"].astype(np.int8), "p": ajuste["p_prueba"].astype(np.float32),
            "logistica": ajuste["p_logistica"].astype(np.float32), "prevalencia": ajuste["p_prevalencia"].astype(np.float32),
            "semana": filas["semana"].to_numpy(), "entidad": filas["entidad"].to_numpy(),
            "y_val": ajuste["y_val"].astype(np.int8), "p_val": ajuste["p_val"].astype(np.float32),
            **{columna: filas[columna].to_numpy() for columna in extra},
            **{f"{columna}_val": filas_val[columna].to_numpy() for columna in extra},
        }

    resultado = {"eventos": bloque(eventos, meta.loc[eventos["indice_prueba"]], meta.loc[eventos["indice_val"]])}
    if entidades:
        resultado["entidades"] = bloque(entidades, tabla.loc[entidades["indice_prueba"]], tabla.loc[entidades["indice_val"]], ("nivel",))
    if horizonte == 1:
        # Lo ocurrido en los primeros dias de cada semana, para probar los plazos en dias.
        niveles = construir_niveles(base, OBJETIVO_INCIDENTES, 1)
        ocurridos = lambda nivel: niveles[nivel][1][niveles[nivel][1]["objetivo"]]
        dias = {}
        for dia in PLAZOS_DIAS:
            prueba_d = {"proyecto": etiqueta_dias(meta.loc[eventos["indice_prueba"]], ocurridos("proyecto"), dia).to_numpy(dtype=np.int8),
                        "proyecto_val": etiqueta_dias(meta.loc[eventos["indice_val"]], ocurridos("proyecto"), dia).to_numpy(dtype=np.int8)}
            if entidades:
                for sufijo, indice in (("", "indice_prueba"), ("_val", "indice_val")):
                    filas = tabla.loc[entidades[indice]]
                    salida = np.zeros(len(filas), dtype=np.int8)
                    for nivel in filas["nivel"].unique():
                        en_nivel = (filas["nivel"] == nivel).to_numpy()
                        salida[en_nivel] = etiqueta_dias(filas[en_nivel], ocurridos(nivel), dia).to_numpy(dtype=np.int8)
                    prueba_d[f"entidades{sufijo}"] = salida
            dias[dia] = prueba_d
        resultado["dias"] = dias
    return resultado


def _medir_conversiones(base, meta, tabla, eventos, entidades):
    """Con el modelo de 1 semana, mide en semanas no vistas las estimaciones de 1, 2 y 5 dias."""
    niveles = construir_niveles(base, OBJETIVO_INCIDENTES, 1)
    ocurridos = lambda nivel: niveles[nivel][1][niveles[nivel][1]["objetivo"]]
    resultado = {}
    if OBJETIVO_INCIDENTES in eventos["salidas"]:
        indice = eventos["indice_prueba"]
        prueba = meta.loc[indice]
        previas = meta[meta["observada"] & (meta["semana"] < prueba["semana"].min())]
        p = eventos["p_prueba"][:, eventos["salidas"].index(OBJETIVO_INCIDENTES)]
        resultado["proyecto"] = medir_conversion(p, prueba, previas, ocurridos("proyecto"))
    if entidades:
        filas = tabla.loc[entidades["indice_prueba"]]
        p_entidades = entidades["p_prueba"][:, 0]
        previas = tabla[tabla["observada"] & (tabla["semana"] < filas["semana"].min())]
        for nivel in sorted(filas["nivel"].unique()):
            en_nivel = (filas["nivel"] == nivel).to_numpy()
            resultado[nivel] = medir_conversion(p_entidades[en_nivel], filas[en_nivel], previas[previas["nivel"] == nivel], ocurridos(nivel))
    return resultado


def entrenar(engine, horizonte=4, traza=None):
    """Entrena las dos redes para un horizonte y guarda el resultado y su traza."""
    traza = traza or Traza(horizonte)
    with warnings.catch_warnings(), threadpool_limits(limits=1):
        warnings.simplefilter("ignore")
        base = _cargar_base_red(engine)
        X, Y, meta = preparar_eventos(base, horizonte)
        if Y.shape[1] == 0:
            raise ValueError("No hay objetivos con al menos 20 ejemplos positivos y negativos.")
        eventos = entrenar_red(X, Y, meta["semana"], meta["observada"], horizonte, traza=traza, nombre_red="eventos")

        entidades = None
        tabla = preparar_entidades(base, X, meta, horizonte)
        if tabla is not None and tabla.loc[tabla["observada"], "y"].sum() >= MIN_POR_CLASE:
            columnas = [c for c in tabla.columns if c.startswith("proyecto_")] + COLUMNAS_ENTIDAD_NUM + COLUMNAS_ENTIDAD_CAT
            entidades = entrenar_red(
                tabla[columnas], tabla[["y"]].rename(columns={"y": "entidad"}), tabla["semana"], tabla["observada"],
                horizonte, categoricas=tuple(COLUMNAS_ENTIDAD_CAT), max_filas=MAX_FILAS_ENTIDADES,
                columna_grupo="nivel", traza=traza, nombre_red="entidades",
            )

        conversion = _medir_conversiones(base, meta, tabla, eventos, entidades) if horizonte == 1 else None

        prueba = _armar_prueba(base, meta, tabla, eventos, entidades, horizonte)

    for ajuste in (eventos, entidades):
        if ajuste:
            for clave in CLAVES_TEMPORALES:
                ajuste.pop(clave, None)
    artefacto = {"horizonte": horizonte, "entrenado_en": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                 "eventos": eventos, "entidades": entidades, "conversion_dias": conversion, "prueba": prueba}
    DIRECTORIO_RED.mkdir(parents=True, exist_ok=True)
    joblib.dump(artefacto, DIRECTORIO_RED / f"h{horizonte}.joblib")
    joblib.dump(traza.para_guardar(), DIRECTORIO_RED / f"h{horizonte}.traza.joblib")
    return artefacto


def _cargar_artefacto(horizonte):
    archivo = DIRECTORIO_RED / f"h{horizonte}.joblib"
    return joblib.load(archivo) if archivo.exists() else None


_filas_vigentes = {}


def _filas_de_la_semana(engine, hoy=None):
    """Variables de esta semana, iguales en todo plazo; se recalculan si cambian los datos o la semana."""
    huella = huella_datos(engine, OBJETIVO_INCIDENTES, 1, hoy)
    if _filas_vigentes.get("huella") == huella:
        return _filas_vigentes["proyectos"], _filas_vigentes["entidades"]
    base = _cargar_base_red(engine)
    X, _, meta = preparar_eventos(base, 1, hoy)
    tabla = preparar_entidades(base, X, meta, 1, hoy)
    semana = semana_actual(hoy)
    proyectos = X[meta["semana"] == semana].assign(id_proyecto=meta.loc[meta["semana"] == semana, "entidad"])
    entidades = None if tabla is None else tabla[tabla["semana"] == semana]
    _filas_vigentes.update(huella=huella, proyectos=proyectos, entidades=entidades)
    return proyectos, entidades


def _con_columnas(ajuste, filas):
    """Ordena las columnas como en el entrenamiento; una variable nueva o ausente se imputa."""
    return filas.reindex(columns=list(ajuste["preproceso"].feature_names_in_))


def _salidas_crudas(artefacto, fila, grupos):
    """Probabilidades de una red, sin ajustar, para los eventos y las entidades de un proyecto."""
    ajuste = artefacto["eventos"]
    eventos = dict(zip(ajuste["salidas"], map(float, predecir_red(ajuste, _con_columnas(ajuste, fila))[0])))
    entidades = {}
    if artefacto["entidades"]:
        for nivel, grupo in grupos:
            p = predecir_red(artefacto["entidades"], _con_columnas(artefacto["entidades"], grupo))[:, 0]
            entidades[nivel] = dict(zip(map(int, grupo["entidad"]), map(float, p)))
    return eventos, entidades


def predecir_proyecto(engine, id_proyecto, horizonte=4, hoy=None):
    """Probabilidad de cada tipo de evento y entidad, con riesgos coherentes entre plazos."""
    artefacto = _cargar_artefacto(horizonte)
    if artefacto is None:
        return None
    menores = [h for h in SEMANAS_ENTRENABLES if h < horizonte]
    previos = {h: _cargar_artefacto(h) for h in menores}
    faltan = [h for h, previo in previos.items() if previo is None]
    coherencia = {"completa": not faltan, "plazos_pendientes": [DIAS_POR_SEMANAS[h] for h in faltan]}
    usados = [h for h in menores if previos[h] is not None]
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        proyectos, tabla = _filas_de_la_semana(engine, hoy)
        fila = proyectos[proyectos["id_proyecto"] == id_proyecto]
        if fila.empty:
            return {"id_proyecto": id_proyecto, "horizonte": horizonte, "eventos": [], "entidades": {},
                    "mensaje": "El proyecto no está vigente esta semana.", "coherencia": coherencia}
        grupos = [] if tabla is None else list(tabla[tabla["id_proyecto"] == id_proyecto].groupby("nivel"))
        pasos = [DIAS_POR_SEMANAS[h] for h in usados + [horizonte]]
        crudas = [_salidas_crudas(a, fila, grupos) for a in [previos[h] for h in usados] + [artefacto]]
        proporcion = factor(pasos[-1])

        acumulados = lambda valores, dias: {clave: riesgo_acumulado(p, factor(dias)) for clave, p in valores.items()}
        calidad = artefacto["eventos"]["evaluacion"]
        eventos = []
        for nombre in artefacto["eventos"]["salidas"]:
            serie = [acumulados({nombre: c[0][nombre]} if nombre in c[0] else {}, dias) for c, dias in zip(crudas, pasos)]
            final = plazos_coherentes(serie)[-1][nombre]
            eventos.append({"objetivo": nombre, "prob_evento": round(probabilidad_de(final, proporcion), 6), "calidad": calidad[nombre],
                            "aviso": nombre in TIPOS_AVISO})
        eventos.sort(key=lambda item: item["prob_evento"], reverse=True)

        serie_proyecto = [
            acumulados({id_proyecto: c[0][OBJETIVO_INCIDENTES]} if OBJETIVO_INCIDENTES in c[0] else {}, dias)
            for c, dias in zip(crudas, pasos)
        ]
        topes = plazos_coherentes(serie_proyecto)

        entidades = {}
        if artefacto["entidades"] and grupos:
            contexto = _contexto_entidades(engine)
            for nivel, grupo in grupos:
                serie = [acumulados(c[1].get(nivel, {}), dias) for c, dias in zip(crudas, pasos)]
                ids = {e for valores in serie for e in valores}
                # Las partes no pueden sumar mas riesgo que el proyecto completo.
                final = plazos_coherentes(serie, {e: id_proyecto for e in ids}, topes)[-1]
                nombres = contexto[nivel].drop_duplicates("id").set_index("id")
                filas = [{
                    "id": e, "nombre": nombres["nombre"].get(e), "detalle": nombres["detalle"].get(e),
                    "prob_evento": round(probabilidad_de(final[e], proporcion), 6),
                    "tasa_semanal_suavizada": float(tasa_desde_probabilidad(probabilidad_de(final[e], proporcion), horizonte)),
                } for e in map(int, grupo["entidad"])]
                entidades[nivel] = sorted((f for f in filas if f["nombre"]), key=lambda f: f["prob_evento"], reverse=True)
    return {"id_proyecto": id_proyecto, "horizonte": horizonte, "semana": str(semana_actual(hoy).date()),
            "entrenado_en": artefacto["entrenado_en"], "eventos": eventos, "entidades": entidades, "coherencia": coherencia}


# ------------------------------------------------------------------ pruebas de acierto

_pruebas_hechas = {}


def _nombres_prueba(engine):
    """Nombres para los ejemplos: los proyectos terminados y las entidades sin nombre usan su numero."""
    proyectos = pd.read_sql(text("SELECT id_proyecto, nombre FROM public.proyectos"), engine)
    contexto = _contexto_entidades(engine)
    nombres = {nivel: dict(zip(contexto[nivel]["id"].astype(int), contexto[nivel]["nombre"])) for nivel in NIVELES_ENTIDAD if nivel in contexto}
    nombres["proyecto"] = dict(zip(proyectos["id_proyecto"].astype(int), proyectos["nombre"]))
    return nombres


def ejecutar_pruebas(engine, dias):
    """Aplica las pruebas de acierto a la red que atiende este plazo."""
    semanas = semanas_modelo(dias)
    artefacto = _cargar_artefacto(semanas)
    if artefacto is None or not artefacto.get("prueba"):
        return None
    clave = (semanas, dias, artefacto["entrenado_en"])
    if clave in _pruebas_hechas:
        return _pruebas_hechas[clave]

    datos = artefacto["prueba"]
    derivado = es_derivado(dias)
    proporcion = dias / 7
    convertir = (lambda p: 1 - (1 - np.clip(p.astype(float), 0, 0.999999)) ** proporcion) if derivado else (lambda p: p.astype(float))
    nombres = _nombres_prueba(engine)
    titulo = {"area": "Área", "cuadrilla": "Cuadrilla", "trabajador": "Trabajador", "actividad": "Actividad", "proyecto": "Proyecto"}
    nombre_de = lambda nivel: lambda i: nombres.get(nivel, {}).get(i) or f"{titulo[nivel]} {i}"

    salidas = []
    bloque = datos["eventos"]
    for j, nombre in enumerate(bloque["salidas"]):
        if derivado and nombre != OBJETIVO_INCIDENTES:
            continue
        y = datos["dias"][dias]["proyecto"] if derivado else bloque["y"][:, j]
        y_val = datos["dias"][dias]["proyecto_val"] if derivado else bloque["y_val"][:, j]
        p = convertir(bloque["p"][:, j])
        salida = prueba_red.evaluar_salida(y, p, convertir(bloque["logistica"][:, j]), convertir(bloque["prevalencia"][:, j]), bloque["semana"], y_val, convertir(bloque["p_val"][:, j]))
        salida.update(clave=nombre, grupo="eventos", ejemplos=prueba_red.ejemplos(np.asarray(y), p, bloque["semana"], bloque["entidad"], nombre_de("proyecto")))
        salidas.append(salida)

    bloque = datos.get("entidades")
    if bloque:
        for nivel in sorted(set(bloque["nivel"])):
            m, m_val = bloque["nivel"] == nivel, bloque["nivel_val"] == nivel
            y = datos["dias"][dias]["entidades"][m] if derivado else bloque["y"][m, 0]
            y_val = datos["dias"][dias]["entidades_val"][m_val] if derivado else bloque["y_val"][m_val, 0]
            p = convertir(bloque["p"][m, 0])
            salida = prueba_red.evaluar_salida(y, p, convertir(bloque["logistica"][m, 0]), convertir(bloque["prevalencia"][m, 0]), bloque["semana"][m], y_val, convertir(bloque["p_val"][m_val, 0]))
            salida.update(clave=str(nivel), grupo="entidades", ejemplos=prueba_red.ejemplos(np.asarray(y), p, bloque["semana"][m], bloque["entidad"][m], nombre_de(str(nivel))))
            salidas.append(salida)

    fechas = datos["eventos"]["semana"]
    resultado = {
        "entrenado_en": artefacto["entrenado_en"], "semanas_modelo": semanas, "horizonte_dias": dias,
        "desde": str(np.datetime_as_string(fechas.min(), unit="D")), "hasta": str(np.datetime_as_string(fechas.max(), unit="D")), "salidas": salidas,
    }
    if len(_pruebas_hechas) > 20:
        _pruebas_hechas.clear()
    _pruebas_hechas[clave] = resultado
    return resultado


# ------------------------------------------------------------------ entrenamiento en segundo plano

_estado = {}
_trazas = {}
_bloqueo = threading.Lock()


def consultar_traza(horizonte=4, desde=0, limite=200):
    """Fotos del entrenamiento en curso o, si no hay uno, del ultimo guardado."""
    traza = _trazas.get(horizonte)
    if traza is None:
        archivo = DIRECTORIO_RED / f"h{horizonte}.traza.joblib"
        if not archivo.exists():
            return {"estado": _estado.get(horizonte, {}).get("estado", "sin_entrenar"), "horizonte": horizonte, "total": 0, "fotos": []}
        traza = _trazas[horizonte] = joblib.load(archivo)
    return {"estado": _estado.get(horizonte, {}).get("estado", "listo"), "mensaje": _estado.get(horizonte, {}).get("mensaje"),
            **traza.pagina(desde, limite)}


def estado(horizonte=4):
    actual = dict(_estado.get(horizonte, {}))
    if actual.get("estado") == "entrenando":
        return actual
    artefacto = _cargar_artefacto(horizonte)
    if artefacto is None:
        return actual or {"estado": "sin_entrenar", "horizonte": horizonte}
    return {
        **actual, "estado": actual.get("estado", "listo") if actual.get("estado") == "error" else "listo", "horizonte": horizonte,
        "entrenado_en": artefacto["entrenado_en"], "conversion_dias": artefacto.get("conversion_dias"), "eventos": _resumen(artefacto["eventos"]),
        "entidades": _resumen(artefacto["entidades"]) if artefacto["entidades"] else None,
    }


def iniciar_entrenamiento(engine, horizonte=4):
    """Entrena en un hilo aparte: tarda mas de lo que una peticion web puede esperar."""
    with _bloqueo:
        if _estado.get(horizonte, {}).get("estado") == "entrenando":
            return False
        _estado[horizonte] = {"estado": "entrenando", "horizonte": horizonte,
                              "iniciado_en": datetime.now(timezone.utc).isoformat(timespec="seconds")}
        _trazas[horizonte] = Traza(horizonte)

    def tarea():
        try:
            entrenar(engine, horizonte, _trazas[horizonte])
            _estado[horizonte] = {"estado": "listo", "horizonte": horizonte}
        except Exception as exc:
            logging.getLogger(__name__).exception("Fallo el entrenamiento de la red neuronal.")
            _estado[horizonte] = {"estado": "error", "horizonte": horizonte, "mensaje": str(exc)}

    threading.Thread(target=tarea, daemon=True).start()
    return True


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--db", default=os.getenv("DATABASE_URL"))
    ap.add_argument("--horizonte", type=int, default=4)
    a = ap.parse_args()
    if not a.db:
        raise SystemExit("Define DATABASE_URL o usa --db.")
    artefacto = entrenar(create_engine(a.db), a.horizonte)
    for clave in ("eventos", "entidades"):
        ajuste = artefacto[clave]
        if not ajuste:
            print(f"\n[{clave}] sin datos suficientes")
            continue
        print(f"\n[{clave}] configuracion={ajuste['configuracion']} epocas={ajuste['epocas']} entrenamiento={ajuste['filas_entrenamiento']} validacion={ajuste['filas_validacion']} prueba={ajuste['filas_prueba']} variables={ajuste['variables']}")
        for nombre, f in ajuste["evaluacion"].items():
            print(f"  {nombre:26s} red AUC={f['red'].get('auc_roc', '-')} LL={f['red']['log_loss']} | "
                  f"logistica AUC={f.get('logistica', {}).get('auc_roc', '-')} LL={f.get('logistica', {}).get('log_loss', '-')} | "
                  f"prevalencia LL={f['prevalencia']['log_loss']} | mejora={f['mejora_log_loss_pct']}%")
        for nombre, f in ajuste["por_grupo"].items():
            print(f"  nivel {nombre:20s} red AUC={f['red'].get('auc_roc', '-')} LL={f['red']['log_loss']} | "
                  f"logistica AUC={f.get('logistica', {}).get('auc_roc', '-')} LL={f.get('logistica', {}).get('log_loss', '-')} | "
                  f"prevalencia LL={f['prevalencia']['log_loss']} | mejora={f['mejora_log_loss_pct']}%")


if __name__ == "__main__":
    main()
