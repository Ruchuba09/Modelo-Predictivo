"""Motor de riesgo: entrena y elige un modelo por cada tipo de entidad.

Niveles: proyecto, area, cuadrilla, trabajador, actividad y cliente (historial real).
Para cada nivel arma un panel entidad-semana sin fuga de datos, compara candidatos con
validacion temporal contra una referencia simple, calibra el ganador y explica cada
prediccion. Si ningun candidato supera a la referencia, publica la referencia.

Reporte por consola:
  python motor_riesgo.py --db postgresql+psycopg2://usuario:clave@host/base --horizonte 4

Datasets entidad-semana en CSV:
  python motor_riesgo.py --db ... --exportar carpeta
"""
import argparse
import hashlib
import json
import os
import threading
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, log_loss, roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sqlalchemy import create_engine, inspect, text
from threadpoolctl import threadpool_limits

from modelo_predictivo import OBJETIVO_INCIDENTES, TIPOS_SEGUIMIENTO, filtrar_objetivo
from riesgos_texto import RIESGOS, etiquetas_riesgo

TIPOS_PROACTIVOS = frozenset({
    "hallazgo", "no_conformidad", "observacion_preventiva", "observacion_de_seguridad",
    "reporte_previene", "tarjeta_pare",
})
VENTANAS = (1, 2, 4, 8, 13, 26)
MIN_POSITIVOS = 20
MIN_NEGATIVOS = 20
MIN_ENTIDADES = 3
FOLDS = (0.55, 0.70, 0.85)
PRIOR_REFERENCIA = 20
N_EXPLICADAS = 12
MAX_FILAS_ENTRENAMIENTO = 5000
MAX_FILAS_IMPORTANCIA = 800
N_FACTORES = 4
DIRECTORIO_MODELOS = Path(os.getenv("MODELOS_DIR", Path(__file__).resolve().parent / "models"))

ETIQUETAS_BASE = {
    "objetivo": "incidentes", "total": "eventos", "proactivo": "reportes preventivos",
    "pare": "tarjetas PARE", "noche": "eventos en turno noche",
}
ETIQUETAS = {
    "sem_desde_ultimo": "semanas desde el último incidente",
    "tasa_historica": "tasa histórica de incidentes",
    "tasa_por_persona_u13": "incidentes por persona (13 semanas)",
    "tendencia": "tendencia de incidentes",
    "ewm_objetivo": "incidentes recientes (ponderado)",
    "abiertos": "reportes pendientes de cierre",
    "ratio_proactivo": "razón preventivo / reactivo",
    "recurrencia_u13": "repetición de una misma condición",
    "sev_max_u13": "severidad máxima (13 semanas)",
    "edad": "semanas de actividad",
    "tamano": "personas expuestas",
    "global_objetivo_u8": "incidentes en toda la empresa (8 semanas)",
    "mes_sin": "época del año", "mes_cos": "época del año",
    "padre_objetivo_u4": "incidentes del proyecto (4 semanas)",
    "padre_objetivo_u13": "incidentes del proyecto (13 semanas)",
    "padre_proactivo_u4": "reportes preventivos del proyecto (4 semanas)",
}


def etiqueta(variable):
    if variable in ETIQUETAS:
        return ETIQUETAS[variable]
    for base, nombre in ETIQUETAS_BASE.items():
        if variable.startswith(f"{base}_u"):
            return f"{nombre} ({variable.rsplit('_u', 1)[1]} semanas)"
    if variable.startswith("riesgo_"):
        return f"eventos de {variable[7:].rsplit('_u', 1)[0].replace('_', ' ')}"
    if variable.startswith("condicion_"):
        return f"condición PARE {variable.split('_')[1]}"
    return variable.replace("_prev", " (semana anterior)").replace("_", " ")


def lunes(serie):
    fechas = pd.to_datetime(serie)
    return (fechas - pd.to_timedelta(fechas.dt.weekday, unit="D")).dt.normalize()


def semana_actual(hoy=None):
    hoy = pd.Timestamp.today().normalize() if hoy is None else hoy
    return hoy - pd.Timedelta(days=hoy.weekday())


def construir_panel(spine, eventos, h, cats=(), numericas=(), padre=None, global_semanal=None, hoy=None):
    """Arma el panel entidad-semana. Toda variable historica usa solo semanas anteriores a t.

    spine: entidad, semana y atributos. eventos: entidad, fecha, fecha_cierre, objetivo,
    proactivo, pare, severidad, condicion, noche y riesgos (lista de etiquetas).
    """
    df = spine.sort_values(["entidad", "semana"]).drop_duplicates(["entidad", "semana"]).reset_index(drop=True)
    ev = eventos.copy()
    ev["semana"] = lunes(ev["fecha"])
    for columna in ("objetivo", "proactivo", "pare", "noche"):
        ev[columna] = ev[columna].fillna(False).astype(bool)
    ev["severidad"] = pd.to_numeric(ev["severidad"], errors="coerce")
    claves = ["entidad", "semana"]
    semanal = ev.groupby(claves).agg(
        n_objetivo=("objetivo", "sum"), n_total=("objetivo", "size"), n_proactivo=("proactivo", "sum"),
        n_pare=("pare", "sum"), n_noche=("noche", "sum"), n_sev=("severidad", "max"),
    ).reset_index()
    df = df.merge(semanal, how="left", on=claves)
    conteos = ["n_objetivo", "n_total", "n_proactivo", "n_pare", "n_noche"]
    df[conteos] = df[conteos].fillna(0)

    def rodar(serie, ventana, agg="sum"):
        retrasada = serie.groupby(df["entidad"]).shift(1)
        rodante = retrasada.groupby(df["entidad"]).rolling(ventana, min_periods=1)
        return getattr(rodante, agg)().reset_index(level=0, drop=True).sort_index()

    feats = {}
    for base in ("objetivo", "total", "proactivo", "pare", "noche"):
        for w in VENTANAS if base in ("objetivo", "total", "proactivo") else (4, 13):
            feats[f"{base}_u{w}"] = rodar(df[f"n_{base}"], w)
    feats["sev_max_u13"] = rodar(df["n_sev"], 13, "max")

    # Etiquetas de riesgo extraidas del texto
    if "riesgos" in ev and ev["riesgos"].map(bool).any():
        explotado = ev[ev["riesgos"].map(bool)].explode("riesgos")
        por_riesgo = explotado.groupby(claves + ["riesgos"]).size().unstack(fill_value=0)
        por_riesgo = df[claves].merge(por_riesgo.reset_index(), how="left", on=claves).fillna(0)
        for riesgo in RIESGOS:
            if riesgo in por_riesgo:
                feats[f"riesgo_{riesgo}_u13"] = rodar(por_riesgo[riesgo], 13)

    # Condiciones PARE y repeticion de una misma condicion
    con_condicion = ev.dropna(subset=["condicion"])
    if not con_condicion.empty:
        por_condicion = con_condicion.groupby(claves + ["condicion"]).size().unstack(fill_value=0)
        por_condicion = df[claves].merge(por_condicion.reset_index(), how="left", on=claves).fillna(0)
        rodadas = {}
        for condicion in [c for c in por_condicion.columns if c not in claves]:
            rodadas[f"condicion_{int(condicion)}_u13"] = rodar(por_condicion[condicion], 13)
        feats.update(rodadas)
        feats["recurrencia_u13"] = pd.DataFrame(rodadas).max(axis=1)

    agrupado = df.groupby("entidad", sort=False)
    lag_objetivo = agrupado["n_objetivo"].shift(1)
    feats["ewm_objetivo"] = lag_objetivo.groupby(df["entidad"]).transform(lambda s: s.ewm(halflife=6).mean())
    df["edad"] = agrupado.cumcount()
    feats["edad"] = df["edad"]
    acumulado = lag_objetivo.groupby(df["entidad"]).cumsum()
    feats["tasa_historica"] = acumulado / df["edad"].replace(0, np.nan)
    feats["tendencia"] = feats["objetivo_u4"] - (feats["objetivo_u8"] - feats["objetivo_u4"])
    feats["ratio_proactivo"] = feats["proactivo_u13"] / (feats["objetivo_u13"] + 1)

    ultimo = df["semana"].where(df["n_objetivo"] > 0).groupby(df["entidad"]).transform(lambda s: s.shift(1).ffill())
    feats["sem_desde_ultimo"] = (df["semana"] - ultimo).dt.days / 7

    # Pendientes al inicio de la semana: creados menos cerrados en semanas anteriores
    cerrados = ev.dropna(subset=["fecha_cierre"]).assign(semana=lambda d: lunes(d["fecha_cierre"]))
    cerrados = cerrados.groupby(claves).size().rename("n_cierres").reset_index()
    df = df.merge(cerrados, how="left", on=claves)
    df["n_cierres"] = df["n_cierres"].fillna(0)
    creados_ac = df["n_total"].groupby(df["entidad"]).cumsum().groupby(df["entidad"]).shift(1)
    cerrados_ac = df["n_cierres"].groupby(df["entidad"]).cumsum().groupby(df["entidad"]).shift(1)
    feats["abiertos"] = (creados_ac - cerrados_ac).clip(lower=0)

    mes = df["semana"].dt.month
    feats["mes_sin"] = np.sin(2 * np.pi * mes / 12)
    feats["mes_cos"] = np.cos(2 * np.pi * mes / 12)

    if "tamano" in df:
        feats["tamano"] = df["tamano"]
        feats["tasa_por_persona_u13"] = feats["objetivo_u13"] / df["tamano"].replace(0, np.nan)
    for columna in numericas:
        if columna in df and columna != "tamano":
            feats[columna] = df[columna]

    if global_semanal is not None:
        feats["global_objetivo_u8"] = df["semana"].map(global_semanal)

    X = pd.DataFrame(feats, index=df.index)
    if padre is not None and "id_proyecto" in df:
        extra = df[["id_proyecto", "semana"]].merge(padre, how="left", on=["id_proyecto", "semana"])
        extra.index = df.index
        X = pd.concat([X, extra.drop(columns=["id_proyecto", "semana"])], axis=1)

    for columna in cats:
        X[columna] = df[columna].astype("object").where(df[columna].notna(), "desconocido").astype(str).astype("category")

    futuro = agrupado["n_objetivo"].transform(lambda s: s[::-1].rolling(h, min_periods=1).sum()[::-1])
    meta = df[claves].copy()
    if "id_proyecto" in df:
        meta["id_proyecto"] = df["id_proyecto"]
    meta["y"] = (futuro > 0).astype(int)
    meta["sem_restantes"] = agrupado.cumcount(ascending=False)
    ultima = df["semana"] + pd.Timedelta(weeks=h - 1)
    meta["observada"] = (meta["sem_restantes"] >= h - 1) & (ultima < semana_actual(hoy))
    return X, meta


def _preprocesador(X, cats):
    numericas = [c for c in X.columns if c not in cats]
    return ColumnTransformer([
        ("num", make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), numericas),
        ("cat", OneHotEncoder(handle_unknown="ignore", min_frequency=5), list(cats)),
    ])


def candidatos(X, cats):
    gb = {"categorical_features": "from_dtype", "random_state": 0}
    return {
        "Regresión logística regularizada": lambda: make_pipeline(
            _preprocesador(X, cats), LogisticRegression(C=0.1, max_iter=2000)),
        "Regresión logística": lambda: make_pipeline(
            _preprocesador(X, cats), LogisticRegression(C=1.0, max_iter=2000)),
        "Gradient boosting conservador": lambda: HistGradientBoostingClassifier(
            max_depth=3, learning_rate=0.06, max_iter=80, min_samples_leaf=30, l2_regularization=5, **gb),
        "Gradient boosting": lambda: HistGradientBoostingClassifier(
            max_depth=4, learning_rate=0.08, max_iter=120, min_samples_leaf=20, l2_regularization=1, **gb),
        "Bosque aleatorio": lambda: make_pipeline(
            _preprocesador(X, cats),
            RandomForestClassifier(n_estimators=80, max_depth=10, min_samples_leaf=10, max_features="sqrt", random_state=0)),
    }


def _tasa_referencia(entrenamiento, evaluacion):
    """Tasa historica de cada entidad suavizada hacia la tasa global."""
    prior = float(entrenamiento["y"].mean())
    grupo = entrenamiento.groupby("entidad")["y"].agg(["sum", "count"])
    tasas = (grupo["sum"] + prior * PRIOR_REFERENCIA) / (grupo["count"] + PRIOR_REFERENCIA)
    return evaluacion["entidad"].map(tasas).fillna(prior).to_numpy()


def _indices_entrenamiento(y, semilla=0):
    """Limita las filas conservando todos los positivos; la calibracion corrige la proporcion."""
    if len(y) <= MAX_FILAS_ENTRENAMIENTO:
        return y.index
    positivos = y.index[y == 1]
    negativos = y.index[y == 0]
    cupo = max(MAX_FILAS_ENTRENAMIENTO - len(positivos), len(positivos))
    if cupo < len(negativos):
        negativos = negativos[np.sort(np.random.default_rng(semilla).choice(len(negativos), cupo, replace=False))]
    return positivos.union(negativos)


def _ajustar(fabrica, X, y):
    filas = _indices_entrenamiento(y)
    return fabrica().fit(X.loc[filas], y.loc[filas])


def _logit(p):
    p = np.clip(p, 1e-6, 1 - 1e-6)
    return np.log(p / (1 - p)).reshape(-1, 1)


def _metricas(y, p):
    p = np.clip(p, 1e-6, 1 - 1e-6)
    return {
        "auc_roc": round(float(roc_auc_score(y, p)), 4),
        "auc_pr": round(float(average_precision_score(y, p)), 4),
        "brier": round(float(brier_score_loss(y, p)), 4),
        "log_loss": round(float(log_loss(y, p)), 4),
    }


def calidad_discriminacion(auc):
    return "alta" if auc >= 0.8 else "media" if auc >= 0.7 else "baja" if auc >= 0.6 else "muy baja"


def seleccionar_modelo(X, meta, cats, h):
    """Compara candidatos con validacion temporal por etapas y devuelve el resumen del nivel."""
    observadas = meta["observada"]
    Xo, mo = X[observadas], meta[observadas]
    positivos = int(mo["y"].sum())
    resumen = {
        "filas": len(mo), "positivos": positivos, "entidades": int(mo["entidad"].nunique()),
        "prevalencia": round(float(mo["y"].mean()), 4) if len(mo) else None,
        "publicado": False, "modelo": None, "metodo": None,
    }
    if positivos < MIN_POSITIVOS or len(mo) - positivos < MIN_NEGATIVOS or resumen["entidades"] < MIN_ENTIDADES:
        resumen["motivo"] = (
            f"Datos insuficientes: {positivos} positivos, {len(mo) - positivos} negativos y "
            f"{resumen['entidades']} entidades (mínimos: {MIN_POSITIVOS}, {MIN_NEGATIVOS} y {MIN_ENTIDADES})."
        )
        return resumen, None

    # Se quitan variables sin informacion para que no agreguen ruido
    utiles = [c for c in Xo.columns if c in cats or Xo[c].notna().any() and Xo[c].nunique(dropna=True) > 1]
    Xo = Xo[utiles]
    fabricas = candidatos(Xo, [c for c in cats if c in utiles])
    cortes = [mo["semana"].quantile(q) for q in FOLDS] + [mo["semana"].max() + pd.Timedelta(days=1)]
    fuera = {nombre: ([], []) for nombre in [*fabricas, "Referencia"]}
    ultimo_tramo = None
    folds_validos = 0
    for inicio, fin in zip(cortes, cortes[1:]):
        en_train = mo["semana"] < inicio - pd.Timedelta(weeks=h)
        en_test = (mo["semana"] >= inicio) & (mo["semana"] < fin)
        if mo.loc[en_train, "y"].nunique() < 2 or mo.loc[en_test, "y"].nunique() < 2:
            continue
        folds_validos += 1
        fuera["Referencia"][0].extend(mo.loc[en_test, "y"])
        fuera["Referencia"][1].extend(_tasa_referencia(mo[en_train], mo[en_test]))
        for nombre, fabrica in fabricas.items():
            modelo = _ajustar(fabrica, Xo[en_train], mo.loc[en_train, "y"])
            fuera[nombre][0].extend(mo.loc[en_test, "y"])
            fuera[nombre][1].extend(modelo.predict_proba(Xo[en_test])[:, 1])
        ultimo_tramo = (en_train, en_test)
    if folds_validos < 2:
        resumen["motivo"] = "La validación temporal no tiene ambas clases en suficientes tramos."
        return resumen, None

    tabla = {nombre: _metricas(np.array(y), np.array(p)) for nombre, (y, p) in fuera.items()}
    referencia = tabla["Referencia"]
    ganador = min(fabricas, key=lambda nombre: tabla[nombre]["log_loss"])
    resumen["candidatos"] = tabla
    resumen["referencia"] = referencia
    resumen["filas_validacion"] = len(fuera["Referencia"][0])
    resumen["folds"] = folds_validos

    tasas_finales = mo.groupby("entidad")["y"].agg(["sum", "count"])
    prior = float(mo["y"].mean())
    tasas_finales = (tasas_finales["sum"] + prior * PRIOR_REFERENCIA) / (tasas_finales["count"] + PRIOR_REFERENCIA)
    if tabla[ganador]["log_loss"] >= referencia["log_loss"]:
        resumen.update({
            "metodo": "referencia", "modelo": "Tasa histórica suavizada", "publicado": True,
            "metricas": referencia, "discriminacion": calidad_discriminacion(referencia["auc_roc"]),
            "motivo": f"Ningún modelo superó a la tasa histórica (mejor candidato: {ganador}).",
        })
        return resumen, {"tasas": tasas_finales.to_dict(), "prior": prior}

    y_fuera, p_fuera = map(np.array, fuera[ganador])
    calibrador = LogisticRegression(C=10.0).fit(_logit(p_fuera), y_fuera)
    calibradas = calibrador.predict_proba(_logit(p_fuera))[:, 1]
    resumen.update({
        "metodo": "modelo", "modelo": ganador, "publicado": True, "metricas": tabla[ganador],
        "brier_calibrado": round(float(brier_score_loss(y_fuera, calibradas)), 4),
        "mejora_log_loss_pct": round(100 * (referencia["log_loss"] - tabla[ganador]["log_loss"]) / referencia["log_loss"], 2),
        "discriminacion": calidad_discriminacion(tabla[ganador]["auc_roc"]),
    })
    if tabla[ganador]["auc_roc"] < 0.6:
        resumen["motivo"] = (
            f"Capacidad de distinguir riesgo muy baja (AUC-ROC {tabla[ganador]['auc_roc']:.2f}): úsese solo como orientación."
        )

    # Importancia medida con datos futuros al entrenamiento: refleja lo que sirve para predecir
    en_train, en_test = ultimo_tramo
    modelo_tramo = _ajustar(fabricas[ganador], Xo[en_train], mo.loc[en_train, "y"])
    muestra = mo.loc[en_test].sample(min(MAX_FILAS_IMPORTANCIA, int(en_test.sum())), random_state=0).index
    numericas = [c for c in Xo.columns if c not in cats]
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        permutacion = permutation_importance(
            modelo_tramo, Xo.loc[muestra], mo.loc[muestra, "y"], scoring="neg_log_loss", n_repeats=3, random_state=0, n_jobs=1,
        )
    orden = pd.Series(permutacion.importances_mean, index=Xo.columns).sort_values(ascending=False)
    resumen["importancia"] = [
        {"variable": v, "etiqueta": etiqueta(v), "importancia": round(float(i), 5)}
        for v, i in orden.head(10).items() if i > 0
    ]
    explicables = [v for v in orden.index if v in numericas][:N_EXPLICADAS]

    final = _ajustar(fabricas[ganador], Xo, mo["y"])
    return resumen, {
        "modelo": final, "calibrador": calibrador, "columnas": list(Xo.columns),
        "explicables": explicables, "medianas": Xo[numericas].median().to_dict(),
    }


def predecir(ajuste, resumen, X, meta, hoy=None):
    """Probabilidad y factores principales de cada entidad activa en la semana actual."""
    actuales = meta["semana"] == semana_actual(hoy)
    filas = meta[actuales]
    if filas.empty or ajuste is None:
        return {}
    if "tasas" in ajuste:
        return {
            int(e): {"prob": round(float(ajuste["tasas"].get(e, ajuste["prior"])), 6), "metodo": resumen["metodo"],
                     "modelo": resumen["modelo"], "factores": []}
            for e in filas["entidad"]
        }
    Xa = X.loc[filas.index, ajuste["columnas"]]
    crudas = ajuste["modelo"].predict_proba(Xa)[:, 1]
    probs = ajuste["calibrador"].predict_proba(_logit(crudas))[:, 1]

    # Efecto local: cuanto cambia el riesgo si la variable vuelve a su valor tipico
    efectos = {}
    for variable in ajuste["explicables"]:
        copia = Xa.copy()
        copia[variable] = ajuste["medianas"].get(variable, np.nan)
        neutras = ajuste["calibrador"].predict_proba(_logit(ajuste["modelo"].predict_proba(copia)[:, 1]))[:, 1]
        efectos[variable] = probs - neutras

    salida = {}
    for i, entidad in enumerate(filas["entidad"]):
        principales = sorted(efectos, key=lambda v: abs(efectos[v][i]), reverse=True)[:N_FACTORES]
        salida[int(entidad)] = {
            "prob": round(float(probs[i]), 6), "metodo": resumen["metodo"], "modelo": resumen["modelo"],
            "factores": [
                {"variable": v, "etiqueta": etiqueta(v), "valor": None if pd.isna(Xa[v].iloc[i]) else round(float(Xa[v].iloc[i]), 3),
                 "efecto": round(float(efectos[v][i]), 4)}
                for v in principales if abs(efectos[v][i]) >= 0.002
            ],
        }
    return salida


# ---------------------------------------------------------------- lectura de datos

def _leer(engine, sql, **params):
    return pd.read_sql(text(sql), engine, params=params or None)


def cargar_base(engine):
    """Lee eventos de todas las fuentes y la estructura operativa."""
    tipo = "lower(regexp_replace(trim(te.nombre), '[[:space:]]+', '_', 'g'))"
    eventos = _leer(engine, f"""
        SELECT 'e' || e.id_evento AS clave, e.id_evento, e.id_proyecto, e.id_area, e.id_actividad, e.id_trabajador,
               {tipo} AS tipo,
               CASE WHEN e.severidad ILIKE 'baja%' THEN 1 WHEN e.severidad ILIKE 'media%' THEN 2
                    WHEN e.severidad ILIKE 'alta%' THEN 3
                    WHEN e.severidad ILIKE ANY (ARRAY['cr_tic%', 'grave%']) THEN 4 END AS severidad,
               COALESCE(e.fecha_ocurrencia, e.fecha_creacion) AS fecha, e.fecha_cierre,
               e.condicion, ct.nombre AS turno, e.descripcion AS texto
        FROM public.eventos e
        JOIN public.tipo_eventos te USING (id_tipo_evento)
        LEFT JOIN public.cat_turno ct ON ct.id_turno = e.id_turno
        WHERE e.id_proyecto IS NOT NULL
        UNION ALL
        SELECT 'p' || id_local, NULL, id_proyecto, id_area, NULL, NULL, 'reporte_previene', urgencia,
               fecha::timestamp, cierre_fecha::timestamp, NULL, NULL, descripcion
        FROM public.reportes_previene_intrava WHERE id_proyecto IS NOT NULL AND fecha IS NOT NULL
        UNION ALL
        SELECT 'f' || id_local, NULL, id_proyecto, id_area, NULL, NULL, 'reporte_flash', NULL,
               fecha::timestamp, NULL, NULL, turno, descripcion
        FROM public.reportes_flash_intrava WHERE id_proyecto IS NOT NULL AND fecha IS NOT NULL
        UNION ALL
        SELECT 'h' || id_intrava, NULL, id_proyecto, NULL, NULL, NULL, 'hallazgo', NULL,
               COALESCE(fecha_deteccion, fecha_creacion)::timestamp, fecha_cierre::timestamp, NULL, NULL,
               requisito_incumplido
        FROM public.hallazgos_intrava
        WHERE id_proyecto IS NOT NULL AND COALESCE(fecha_deteccion, fecha_creacion) IS NOT NULL
    """)
    eventos["fecha"] = pd.to_datetime(eventos["fecha"])
    eventos["fecha_cierre"] = pd.to_datetime(eventos["fecha_cierre"])
    eventos["proactivo"] = eventos["tipo"].isin(TIPOS_PROACTIVOS)
    eventos["pare"] = eventos["tipo"] == "tarjeta_pare"
    eventos["noche"] = eventos["turno"].fillna("").str.lower().str.startswith("noche") | (
        eventos["fecha"].dt.hour.between(20, 23) | eventos["fecha"].dt.hour.between(0, 5))
    eventos["riesgos"] = eventos["texto"].map(etiquetas_riesgo)
    eventos = eventos.drop(columns=["texto", "turno"])

    participantes = _leer(engine, """
        SELECT id_evento, id_trabajador FROM public.evento_trabajador
        UNION SELECT id_evento, id_trabajador FROM public.eventos WHERE id_trabajador IS NOT NULL
    """)
    base = {
        "eventos": eventos,
        "participantes": participantes,
        "proyectos": _leer(engine, "SELECT id_proyecto, id_cliente, id_faena, fecha_inicio, fecha_termino FROM public.proyectos"),
        "semanas": _leer(engine, "SELECT id_proyecto, semana FROM public.v_proyecto_semanas"),
        "contexto": _leer(engine, "SELECT * FROM public.v_proyecto_semana_contexto"),
        "areas": _leer(engine, "SELECT id_area, id_faena FROM public.areas"),
        "asignaciones": _leer(engine, "SELECT id_asignacion, id_cuadrilla, id_proyecto, fecha_inicio, fecha_termino FROM public.asignaciones"),
        "membresia": _leer(engine, "SELECT id_trabajador, id_cuadrilla, fecha_inicio, fecha_fin FROM public.trabajadores_cuadrillas"),
        "obreros": _leer(engine, """
            SELECT o.id_trabajador, o.id_cuadrilla, t.cargo FROM public.obreros o
            JOIN public.trabajadores t USING (id_trabajador) WHERE o.id_cuadrilla IS NOT NULL
        """),
        "actividades": _leer(engine, """
            SELECT ac.id_actividad, a.id_proyecto, COALESCE(ac.fecha_inicio, a.fecha_inicio) AS inicio,
                   COALESCE(ac.fecha_termino, a.fecha_termino) AS termino
            FROM public.actividades ac JOIN public.asignaciones a USING (id_asignacion)
        """),
    }
    inspector = inspect(engine)
    base["extra"] = (
        _leer(engine, "SELECT * FROM public.v_proyecto_semana_extra")
        if inspector.has_table("v_proyecto_semana_extra") or "v_proyecto_semana_extra" in inspector.get_view_names()
        else pd.DataFrame()
    )
    base["historicos"] = (
        _leer(engine, "SELECT * FROM public.incidentes_historicos")
        if inspector.has_table("incidentes_historicos") else pd.DataFrame()
    )
    for tabla, columnas in {
        "semanas": ["semana"], "contexto": ["semana"], "asignaciones": ["fecha_inicio", "fecha_termino"],
        "membresia": ["fecha_inicio", "fecha_fin"], "actividades": ["inicio", "termino"], "extra": ["semana"],
    }.items():
        for columna in columnas:
            if not base[tabla].empty:
                base[tabla][columna] = pd.to_datetime(base[tabla][columna])
    return base


def huella_datos(engine, tipo_obj, horizonte, hoy=None):
    """Identifica el estado de los datos: si no cambia, se reutiliza lo entrenado."""
    consultas = [
        "SELECT count(*), max(fecha_actualizacion)::text FROM public.eventos",
        "SELECT count(*), max(sincronizado_en)::text FROM public.reportes_previene_intrava",
        "SELECT count(*), max(sincronizado_en)::text FROM public.reportes_flash_intrava",
        "SELECT count(*), max(sincronizado_en)::text FROM public.hallazgos_intrava",
        "SELECT count(*), max(fecha_inicio)::text FROM public.asignaciones",
        "SELECT count(*), max(fecha_inicio)::text FROM public.trabajadores_cuadrillas",
    ]
    estado = [str(semana_actual(hoy).date()), tipo_obj, horizonte, 2]
    with engine.connect() as conexion:
        estado += [list(conexion.execute(text(c)).one()) for c in consultas]
        if inspect(engine).has_table("incidentes_historicos"):
            estado.append(list(conexion.execute(text("SELECT count(*), max(fecha)::text FROM public.incidentes_historicos")).one()))
    return hashlib.sha256(json.dumps(estado, default=str).encode()).hexdigest()[:24]


def _semanas(inicio, fin, hoy=None):
    tope = semana_actual(hoy)
    if pd.isna(inicio):
        return pd.DatetimeIndex([])
    inicio = inicio - pd.Timedelta(days=inicio.weekday())
    fin = tope if pd.isna(fin) else min(fin - pd.Timedelta(days=fin.weekday()), tope)
    return pd.date_range(inicio, fin, freq="7D")


def _expandir(filas, clave, inicio, fin, atributos=(), hoy=None):
    registros = []
    for _, f in filas.iterrows():
        for semana in _semanas(f[inicio], f[fin], hoy):
            registros.append({"entidad": int(f[clave]), "semana": semana, **{a: f[a] for a in atributos}})
    return pd.DataFrame(registros, columns=["entidad", "semana", *atributos])


def _membresia(base):
    """Membresia con fechas; las cuadrillas sin historial usan su composicion actual."""
    membresia = base["membresia"].copy()
    sin_historial = base["obreros"][~base["obreros"]["id_cuadrilla"].isin(membresia["id_cuadrilla"])]
    if not sin_historial.empty:
        actual = sin_historial[["id_trabajador", "id_cuadrilla"]].assign(
            fecha_inicio=pd.Timestamp("1900-01-01"), fecha_fin=pd.NaT)
        membresia = pd.concat([membresia, actual], ignore_index=True)
    return membresia


def construir_niveles(base, tipo_obj, h, hoy=None):
    """Devuelve (spine, eventos, cats, numericas) de cada nivel y las tablas del proyecto."""
    eventos = base["eventos"]
    objetivo = filtrar_objetivo(eventos, tipo_obj).index
    eventos = eventos.assign(objetivo=eventos.index.isin(objetivo))
    eventos = eventos[~eventos["tipo"].isin(TIPOS_SEGUIMIENTO)]
    proyectos = base["proyectos"]

    spine_p = base["semanas"].merge(base["contexto"], how="left", on=["id_proyecto", "semana"]).merge(proyectos, on="id_proyecto")
    spine_p = spine_p.assign(entidad=spine_p["id_proyecto"], tamano=spine_p["n_obreros"])
    numericas = ["n_cuadrillas", "n_supervisores", "n_actividades"]
    extra_cols = []
    if not base["extra"].empty:
        extra = base["extra"].sort_values(["id_proyecto", "semana"]).copy()
        for columna in [c for c in extra.columns if c not in ("id_proyecto", "semana")]:
            if extra[columna].notna().any():
                nombre = columna if columna == "avance_planificado_pct" else f"{columna}_prev"
                extra[nombre] = pd.to_numeric(extra[columna], errors="coerce") if nombre == columna else \
                    pd.to_numeric(extra[columna], errors="coerce").groupby(extra["id_proyecto"]).shift(1)
                extra_cols.append(nombre)
        spine_p = spine_p.merge(extra[["id_proyecto", "semana", *extra_cols]], how="left", on=["id_proyecto", "semana"])
    ev_p = eventos.assign(entidad=eventos["id_proyecto"])
    niveles = {"proyecto": (spine_p, ev_p, ["id_cliente", "id_faena"], numericas + extra_cols)}

    con_faena = base["semanas"].merge(proyectos[["id_proyecto", "id_cliente", "id_faena"]], on="id_proyecto")
    spine_a = con_faena.merge(base["areas"], on="id_faena").rename(columns={"id_area": "entidad"})
    if not spine_a.empty:
        niveles["area"] = (spine_a, eventos.dropna(subset=["id_area"]).assign(entidad=lambda d: d["id_area"].astype(int)),
                           ["id_cliente", "id_faena"], [])

    membresia = _membresia(base)
    asignaciones = base["asignaciones"]
    if not asignaciones.empty:
        spine_c = _expandir(asignaciones, "id_cuadrilla", "fecha_inicio", "fecha_termino", ["id_proyecto"], hoy)
        if not spine_c.empty:
            spine_c = spine_c.merge(proyectos[["id_proyecto", "id_cliente"]], on="id_proyecto")
            spine_c = spine_c.sort_values("semana").drop_duplicates(["entidad", "semana"], keep="last")
            tam = membresia.merge(spine_c[["entidad", "semana"]], left_on="id_cuadrilla", right_on="entidad")
            tam = tam[(tam["fecha_inicio"] <= tam["semana"] + pd.Timedelta(days=6)) &
                      (tam["fecha_fin"].isna() | (tam["fecha_fin"] >= tam["semana"]))]
            spine_c = spine_c.merge(tam.groupby(["entidad", "semana"])["id_trabajador"].nunique().rename("tamano").reset_index(),
                                    how="left", on=["entidad", "semana"])
            spine_c["tamano"] = spine_c["tamano"].fillna(0)
            con_personas = eventos.dropna(subset=["id_evento"]).merge(base["participantes"].drop_duplicates(),
                                                                      left_on="id_evento", right_on="id_evento",
                                                                      suffixes=("_principal", ""))
            ev_c = con_personas.merge(membresia, on="id_trabajador", suffixes=("", "_m"))
            ev_c = ev_c[(ev_c["fecha"] >= ev_c["fecha_inicio"]) & (ev_c["fecha_fin"].isna() | (ev_c["fecha"] <= ev_c["fecha_fin"]))]
            ev_c = ev_c.drop_duplicates(["clave", "id_cuadrilla"]).assign(entidad=lambda d: d["id_cuadrilla"].astype(int))
            niveles["cuadrilla"] = (spine_c, ev_c, ["id_cliente"], [])

            tramos = membresia.merge(asignaciones, on="id_cuadrilla", suffixes=("_m", "_a"))
            tramos["ini"] = tramos[["fecha_inicio_m", "fecha_inicio_a"]].max(axis=1)
            tramos["fin"] = tramos[["fecha_fin", "fecha_termino"]].min(axis=1)
            tramos = tramos[tramos["fin"].isna() | (tramos["ini"] <= tramos["fin"])]
            spine_t = _expandir(tramos, "id_trabajador", "ini", "fin", ["id_proyecto", "id_cuadrilla"], hoy)
            if not spine_t.empty:
                spine_t = spine_t.sort_values("semana").drop_duplicates(["entidad", "semana"], keep="last")
                cargos = base["obreros"].drop_duplicates("id_trabajador").set_index("id_trabajador")["cargo"]
                spine_t["cargo"] = spine_t["entidad"].map(cargos)
                spine_t = spine_t.merge(spine_c[["entidad", "semana", "tamano"]].rename(columns={"entidad": "id_cuadrilla"}),
                                        how="left", on=["id_cuadrilla", "semana"])
                niveles["trabajador"] = (spine_t, con_personas.assign(entidad=lambda d: d["id_trabajador"].astype(int)),
                                         ["cargo"], [])

    if not base["actividades"].empty:
        spine_ac = _expandir(base["actividades"], "id_actividad", "inicio", "termino", ["id_proyecto"], hoy)
        if not spine_ac.empty:
            niveles["actividad"] = (spine_ac, eventos.dropna(subset=["id_actividad"]).assign(entidad=lambda d: d["id_actividad"].astype(int)),
                                    [], [])
    return niveles


def _tablas_padre(X, meta):
    padre = pd.DataFrame({
        "id_proyecto": meta["entidad"], "semana": meta["semana"],
        "padre_objetivo_u4": X["objetivo_u4"], "padre_objetivo_u13": X["objetivo_u13"],
        "padre_proactivo_u4": X["proactivo_u4"],
    })
    objetivos = meta.assign(n=X["objetivo_u1"]).groupby("semana")["n"].sum().sort_index()
    return padre, objetivos.rolling(8, min_periods=1).sum()


def entrenar(base, tipo_obj, h, hoy=None):
    """Entrena todos los niveles para un objetivo y horizonte."""
    niveles = construir_niveles(base, tipo_obj, h, hoy)
    resultado = {"niveles": {}, "predicciones": {}}
    padre, global_semanal = None, None
    orden = ["proyecto"] + [n for n in niveles if n != "proyecto"]
    for nivel in orden:
        spine, eventos, cats, numericas = niveles[nivel]
        if eventos.empty:
            resultado["niveles"][nivel] = {"publicado": False, "motivo": "Sin eventos asociados a este nivel.", "filas": 0}
            continue
        X, meta = construir_panel(spine, eventos, h, cats, numericas, padre, global_semanal, hoy)
        resumen, ajuste = seleccionar_modelo(X, meta, cats, h)
        resultado["niveles"][nivel] = resumen
        resultado["predicciones"][nivel] = predecir(ajuste, resumen, X, meta, hoy)
        if nivel == "proyecto":
            padre, global_semanal = _tablas_padre(X, meta)
    if not base["historicos"].empty:
        resultado["historial"] = entrenar_historial(base["historicos"], "laboral", h, hoy)
        lesiones = entrenar_historial(base["historicos"], "con_lesion", h, hoy)
        resultado["historial"]["lesiones"] = {k: lesiones[k] for k in ("calidad", "predicciones")}
    return resultado


def exportar_paneles(base, tipo_obj, h, carpeta):
    """Guarda el dataset entidad-semana de cada nivel para analizarlo fuera del servicio."""
    destino = Path(carpeta)
    destino.mkdir(parents=True, exist_ok=True)
    niveles = construir_niveles(base, tipo_obj, h)
    padre, global_semanal = None, None
    for nivel in ["proyecto"] + [n for n in niveles if n != "proyecto"]:
        spine, eventos, cats, numericas = niveles[nivel]
        if eventos.empty:
            continue
        X, meta = construir_panel(spine, eventos, h, cats, numericas, padre, global_semanal)
        pd.concat([meta, X], axis=1).to_csv(destino / f"dataset_{nivel}.csv", index=False)
        print(f"dataset_{nivel}.csv: {len(X)} filas, {X.shape[1]} variables")
        if nivel == "proyecto":
            padre, global_semanal = _tablas_padre(X, meta)


# ---------------------------------------------------------------- historial real

def patrones_historicos(historicos):
    """Tendencias descriptivas de los logs, sin datos personales."""
    h = historicos.copy()
    h["fecha"] = pd.to_datetime(h["fecha"])
    dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    conteo = lambda serie: {str(k): int(v) for k, v in serie.value_counts().items()}
    riesgos = h["riesgos"].fillna("").str.split(",").explode()
    horas = pd.to_numeric(h["hora"], errors="coerce").dropna()
    return {
        "total": len(h), "desde": str(h["fecha"].min().date()), "hasta": str(h["fecha"].max().date()),
        "con_lesion": int(h["con_lesion"].astype(bool).sum()),
        "por_anio": {str(k): int(v) for k, v in h.groupby(h["fecha"].dt.year).size().items()},
        "por_categoria": conteo(h["categoria"]),
        "por_cliente": conteo(h["cliente"]),
        "por_dia_semana": {dias[k]: int((h["fecha"].dt.weekday == k).sum()) for k in range(7)},
        "por_bloque_horario": {f"{k:02d}-{k + 3:02d}": int(((horas // 4 * 4) == k).sum()) for k in range(0, 24, 4)},
        "por_riesgo": conteo(riesgos[riesgos != ""]),
    }


def entrenar_historial(historicos, objetivo, h, hoy=None):
    """Modelo por cliente con los logs reales; es independiente de los proyectos del sistema."""
    datos = historicos[~historicos["cliente"].isin(["OTRO", "AVA"])].copy()
    datos["fecha"] = pd.to_datetime(datos["fecha"])
    nombres = {nombre: i for i, nombre in enumerate(sorted(datos["cliente"].unique()), start=1)}
    ev = pd.DataFrame({
        "entidad": datos["cliente"].map(nombres), "fecha": datos["fecha"], "fecha_cierre": pd.NaT,
        "objetivo": datos[objetivo].astype(bool),
        "proactivo": False, "pare": False, "severidad": datos["categoria"].map({"fatal": 4, "lesion_ctp": 3, "lesion_stp": 2}),
        "condicion": np.nan, "noche": datos["turno"].eq("noche"),
        "riesgos": datos["riesgos"].fillna("").map(lambda r: [x for x in r.split(",") if x]),
    })
    rango = ev.groupby("entidad")["fecha"].agg(["min", "max"]).reset_index()
    # Un cliente sin incidentes en 26 semanas se considera sin obra activa conocida
    tope = semana_actual(hoy)
    rango["fin"] = rango["max"].where(rango["max"] < tope - pd.Timedelta(weeks=26), tope)
    spine = _expandir(rango, "entidad", "min", "fin", hoy=hoy)
    X, meta = construir_panel(spine, ev, h, hoy=hoy)
    resumen, ajuste = seleccionar_modelo(X, meta, (), h)
    predicciones = predecir(ajuste, resumen, X, meta, hoy)
    inverso = {i: nombre for nombre, i in nombres.items()}
    return {
        "calidad": resumen,
        "predicciones": sorted(
            ({"cliente": inverso[e], **p} for e, p in predicciones.items()),
            key=lambda item: item["prob"], reverse=True,
        ),
        "patrones": patrones_historicos(historicos),
    }


# ---------------------------------------------------------------- cache de entrenamiento

_bloqueo = threading.Lock()
_memoria = {}


def obtener_modelos(engine, tipo_obj=OBJETIVO_INCIDENTES, horizonte=4, forzar=False):
    """Devuelve lo entrenado para estos datos; solo reentrena si cambiaron o cambia la semana."""
    huella = huella_datos(engine, tipo_obj, horizonte)
    with _bloqueo:
        if not forzar and huella in _memoria:
            return _memoria[huella]
        archivo = DIRECTORIO_MODELOS / f"{huella}.joblib"
        if not forzar and archivo.exists():
            _memoria[huella] = joblib.load(archivo)
            return _memoria[huella]
        # Con paneles de este tamano, varios hilos de OpenMP dentro de un servidor son mucho mas lentos.
        with warnings.catch_warnings(), threadpool_limits(limits=1):
            warnings.simplefilter("ignore")
            resultado = entrenar(cargar_base(engine), tipo_obj, horizonte)
        resultado["huella"] = huella
        _memoria[huella] = resultado
        try:
            DIRECTORIO_MODELOS.mkdir(parents=True, exist_ok=True)
            for viejo in DIRECTORIO_MODELOS.glob("*.joblib"):
                if (pd.Timestamp.now() - pd.Timestamp(viejo.stat().st_mtime, unit="s")).days > 7:
                    viejo.unlink()
            joblib.dump(resultado, archivo)
        except OSError:
            pass  # Sin disco disponible, el resultado sigue en memoria.
        return resultado


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--db", default=os.getenv("DATABASE_URL"))
    ap.add_argument("--tipo-objetivo", default=OBJETIVO_INCIDENTES)
    ap.add_argument("--horizonte", type=int, default=4)
    ap.add_argument("--exportar", help="carpeta para guardar los datasets en CSV, sin entrenar")
    a = ap.parse_args()
    if not a.db:
        raise SystemExit("Define DATABASE_URL o usa --db.")
    if a.exportar:
        exportar_paneles(cargar_base(create_engine(a.db)), a.tipo_objetivo, a.horizonte, a.exportar)
        return
    resultado = obtener_modelos(create_engine(a.db), a.tipo_objetivo, a.horizonte, forzar=True)
    niveles = dict(resultado["niveles"])
    if "historial" in resultado:
        niveles["cliente (historial real)"] = resultado["historial"]["calidad"]
    for nivel, r in niveles.items():
        print(f"\n[{nivel}] filas={r.get('filas')} positivos={r.get('positivos')} entidades={r.get('entidades')}")
        if r.get("motivo"):
            print(" ", r["motivo"])
        for nombre, m in (r.get("candidatos") or {}).items():
            marca = " <- publicado" if nombre == r.get("modelo") else ""
            print(f"  {nombre:36s} AUC={m['auc_roc']:.3f} PR={m['auc_pr']:.3f} LogLoss={m['log_loss']:.4f} Brier={m['brier']:.4f}{marca}")
        for f in (r.get("importancia") or [])[:5]:
            print(f"    importante: {f['etiqueta']} ({f['importancia']})")


if __name__ == "__main__":
    main()
