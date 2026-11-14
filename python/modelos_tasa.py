"""Tres modelos de tasa para el riesgo de seguridad.

En lugar de un clasificador por cada objetivo, entidad y plazo, el servicio entrena tres modelos:

- Modelo A (incidentes): tasa semanal esperada de incidentes reales en cada area de cada proyecto.
- Modelo B (lesion): probabilidad de que un incidente termine en lesion, P(lesion | incidente).
- Modelo C (todos): tasa semanal esperada de eventos de cualquier tipo, sin tarjetas PARE.

La tasa de lesiones es A x B, de modo que nunca supera a la de incidentes. La unidad es
proyecto-area-semana (los eventos sin area van a un area "sin area" del proyecto), asi el riesgo de
un proyecto es la suma de sus areas. Cualquier plazo sale de la tasa con P = 1 - exp(-tasa * semanas):
un plazo mas largo nunca da menos riesgo que uno corto. Cuadrillas, trabajadores y actividades no
tienen modelo propio: reparten la tasa del proyecto (ver reparto.py).

Cada modelo compite con una tasa historica suavizada en validacion temporal y solo se publica si la
supera por un margen minimo.

Uso por consola:
  python modelos_tasa.py --db postgresql+psycopg2://usuario:clave@host/base
"""
import argparse
import hashlib
import json
import logging
import os
import threading
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression, PoissonRegressor
from sklearn.metrics import average_precision_score, brier_score_loss, log_loss, mean_poisson_deviance, roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError
from threadpoolctl import threadpool_limits

VERSION = "tasa-1"
OBJETIVO_INCIDENTES = "incidentes_reales"
OBJETIVO_LESIONES = "lesiones"
OBJETIVO_TODOS = "todos"
OBJETIVOS = (OBJETIVO_INCIDENTES, OBJETIVO_LESIONES, OBJETIVO_TODOS)
COLUMNA_OBJETIVO = {OBJETIVO_INCIDENTES: "incidente", OBJETIVO_LESIONES: "lesion", OBJETIVO_TODOS: "todos"}

SIN_AREA = 0
TIPO_AVISO = "tarjeta_pare"
CORTES = (0.6, 0.8)          # dos tramos de validacion: [60 %, 80 %) y [80 %, fin)
MIN_POSITIVOS = 20
MARGEN_MINIMO_PCT = 1.0
PRIOR_SEMANAS = 20           # peso de la tasa global en la referencia de cada area
PRIOR_LESION = 5             # peso de la proporcion global de lesiones
N_FACTORES = 6
NO_EXPLICABLES = {"sin_area"}
MAX_FILAS_IMPORTANCIA = 2000
SEMANAS_REGISTRO = (1, 2, 3, 4, 9, 13)
DIRECTORIO_MODELOS = Path(os.getenv("MODELOS_DIR", Path(__file__).resolve().parent / "models"))

ETIQUETAS = {
    "inc_u4": "incidentes del área (4 semanas)", "inc_u13": "incidentes del área (13 semanas)",
    "inc_u26": "incidentes del área (26 semanas)", "todos_u4": "eventos del área (4 semanas)",
    "todos_u13": "eventos del área (13 semanas)", "proact_u4": "reportes preventivos del área (4 semanas)",
    "proact_u13": "reportes preventivos del área (13 semanas)", "sev_max_u13": "severidad máxima del área (13 semanas)",
    "ewm_inc": "incidentes recientes del área (ponderado)", "sem_desde_ult": "semanas desde el último incidente del área",
    "tasa_hist_inc": "tasa histórica de incidentes del área",
    "p_inc_u4": "incidentes del proyecto (4 semanas)", "p_inc_u13": "incidentes del proyecto (13 semanas)",
    "p_todos_u4": "eventos del proyecto (4 semanas)", "p_todos_u13": "eventos del proyecto (13 semanas)",
    "p_proact_u4": "reportes preventivos del proyecto (4 semanas)", "p_proact_u13": "reportes preventivos del proyecto (13 semanas)",
    "p_noche_u13": "eventos en turno noche del proyecto (13 semanas)", "p_abiertos": "reportes pendientes de cierre",
    "p_sem_desde_ult": "semanas desde el último incidente del proyecto", "global_inc_u8": "incidentes en toda la empresa (8 semanas)",
    "n_cuadrillas": "cuadrillas asignadas", "n_supervisores": "supervisores asignados", "n_obreros": "personas expuestas",
    "n_actividades": "actividades en curso", "actividades_criticas": "actividades de riesgo crítico en curso",
    "edad": "semanas de actividad del proyecto", "sin_area": "eventos sin área asignada", "mes_sin": "época del año",
    "mes_cos": "época del año", "avance_planificado_pct": "avance planificado",
}


def etiqueta(variable):
    if variable in ETIQUETAS:
        return ETIQUETAS[variable]
    return variable.replace("_prev", " (semana anterior)").replace("_", " ")


def lunes(serie):
    fechas = pd.to_datetime(serie)
    return (fechas - pd.to_timedelta(fechas.dt.weekday, unit="D")).dt.normalize()


def probabilidad(tasa, semanas):
    """Probabilidad de al menos un evento en `semanas` con una tasa semanal constante."""
    return 1.0 - np.exp(-np.asarray(tasa, dtype=float) * float(semanas))


# ---------------------------------------------------------------- lectura de datos

def _leer(engine, sql, **params):
    return pd.read_sql(text(sql), engine, params=params or None)


SQL_EVENTOS = """
    SELECT 'e' || e.id_evento AS clave, e.id_evento, e.id_proyecto, e.id_area, e.id_actividad,
           COALESCE(te.codigo, lower(regexp_replace(trim(te.nombre), '[[:space:]]+', '_', 'g'))) AS tipo,
           te.es_incidente, te.es_proactivo AS proactivo,
           COALESCE(ci.con_lesion, FALSE)
               OR EXISTS (SELECT 1 FROM public.evento_lesion l WHERE l.id_evento = e.id_evento) AS con_lesion,
           COALESCE(ci.laboral, TRUE) AS laboral, s.nivel::numeric AS severidad,
           COALESCE(e.fecha_ocurrencia, e.fecha_creacion) AS fecha, e.fecha_cierre::timestamp AS fecha_cierre,
           ct.nombre AS turno, trim(concat_ws(' ', ps.nombre_1, ps.apellido_1)) AS supervisor, cat.nombre AS categoria,
           cin.nombre AS causa_inmediata, cba.nombre AS causa_basica, em.razon_social AS empresa, eq.codigo AS equipo
    FROM public.eventos e
    JOIN public.tipo_eventos te USING (id_tipo_evento)
    LEFT JOIN public.cat_clasificacion_incidente ci ON ci.id_clasificacion_incidente = e.id_clasificacion_incidente
    LEFT JOIN public.cat_severidad s ON s.id_severidad = e.id_severidad
    LEFT JOIN public.cat_turno ct ON ct.id_turno = e.id_turno
    LEFT JOIN public.trabajadores ts ON ts.id_trabajador = e.id_supervisor
    LEFT JOIN public.personas ps ON ps.id_persona = ts.id_persona
    LEFT JOIN public.cat_categoria_evento cat ON cat.id_categoria_evento = e.id_categoria_evento
    LEFT JOIN public.cat_causa cin ON cin.id_causa = e.id_causa_inmediata
    LEFT JOIN public.cat_causa cba ON cba.id_causa = e.id_causa_basica
    LEFT JOIN public.empresas em ON em.id_empresa = e.id_empresa
    LEFT JOIN public.equipos eq ON eq.id_equipo = e.id_equipo
    WHERE e.id_proyecto IS NOT NULL
    UNION ALL
    SELECT 'p' || id_local, NULL, id_proyecto, id_area, NULL, 'reporte_previene', FALSE, TRUE, FALSE, TRUE,
           urgencia::numeric, fecha::timestamp, cierre_fecha::timestamp, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    FROM public.reportes_previene_intrava WHERE id_proyecto IS NOT NULL AND fecha IS NOT NULL
    UNION ALL
    SELECT 'f' || r.id_local, NULL, r.id_proyecto, r.id_area, NULL, 'reporte_flash', TRUE, FALSE,
           COALESCE(ci.con_lesion, FALSE), COALESCE(ci.laboral, TRUE), NULL, r.fecha::timestamp, NULL, r.turno,
           NULL, NULL, NULL, NULL, NULL, NULL
    FROM public.reportes_flash_intrava r
    LEFT JOIN public.cat_clasificacion_incidente ci ON ci.id_clasificacion_incidente = r.id_clasificacion_incidente
    WHERE r.id_proyecto IS NOT NULL AND r.fecha IS NOT NULL
    UNION ALL
    SELECT 'h' || id_intrava, NULL, id_proyecto, id_area, NULL, 'hallazgo_intrava', FALSE, TRUE, FALSE, TRUE, NULL,
           COALESCE(fecha_deteccion, fecha_creacion)::timestamp, fecha_cierre::timestamp, NULL,
           NULL, NULL, NULL, NULL, NULL, NULL
    FROM public.hallazgos_intrava
    WHERE id_proyecto IS NOT NULL AND COALESCE(fecha_deteccion, fecha_creacion) IS NOT NULL
"""

SQL_PERSONA = "trim(concat_ws(' ', pe.nombre_1, pe.apellido_1))"


def cargar_datos(engine, hoy=None):
    """Lee eventos de todas las fuentes y la estructura operativa. Los informes de investigacion
    no se leen: documentan un incidente ya contado por su Reporte Flash."""
    hoy = pd.Timestamp.today().normalize() if hoy is None else pd.Timestamp(hoy).normalize()
    eventos = _leer(engine, SQL_EVENTOS)
    eventos["fecha"] = pd.to_datetime(eventos["fecha"])
    eventos["fecha_cierre"] = pd.to_datetime(eventos["fecha_cierre"])
    eventos = eventos[eventos["fecha"].notna() & (eventos["fecha"] < hoy + pd.Timedelta(days=1))].copy()
    for columna in ("es_incidente", "proactivo", "con_lesion", "laboral"):
        eventos[columna] = eventos[columna].fillna(columna == "laboral").astype(bool)
    eventos["id_area"] = eventos["id_area"].fillna(SIN_AREA).astype(int)
    # Trayecto y enfermedad comun ocurren fuera de la obra: no son incidentes que se puedan prevenir en ella.
    eventos["incidente"] = eventos["es_incidente"] & eventos["laboral"]
    eventos["lesion"] = eventos["incidente"] & eventos["con_lesion"]
    # Una tarjeta PARE avisa de un peligro: sirve como predictor, pero no es un evento de riesgo.
    eventos["todos"] = eventos["tipo"] != TIPO_AVISO
    eventos["noche"] = eventos["turno"].fillna("").str.lower().str.startswith("noche") | (
        eventos["fecha"].dt.hour.between(20, 23) | eventos["fecha"].dt.hour.between(0, 5))
    eventos["semana"] = lunes(eventos["fecha"])

    datos = {
        "hoy": hoy,
        "eventos": eventos.reset_index(drop=True),
        "participantes": _leer(engine, """
            SELECT id_evento, id_trabajador FROM public.evento_trabajador
            UNION SELECT id_evento, id_trabajador FROM public.eventos WHERE id_trabajador IS NOT NULL
        """),
        "proyectos": _leer(engine, """
            SELECT p.id_proyecto, p.nombre, p.id_cliente, p.id_faena, p.fecha_inicio, p.fecha_termino,
                   COALESCE(c.nombre, c.razon_social) AS cliente, f.nombre AS faena, p.num_contrato
            FROM public.proyectos p
            LEFT JOIN public.clientes c ON c.id_cliente = p.id_cliente
            LEFT JOIN public.faenas f ON f.id_faena = p.id_faena
        """),
        "semanas": _leer(engine, "SELECT id_proyecto, semana FROM public.v_proyecto_semanas"),
        "contexto": _leer(engine, "SELECT * FROM public.v_proyecto_semana_contexto"),
        "areas": _leer(engine, "SELECT id_area, id_faena, codigo_area, descripcion FROM public.areas"),
        "asignaciones": _leer(engine, """
            SELECT id_asignacion, id_cuadrilla, id_proyecto, fecha_inicio, fecha_termino FROM public.asignaciones
        """),
        "membresia": _leer(engine, "SELECT id_trabajador, id_cuadrilla, fecha_inicio, fecha_fin FROM public.trabajadores_cuadrillas"),
        "obreros": _leer(engine, "SELECT id_trabajador, id_cuadrilla FROM public.obreros WHERE id_cuadrilla IS NOT NULL"),
        "cuadrillas": _leer(engine, f"""
            SELECT cu.id_cuadrilla, cu.numero_cuadrilla, {SQL_PERSONA} AS supervisor
            FROM public.cuadrillas cu
            LEFT JOIN public.trabajadores t ON t.id_trabajador = cu.id_supervisor
            LEFT JOIN public.personas pe ON pe.id_persona = t.id_persona
        """),
        "trabajadores": _leer(engine, f"""
            SELECT t.id_trabajador, {SQL_PERSONA} AS nombre,
                   trim(concat_ws(' ', pe.nombre_1, pe.nombre_2, pe.apellido_1, pe.apellido_2)) AS nombre_completo, t.cargo
            FROM public.trabajadores t JOIN public.personas pe ON pe.id_persona = t.id_persona
        """),
        "actividades": _leer(engine, """
            SELECT ac.id_actividad, ac.id_asignacion, a.id_proyecto, a.id_cuadrilla, ac.nombre,
                   COALESCE(ac.fecha_inicio, a.fecha_inicio) AS inicio, COALESCE(ac.fecha_termino, a.fecha_termino) AS termino,
                   CASE WHEN rc.codigo <> 'sin_riesgo_critico' THEN rc.codigo END AS riesgo_critico, rc.nombre AS riesgo_critico_nombre
            FROM public.actividades ac JOIN public.asignaciones a USING (id_asignacion)
            LEFT JOIN public.cat_riesgo_critico rc ON rc.id_riesgo_critico = ac.id_riesgo_critico
        """),
    }
    inspector = inspect(engine)
    tiene_extra = inspector.has_table("v_proyecto_semana_extra") or "v_proyecto_semana_extra" in inspector.get_view_names()
    datos["extra"] = _leer(engine, "SELECT * FROM public.v_proyecto_semana_extra") if tiene_extra else pd.DataFrame()

    fechas = {
        "proyectos": ["fecha_inicio", "fecha_termino"], "semanas": ["semana"], "contexto": ["semana"],
        "asignaciones": ["fecha_inicio", "fecha_termino"], "membresia": ["fecha_inicio", "fecha_fin"],
        "actividades": ["inicio", "termino"], "extra": ["semana"],
    }
    for tabla, columnas in fechas.items():
        for columna in columnas:
            if not datos[tabla].empty:
                datos[tabla][columna] = pd.to_datetime(datos[tabla][columna])
    # La semana base es la de la ultima fecha con datos: si la sincronizacion esta atrasada no se
    # inventan semanas sin eventos.
    datos["semana_base"] = eventos["semana"].max() if not eventos.empty else hoy - pd.Timedelta(days=hoy.weekday())
    return datos


def huella_datos(engine, hoy=None):
    """Identifica el estado de los datos; mientras no cambie se reutiliza lo entrenado."""
    hoy = pd.Timestamp.today().normalize() if hoy is None else pd.Timestamp(hoy)
    consultas = [
        "SELECT count(*), max(fecha_actualizacion)::text FROM public.eventos",
        "SELECT count(*), max(sincronizado_en)::text FROM public.reportes_previene_intrava",
        "SELECT count(*), max(sincronizado_en)::text FROM public.reportes_flash_intrava",
        "SELECT count(*), max(sincronizado_en)::text FROM public.hallazgos_intrava",
        "SELECT count(*), max(fecha_inicio)::text FROM public.asignaciones",
        "SELECT count(*), max(fecha_inicio)::text FROM public.trabajadores_cuadrillas",
        "SELECT count(*) FROM public.evento_lesion",
        "SELECT count(*), max(codigo) FROM public.tipo_eventos WHERE es_incidente",
    ]
    estado = [VERSION, str((hoy - pd.Timedelta(days=hoy.weekday())).date())]
    with engine.connect() as conexion:
        estado += [list(conexion.execute(text(c)).one()) for c in consultas]
    return hashlib.sha256(json.dumps(estado, default=str).encode()).hexdigest()[:24]


# ---------------------------------------------------------------- panel proyecto-area-semana

def _rodar(df, clave, columna, ventana, agg="sum"):
    """Suma (o maximo) de las `ventana` semanas anteriores; nunca incluye la semana actual."""
    retrasada = df.groupby(clave, sort=False)[columna].shift(1)
    rodante = retrasada.groupby(df[clave], sort=False).rolling(ventana, min_periods=1)
    return getattr(rodante, agg)().reset_index(level=0, drop=True).sort_index()


def _semanas_desde(df, clave, columna):
    ultima = df["semana"].where(df[columna] > 0).groupby(df[clave], sort=False).transform(lambda s: s.shift(1).ffill())
    return ((df["semana"] - ultima).dt.days / 7).fillna(104).clip(0, 104)


def construir_panel(datos):
    """Panel proyecto-area-semana con conteos, variables historicas (solo semanas anteriores) y objetivos.

    Devuelve X (variables) y meta (claves, semana y conteos objetivo de esa semana).
    """
    ev = datos["eventos"]
    base = datos["semana_base"]
    semanas = datos["semanas"][datos["semanas"]["semana"] <= base]
    proyectos = datos["proyectos"][["id_proyecto", "id_faena"]]

    # Areas de cada proyecto: las de su faena, las que aparecen en sus eventos y "sin area".
    de_faena = proyectos.merge(datos["areas"][["id_area", "id_faena"]], on="id_faena")[["id_proyecto", "id_area"]]
    de_eventos = ev[["id_proyecto", "id_area"]].drop_duplicates()
    sin_area = proyectos[["id_proyecto"]].assign(id_area=SIN_AREA)
    unidades = pd.concat([de_faena, de_eventos, sin_area]).drop_duplicates()
    panel = semanas.merge(unidades, on="id_proyecto")
    panel = panel.sort_values(["id_proyecto", "id_area", "semana"]).reset_index(drop=True)
    panel["unidad"] = panel["id_proyecto"].astype(str) + "-" + panel["id_area"].astype(str)

    conteos = ev.assign(proact=ev["proactivo"], total=True).groupby(["id_proyecto", "id_area", "semana"]).agg(
        n_inc=("incidente", "sum"), n_les=("lesion", "sum"), n_todos=("todos", "sum"),
        n_proact=("proact", "sum"), n_sev=("severidad", "max"),
    ).reset_index()
    panel = panel.merge(conteos, how="left", on=["id_proyecto", "id_area", "semana"])
    for columna in ("n_inc", "n_les", "n_todos", "n_proact"):
        panel[columna] = panel[columna].fillna(0).astype(float)

    f = {}
    for columna, nombre, ventanas in (("n_inc", "inc", (4, 13, 26)), ("n_todos", "todos", (4, 13)), ("n_proact", "proact", (4, 13))):
        for w in ventanas:
            f[f"{nombre}_u{w}"] = _rodar(panel, "unidad", columna, w)
    f["sev_max_u13"] = _rodar(panel, "unidad", "n_sev", 13, "max")
    retraso = panel.groupby("unidad", sort=False)["n_inc"].shift(1)
    f["ewm_inc"] = retraso.groupby(panel["unidad"], sort=False).transform(lambda s: s.ewm(halflife=6).mean())
    f["sem_desde_ult"] = _semanas_desde(panel, "unidad", "n_inc")
    edad_unidad = panel.groupby("unidad", sort=False).cumcount()
    f["tasa_hist_inc"] = retraso.fillna(0).groupby(panel["unidad"], sort=False).cumsum() / edad_unidad.replace(0, np.nan)
    f["sin_area"] = (panel["id_area"] == SIN_AREA).astype(float)
    # Acumulados para el modelo de lesion (solo semanas anteriores).
    for columna in ("n_inc", "n_les"):
        f[f"{columna}_cum_a"] = panel.groupby("unidad", sort=False)[columna].transform(lambda s: s.cumsum().shift(1)).fillna(0)

    # Variables del proyecto completo, compartidas por todas sus areas.
    proyecto = panel.groupby(["id_proyecto", "semana"], as_index=False)[["n_inc", "n_les", "n_todos", "n_proact"]].sum()
    noche = ev[ev["noche"]].groupby(["id_proyecto", "semana"]).size().rename("n_noche").reset_index()
    creados = ev.groupby(["id_proyecto", "semana"]).size().rename("n_creados").reset_index()
    cerrados = ev.dropna(subset=["fecha_cierre"]).assign(semana=lambda d: lunes(d["fecha_cierre"]))
    cerrados = cerrados.groupby(["id_proyecto", "semana"]).size().rename("n_cerrados").reset_index()
    for tabla in (noche, creados, cerrados):
        proyecto = proyecto.merge(tabla, how="left", on=["id_proyecto", "semana"])
    proyecto = proyecto.fillna({"n_noche": 0, "n_creados": 0, "n_cerrados": 0}).sort_values(["id_proyecto", "semana"]).reset_index(drop=True)
    fp = {"id_proyecto": proyecto["id_proyecto"], "semana": proyecto["semana"]}
    for columna, nombre in (("n_inc", "p_inc"), ("n_todos", "p_todos"), ("n_proact", "p_proact")):
        for w in (4, 13):
            fp[f"{nombre}_u{w}"] = _rodar(proyecto, "id_proyecto", columna, w)
    fp["p_noche_u13"] = _rodar(proyecto, "id_proyecto", "n_noche", 13)
    fp["p_sem_desde_ult"] = _semanas_desde(proyecto, "id_proyecto", "n_inc")
    acumulado = lambda c: proyecto.groupby("id_proyecto", sort=False)[c].transform(lambda s: s.cumsum().shift(1)).fillna(0)
    fp["p_abiertos"] = (acumulado("n_creados") - acumulado("n_cerrados")).clip(lower=0)
    fp["n_inc_cum_p"] = acumulado("n_inc")
    fp["n_les_cum_p"] = acumulado("n_les")
    fp["edad"] = proyecto.groupby("id_proyecto", sort=False).cumcount().astype(float)
    global_semanal = proyecto.groupby("semana")["n_inc"].sum().sort_index()
    fp["global_inc_u8"] = proyecto["semana"].map(global_semanal.shift(1).rolling(8, min_periods=1).sum())
    tabla_proyecto = pd.DataFrame(fp)

    # Contexto operativo de la semana: es planificado, se conoce al inicio de la semana.
    contexto = datos["contexto"][["id_proyecto", "semana", "n_cuadrillas", "n_supervisores", "n_obreros", "n_actividades"]]
    tabla_proyecto = tabla_proyecto.merge(contexto, how="left", on=["id_proyecto", "semana"])
    criticas = datos["actividades"].dropna(subset=["riesgo_critico", "inicio"])
    if not criticas.empty:
        cruce = tabla_proyecto[["id_proyecto", "semana"]].merge(criticas[["id_proyecto", "inicio", "termino"]], on="id_proyecto")
        vigentes = cruce[(cruce["inicio"] < cruce["semana"] + pd.Timedelta(days=7)) &
                         (cruce["termino"].isna() | (cruce["termino"] >= cruce["semana"]))]
        conteo = vigentes.groupby(["id_proyecto", "semana"]).size().rename("actividades_criticas").reset_index()
        tabla_proyecto = tabla_proyecto.merge(conteo, how="left", on=["id_proyecto", "semana"])
        tabla_proyecto["actividades_criticas"] = tabla_proyecto["actividades_criticas"].fillna(0)
    if not datos["extra"].empty:
        extra = datos["extra"].sort_values(["id_proyecto", "semana"]).copy()
        columnas = []
        for columna in [c for c in extra.columns if c not in ("id_proyecto", "semana")]:
            valores = pd.to_numeric(extra[columna], errors="coerce")
            if valores.notna().any():
                # Lo medido en la semana se conoce al terminarla: se usa el valor de la semana anterior.
                nombre = columna if columna == "avance_planificado_pct" else f"{columna}_prev"
                extra[nombre] = valores if nombre == columna else valores.groupby(extra["id_proyecto"]).shift(1)
                columnas.append(nombre)
        tabla_proyecto = tabla_proyecto.merge(extra[["id_proyecto", "semana", *columnas]], how="left", on=["id_proyecto", "semana"])

    X = pd.concat([pd.DataFrame(f, index=panel.index), panel[["id_proyecto", "semana"]]], axis=1)
    X = X.merge(tabla_proyecto, how="left", on=["id_proyecto", "semana"]).drop(columns=["id_proyecto", "semana"])
    X.index = panel.index
    mes = panel["semana"].dt.month
    X["mes_sin"] = np.sin(2 * np.pi * mes / 12)
    X["mes_cos"] = np.cos(2 * np.pi * mes / 12)

    meta = panel[["id_proyecto", "id_area", "unidad", "semana", "n_inc", "n_les", "n_todos"]].copy()
    meta["observada"] = meta["semana"] < base
    return X, meta


COLUMNAS_SOLO_LESION = ("n_inc_cum_a", "n_les_cum_a", "n_inc_cum_p", "n_les_cum_p")


def columnas_tasa(X):
    """Variables de los modelos de tasa: se descartan las vacias o constantes."""
    return [c for c in X.columns if c not in COLUMNAS_SOLO_LESION and X[c].notna().any() and X[c].nunique(dropna=True) > 1]


# ---------------------------------------------------------------- metricas

def _metricas_binarias(y, p):
    """Calidad para 'al menos un evento en la semana': AUC, AUC-PR, Brier y log-loss."""
    y = np.asarray(y).astype(int)
    p = np.clip(np.asarray(p, dtype=float), 1e-6, 1 - 1e-6)
    salida = {"brier": round(float(brier_score_loss(y, p)), 4), "log_loss": round(float(log_loss(y, p, labels=[0, 1])), 4)}
    if len(np.unique(y)) == 2:
        salida["auc_roc"] = round(float(roc_auc_score(y, p)), 4)
        salida["auc_pr"] = round(float(average_precision_score(y, p)), 4)
    else:
        salida["auc_roc"], salida["auc_pr"] = 0.5, float(np.mean(y))
    return salida


def _metricas_tasa(conteo, tasa):
    metricas = _metricas_binarias(np.asarray(conteo) > 0, probabilidad(tasa, 1))
    metricas["devianza_poisson"] = round(float(mean_poisson_deviance(conteo, np.clip(tasa, 1e-6, None))), 4)
    return metricas


def calidad_discriminacion(auc):
    return "alta" if auc >= 0.8 else "media" if auc >= 0.7 else "baja" if auc >= 0.6 else "muy baja"


def _mejora(referencia, valor):
    return round(100 * (referencia - valor) / referencia, 2) if referencia else 0.0


# ---------------------------------------------------------------- modelos A y C: tasa semanal

class TasaReferencia:
    """Tasa historica de cada area suavizada hacia la tasa global (por separado para 'sin area')."""

    def fit(self, meta, y):
        datos = meta[["unidad"]].assign(y=np.asarray(y, dtype=float), sin_area=(meta["id_area"] == SIN_AREA).to_numpy())
        self.prior = datos.groupby("sin_area")["y"].mean().to_dict()
        self.global_ = float(datos["y"].mean())
        grupo = datos.groupby("unidad").agg(suma=("y", "sum"), n=("y", "size"), sin_area=("sin_area", "first"))
        prior = grupo["sin_area"].map(self.prior).fillna(self.global_)
        self.tasas = ((grupo["suma"] + prior * PRIOR_SEMANAS) / (grupo["n"] + PRIOR_SEMANAS)).to_dict()
        return self

    def predict(self, meta):
        prior = (meta["id_area"] == SIN_AREA).map(self.prior).fillna(self.global_)
        return np.clip(meta["unidad"].map(self.tasas).fillna(prior).to_numpy(dtype=float), 1e-6, None)


CANDIDATOS_TASA = {
    "Regresión de Poisson": lambda: make_pipeline(
        SimpleImputer(strategy="median"), StandardScaler(), PoissonRegressor(alpha=1.0, max_iter=1000)),
    "Gradient boosting de Poisson": lambda: HistGradientBoostingRegressor(
        loss="poisson", max_depth=3, learning_rate=0.05, max_iter=200, min_samples_leaf=40,
        l2_regularization=1.0, random_state=0),
}
NOMBRE_REFERENCIA = "Tasa histórica suavizada"


def _tramos(meta):
    """Tramos de validacion temporal: [corte_k, corte_k+1). Entrena siempre con semanas anteriores."""
    semanas = np.sort(meta.loc[meta["observada"], "semana"].unique())
    if len(semanas) < 10:
        return []
    cortes = [pd.Timestamp(semanas[int(len(semanas) * q)]) for q in CORTES] + [pd.Timestamp(semanas[-1]) + pd.Timedelta(days=1)]
    return list(zip(cortes, cortes[1:]))


def validar_tasa(X, meta, columna, columnas):
    """Predicciones fuera de muestra de la referencia y de cada candidato, tramo por tramo."""
    observadas = meta["observada"].to_numpy()
    fuera = {nombre: np.full(len(meta), np.nan) for nombre in [NOMBRE_REFERENCIA, *CANDIDATOS_TASA]}
    ultimos = {}
    for inicio, fin in _tramos(meta):
        entrena = observadas & (meta["semana"] < inicio).to_numpy()
        prueba = observadas & (meta["semana"] >= inicio).to_numpy() & (meta["semana"] < fin).to_numpy()
        if meta.loc[entrena, columna].sum() == 0 or not prueba.any():
            continue
        y = meta.loc[entrena, columna]
        fuera[NOMBRE_REFERENCIA][prueba] = TasaReferencia().fit(meta[entrena], y).predict(meta[prueba])
        for nombre, fabrica in CANDIDATOS_TASA.items():
            modelo = fabrica().fit(X.loc[entrena, columnas], y)
            fuera[nombre][prueba] = np.clip(modelo.predict(X.loc[prueba, columnas]), 1e-6, None)
            ultimos[nombre] = (modelo, prueba)
    return fuera, ultimos


def _resumen_tasa(meta, columna, fuera, elegido, motivo=None):
    """Calidad del nivel area y del nivel proyecto (suma de sus areas), con las mismas semanas de prueba."""
    probadas = ~np.isnan(fuera[NOMBRE_REFERENCIA])
    observadas = meta[meta["observada"]]
    base = {
        "filas": int(len(observadas)), "positivos": int((observadas[columna] > 0).sum()),
        "prevalencia": round(float((observadas[columna] > 0).mean()), 4) if len(observadas) else None,
        "publicado": True, "metodo": "referencia" if elegido == NOMBRE_REFERENCIA else "modelo", "modelo": elegido,
    }
    niveles = {}
    for nivel, claves in (("area", ["unidad", "semana"]), ("proyecto", ["id_proyecto", "semana"])):
        resumen = dict(base)
        resumen["entidades"] = int(observadas["unidad" if nivel == "area" else "id_proyecto"].nunique())
        if nivel == "proyecto":
            semanas_proyecto = observadas.groupby(["id_proyecto", "semana"])[columna].sum()
            resumen.update(filas=int(len(semanas_proyecto)), positivos=int((semanas_proyecto > 0).sum()),
                           prevalencia=round(float((semanas_proyecto > 0).mean()), 4) if len(semanas_proyecto) else None)
        if probadas.any():
            prueba = meta[probadas][claves + [columna]].copy()
            tabla = {}
            for nombre, valores in fuera.items():
                prueba["tasa"] = valores[probadas]
                agrupado = prueba.groupby(claves)[[columna, "tasa"]].sum()
                tabla[nombre] = _metricas_tasa(agrupado[columna].to_numpy(), agrupado["tasa"].to_numpy())
            referencia = tabla[NOMBRE_REFERENCIA]
            metricas = tabla[elegido]
            resumen.update({
                "candidatos": tabla, "referencia": referencia, "metricas": metricas,
                "filas_validacion": int(len(agrupado)), "discriminacion": calidad_discriminacion(metricas["auc_roc"]),
                "mejora_log_loss_pct": _mejora(referencia["log_loss"], metricas["log_loss"]),
                "mejora_devianza_pct": _mejora(referencia["devianza_poisson"], metricas["devianza_poisson"]),
            })
        if motivo:
            resumen["motivo"] = motivo
        niveles[nivel] = resumen
    return niveles


def ajustar_tasa(X, meta, columna):
    """Elige y ajusta el modelo de tasa de una columna objetivo (n_inc o n_todos)."""
    columnas = columnas_tasa(X)
    observadas = meta["observada"].to_numpy()
    positivos = int((meta.loc[observadas, columna] > 0).sum())
    fuera, ultimos = validar_tasa(X, meta, columna, columnas) if positivos >= MIN_POSITIVOS else ({}, {})
    motivo = None
    if positivos < MIN_POSITIVOS:
        elegido, motivo = NOMBRE_REFERENCIA, f"Datos insuficientes: {positivos} semanas con eventos (mínimo {MIN_POSITIVOS})."
        fuera = {NOMBRE_REFERENCIA: np.full(len(meta), np.nan)}
    elif np.isnan(fuera[NOMBRE_REFERENCIA]).all():
        elegido, motivo = NOMBRE_REFERENCIA, "La validación temporal no tiene tramos con eventos: se usa la tasa histórica."
    else:
        probadas = ~np.isnan(fuera[NOMBRE_REFERENCIA])
        y = meta.loc[probadas, columna].to_numpy()
        devianza = {n: mean_poisson_deviance(y, np.clip(v[probadas], 1e-6, None)) for n, v in fuera.items()}
        mejor = min(CANDIDATOS_TASA, key=devianza.get)
        mejora = _mejora(devianza[NOMBRE_REFERENCIA], devianza[mejor])
        if mejora >= MARGEN_MINIMO_PCT:
            elegido = mejor
        else:
            elegido = NOMBRE_REFERENCIA
            motivo = (f"Ningún modelo superó a la tasa histórica por al menos {MARGEN_MINIMO_PCT:.0f} % en devianza "
                      f"(mejor candidato: {mejor}, {mejora:.1f} %).")
    calidad = _resumen_tasa(meta, columna, fuera, elegido, motivo)

    y = meta.loc[observadas, columna]
    ajuste = {"nombre": elegido, "columnas": columnas, "referencia": TasaReferencia().fit(meta[observadas], y)}
    if elegido != NOMBRE_REFERENCIA:
        ajuste["modelo"] = CANDIDATOS_TASA[elegido]().fit(X.loc[observadas, columnas], y)
        ajuste["medianas"] = X.loc[observadas, columnas].median().to_dict()
        modelo, prueba = ultimos[elegido]
        filas = np.flatnonzero(prueba)
        if len(filas) > MAX_FILAS_IMPORTANCIA:
            filas = np.sort(np.random.default_rng(0).choice(filas, MAX_FILAS_IMPORTANCIA, replace=False))
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            importancia = permutation_importance(
                modelo, X.iloc[filas][columnas], meta.iloc[filas][columna], scoring="neg_mean_poisson_deviance",
                n_repeats=3, random_state=0, n_jobs=1)
        orden = pd.Series(importancia.importances_mean, index=columnas).sort_values(ascending=False)
        ajuste["explicables"] = [v for v, i in orden.items() if i > 0 and v not in NO_EXPLICABLES][:N_FACTORES]
        lista = [{"variable": v, "etiqueta": etiqueta(v), "importancia": round(float(i), 5)} for v, i in orden.head(10).items() if i > 0]
        for nivel in calidad.values():
            nivel["importancia"] = lista
    return calidad, ajuste, fuera.get(elegido, np.full(len(meta), np.nan))


def predecir_tasa(ajuste, X, meta):
    if "modelo" in ajuste:
        return np.clip(ajuste["modelo"].predict(X[ajuste["columnas"]]), 1e-6, None)
    return ajuste["referencia"].predict(meta)


def efectos_locales(ajuste, X):
    """Tasa de cada fila si una variable vuelve a su valor tipico: mide cuanto la mueve cada variable."""
    salida = {}
    for variable in ajuste.get("explicables", []):
        copia = X[ajuste["columnas"]].copy()
        copia[variable] = ajuste["medianas"].get(variable, np.nan)
        salida[variable] = np.clip(ajuste["modelo"].predict(copia), 1e-6, None)
    return salida


# ---------------------------------------------------------------- modelo B: P(lesion | incidente)

class LesionReferencia:
    """Proporcion historica de lesiones del area suavizada hacia la proporcion global."""

    def fit(self, Xl, y):
        self.p0 = float(np.clip(np.mean(y), 0.01, 0.99)) if len(y) else 0.3
        return self

    def predict(self, Xl):
        return ((Xl["n_les_cum_a"] + PRIOR_LESION * self.p0) / (Xl["n_inc_cum_a"] + PRIOR_LESION)).clip(0.001, 0.999).to_numpy()


class LesionLogistica:
    """Regresion logistica sobre proporciones suavizadas del area y del proyecto y el contexto de la semana."""

    VARIABLES = ("actividades_criticas", "p_noche_u13", "sev_max_u13", "sin_area", "n_obreros", "inc_u13")

    def _matriz(self, Xl):
        matriz = pd.DataFrame({
            "razon_area": (Xl["n_les_cum_a"] + PRIOR_LESION * self.p0) / (Xl["n_inc_cum_a"] + PRIOR_LESION),
            "razon_proyecto": (Xl["n_les_cum_p"] + PRIOR_LESION * self.p0) / (Xl["n_inc_cum_p"] + PRIOR_LESION),
            "incidentes_area": np.log1p(Xl["n_inc_cum_a"]),
        }, index=Xl.index)
        for variable in self.VARIABLES:
            if variable in Xl:
                matriz[variable] = Xl[variable]
        return matriz

    def fit(self, Xl, y):
        self.p0 = float(np.clip(np.mean(y), 0.01, 0.99))
        self.modelo = make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), LogisticRegression(C=0.3, max_iter=2000))
        self.modelo.fit(self._matriz(Xl), y)
        return self

    def predict(self, Xl):
        return self.modelo.predict_proba(self._matriz(Xl))[:, 1]


CANDIDATOS_LESION = {"Proporción histórica suavizada": LesionReferencia, "Regresión logística": LesionLogistica}
REFERENCIA_LESION = "Proporción histórica suavizada"


def _incidentes_del_panel(datos, X, meta):
    """Un incidente por fila, con las variables de su area y semana (que solo miran semanas anteriores)."""
    ev = datos["eventos"]
    incidentes = ev[ev["incidente"] & (ev["semana"] < datos["semana_base"])][["id_proyecto", "id_area", "semana", "lesion"]]
    indice = meta.reset_index()[["index", "id_proyecto", "id_area", "semana"]]
    cruce = incidentes.merge(indice, on=["id_proyecto", "id_area", "semana"])
    return cruce, X.loc[cruce["index"]].reset_index(drop=True)


def ajustar_lesion(datos, X, meta):
    """Elige el modelo de P(lesion | incidente) con validacion temporal y lo ajusta con todos los incidentes."""
    incidentes, Xl = _incidentes_del_panel(datos, X, meta)
    y = incidentes["lesion"].astype(int).to_numpy()
    resumen = {"filas": int(len(y)), "positivos": int(y.sum()), "entidades": int(incidentes[["id_proyecto", "id_area"]].drop_duplicates().shape[0]),
               "prevalencia": round(float(y.mean()), 4) if len(y) else None, "publicado": True}
    fuera = {nombre: np.full(len(meta), np.nan) for nombre in CANDIDATOS_LESION}
    elegido, motivo = REFERENCIA_LESION, None
    if y.sum() < MIN_POSITIVOS or len(y) - y.sum() < MIN_POSITIVOS:
        motivo = f"Datos insuficientes: {int(y.sum())} incidentes con lesión y {int(len(y) - y.sum())} sin lesión (mínimo {MIN_POSITIVOS} de cada uno)."
    else:
        prueba_y, prueba_p = [], {n: [] for n in CANDIDATOS_LESION}
        observadas = meta["observada"].to_numpy()
        for inicio, fin in _tramos(meta):
            entrena = (incidentes["semana"] < inicio).to_numpy()
            prueba = ((incidentes["semana"] >= inicio) & (incidentes["semana"] < fin)).to_numpy()
            filas_panel = observadas & (meta["semana"] >= inicio).to_numpy() & (meta["semana"] < fin).to_numpy()
            if len(np.unique(y[entrena])) < 2 or not prueba.any():
                continue
            prueba_y.extend(y[prueba])
            for nombre, clase in CANDIDATOS_LESION.items():
                modelo = clase().fit(Xl[entrena], y[entrena])
                prueba_p[nombre].extend(modelo.predict(Xl[prueba]))
                fuera[nombre][filas_panel] = modelo.predict(X[filas_panel])
        if len(np.unique(prueba_y)) == 2:
            tabla = {n: _metricas_binarias(prueba_y, p) for n, p in prueba_p.items()}
            mejor = min(tabla, key=lambda n: tabla[n]["log_loss"])
            mejora = _mejora(tabla[REFERENCIA_LESION]["log_loss"], tabla[mejor]["log_loss"])
            if mejor != REFERENCIA_LESION and mejora >= MARGEN_MINIMO_PCT:
                elegido = mejor
            else:
                motivo = f"La regresión logística no superó a la proporción histórica por al menos {MARGEN_MINIMO_PCT:.0f} % en log-loss."
            metricas = tabla[elegido]
            resumen.update({
                "candidatos": tabla, "referencia": tabla[REFERENCIA_LESION], "metricas": metricas,
                "filas_validacion": len(prueba_y), "discriminacion": calidad_discriminacion(metricas["auc_roc"]),
                "mejora_log_loss_pct": _mejora(tabla[REFERENCIA_LESION]["log_loss"], metricas["log_loss"]),
            })
        else:
            motivo = "Los tramos de validación no tienen incidentes con y sin lesión."
    resumen.update(metodo="referencia" if elegido == REFERENCIA_LESION else "modelo", modelo=elegido)
    if motivo:
        resumen["motivo"] = motivo
    modelo = CANDIDATOS_LESION[elegido]().fit(Xl, y) if len(y) else LesionReferencia().fit(Xl, y)
    return resumen, modelo, fuera[elegido]


# ---------------------------------------------------------------- entrenamiento completo

def _calidad_lesiones(meta, fuera_incidentes, p_lesion_fuera, calidad_incidentes, resumen_lesion):
    """Calidad de la tasa de lesiones (A x B) por area y por proyecto, en las mismas semanas de prueba."""
    combinada = fuera_incidentes * p_lesion_fuera
    calidad = {}
    probadas = ~np.isnan(combinada)
    for nivel, claves in (("area", ["unidad", "semana"]), ("proyecto", ["id_proyecto", "semana"])):
        resumen = {
            "publicado": True, "metodo": "modelo" if calidad_incidentes[nivel]["metodo"] == "modelo" or resumen_lesion["metodo"] == "modelo" else "referencia",
            "modelo": f"{calidad_incidentes[nivel]['modelo']} × {resumen_lesion['modelo']}",
            "filas": calidad_incidentes[nivel]["filas"], "entidades": calidad_incidentes[nivel]["entidades"],
            "modelo_incidentes": calidad_incidentes[nivel], "modelo_lesion": resumen_lesion,
        }
        observadas = meta[meta["observada"]]
        conteo = observadas.groupby(claves)["n_les"].sum()
        resumen["positivos"] = int((conteo > 0).sum())
        resumen["prevalencia"] = round(float((conteo > 0).mean()), 4) if len(conteo) else None
        if probadas.any():
            prueba = meta[probadas][claves + ["n_les"]].assign(tasa=combinada[probadas])
            agrupado = prueba.groupby(claves)[["n_les", "tasa"]].sum()
            metricas = _metricas_tasa(agrupado["n_les"].to_numpy(), agrupado["tasa"].to_numpy())
            resumen.update(metricas=metricas, filas_validacion=int(len(agrupado)),
                           discriminacion=calidad_discriminacion(metricas["auc_roc"]))
        resumen["motivo"] = ("Tasa de incidentes multiplicada por la probabilidad de que un incidente termine en lesión: "
                             "nunca supera a la tasa de incidentes.")
        calidad[nivel] = resumen
    return calidad


CALIDAD_REPARTO = {
    "cuadrilla": "Reparte la tasa del proyecto según los eventos de sus integrantes y su tamaño, suavizados.",
    "trabajador": "Reparte la tasa de su cuadrilla según sus eventos, suavizados hacia una parte igual para cada integrante.",
    "actividad": "Reparte la tasa del proyecto según los eventos registrados en cada actividad, suavizados.",
}


def entrenar(datos):
    """Entrena los tres modelos y predice la tasa semanal de cada area en la semana base."""
    # Con datos de este tamano, varios hilos de OpenMP se estorban: un hilo es hasta 10 veces mas rapido.
    with threadpool_limits(limits=1):
        return _entrenar(datos)


def _entrenar(datos):
    X, meta = construir_panel(datos)
    calidad_inc, ajuste_inc, fuera_inc = ajustar_tasa(X, meta, "n_inc")
    calidad_todos, ajuste_todos, _ = ajustar_tasa(X, meta, "n_todos")
    resumen_lesion, modelo_lesion, p_lesion_fuera = ajustar_lesion(datos, X, meta)
    calidad_les = _calidad_lesiones(meta, fuera_inc, p_lesion_fuera, calidad_inc, resumen_lesion)

    actuales = (meta["semana"] == datos["semana_base"]).to_numpy()
    Xa, ma = X[actuales], meta[actuales]
    tasa_inc = predecir_tasa(ajuste_inc, Xa, ma)
    tasa_todos = predecir_tasa(ajuste_todos, Xa, ma)
    p_lesion = modelo_lesion.predict(Xa)
    efectos_inc = efectos_locales(ajuste_inc, Xa)
    efectos_todos = efectos_locales(ajuste_todos, Xa)

    areas = ma[["id_proyecto", "id_area"]].reset_index(drop=True)
    areas["tasa_incidentes_reales"] = tasa_inc
    areas["tasa_lesiones"] = tasa_inc * p_lesion
    areas["tasa_todos"] = tasa_todos
    areas["p_lesion"] = p_lesion
    indicadores = Xa[[c for c in ("inc_u13", "proact_u13", "sem_desde_ult", "p_inc_u13", "p_proact_u13", "p_abiertos",
                                   "p_sem_desde_ult", "n_obreros") if c in Xa]].reset_index(drop=True)
    valores = Xa[sorted(set(ajuste_inc.get("explicables", [])) | set(ajuste_todos.get("explicables", [])))].reset_index(drop=True)

    reparto = {nivel: {"publicado": True, "metodo": "reparto", "modelo": "Reparto de la tasa del proyecto", "motivo": texto}
               for nivel, texto in CALIDAD_REPARTO.items()}
    calidad = {
        OBJETIVO_INCIDENTES: {**calidad_inc, **reparto},
        OBJETIVO_LESIONES: {**calidad_les, **reparto},
        OBJETIVO_TODOS: {**calidad_todos, **reparto},
    }
    return {
        "version": VERSION, "semana_base": datos["semana_base"], "calidad": calidad, "areas": areas,
        "indicadores": indicadores, "valores": valores,
        "efectos": {
            OBJETIVO_INCIDENTES: efectos_inc,
            OBJETIVO_LESIONES: {v: t * p_lesion for v, t in efectos_inc.items()},
            OBJETIVO_TODOS: efectos_todos,
        },
        "datos": datos,
    }


# ---------------------------------------------------------------- cache

_bloqueo = threading.Lock()
_memoria = {}


def obtener(engine, forzar=False, hoy=None):
    """Lo entrenado para el estado actual de los datos; solo reentrena si cambiaron o cambio la semana."""
    huella = huella_datos(engine, hoy)
    if not forzar and huella in _memoria:
        return _memoria[huella]
    with _bloqueo:
        if not forzar and huella in _memoria:
            return _memoria[huella]
        archivo = DIRECTORIO_MODELOS / f"{huella}.joblib"
        if not forzar and archivo.exists():
            try:
                _memoria[huella] = joblib.load(archivo)
                return _memoria[huella]
            except Exception:
                logging.getLogger(__name__).warning("No se pudo leer %s; se reentrena.", archivo)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            resultado = entrenar(cargar_datos(engine, hoy))
        resultado["huella"] = huella
        resultado["entrenado_en"] = pd.Timestamp.now().isoformat(timespec="seconds")
        _memoria.clear()
        _memoria[huella] = resultado
        try:
            DIRECTORIO_MODELOS.mkdir(parents=True, exist_ok=True)
            for viejo in DIRECTORIO_MODELOS.glob("*.joblib"):
                if viejo != archivo:
                    viejo.unlink()
            joblib.dump(resultado, archivo)
        except OSError:
            pass  # Sin disco disponible, el resultado sigue en memoria.
        return resultado


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--db", default=os.getenv("DATABASE_URL"))
    a = ap.parse_args()
    if not a.db:
        raise SystemExit("Define DATABASE_URL o usa --db.")
    try:
        resultado = obtener(create_engine(a.db), forzar=True)
    except SQLAlchemyError as exc:
        raise SystemExit(f"No se pudo leer la base: {exc}")
    print(f"Semana base: {resultado['semana_base'].date()}")
    for objetivo, niveles in resultado["calidad"].items():
        for nivel in ("proyecto", "area"):
            r = niveles[nivel]
            m = r.get("metricas") or {}
            print(f"\n[{objetivo} / {nivel}] {r.get('modelo')}  filas={r.get('filas')} positivos={r.get('positivos')}"
                  f"  AUC={m.get('auc_roc')} log-loss={m.get('log_loss')} devianza={m.get('devianza_poisson')}")
            for nombre, c in (r.get("candidatos") or {}).items():
                print(f"   {nombre:34s} AUC={c['auc_roc']:.3f} log-loss={c['log_loss']:.4f} devianza={c.get('devianza_poisson', float('nan')):.4f}")
            if r.get("motivo"):
                print("  ", r["motivo"])


if __name__ == "__main__":
    main()
