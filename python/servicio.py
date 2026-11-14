"""API del modelo predictivo: tres modelos de tasa (ver modelos_tasa.py) y su reparto entre entidades."""
import logging
import math
import os
import threading
from contextlib import asynccontextmanager
from datetime import date, datetime

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

import horizontes
import modelos_tasa
import reparto
import seguimiento
from modelos_tasa import OBJETIVO_INCIDENTES, OBJETIVOS

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, pool_pre_ping=True) if DATABASE_URL else None
log = logging.getLogger(__name__)

_registradas = set()
_respuestas = {}
_bloqueo_respuestas = threading.Lock()
MAX_RESPUESTAS = 64
COHERENCIA = {"completa": True, "plazos_pendientes": []}


def limpiar(valor):
    """Valores listos para JSON: sin NaN ni tipos de numpy o pandas."""
    if valor is pd.NaT:
        return None
    if isinstance(valor, dict):
        return {k: limpiar(v) for k, v in valor.items() if v is not None}
    if isinstance(valor, (list, tuple)):
        return [limpiar(v) for v in valor]
    if isinstance(valor, (np.integer,)):
        return int(valor)
    if isinstance(valor, (np.floating, float)):
        return None if math.isnan(valor) or math.isinf(valor) else float(valor)
    if isinstance(valor, np.bool_):
        return bool(valor)
    if isinstance(valor, (pd.Timestamp, datetime, date)):
        return valor.date().isoformat() if isinstance(valor, (pd.Timestamp, datetime)) else valor.isoformat()
    return valor


def db():
    if engine is None:
        raise HTTPException(status_code=503, detail="El servicio no tiene conexión a la base configurada.")
    return engine


def modelos(forzar=False):
    """Lo entrenado para el estado actual de los datos. La primera vez de cada semana registra lo predicho."""
    try:
        resultado = modelos_tasa.obtener(db(), forzar=forzar)
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="No se pudieron leer los datos. Revisa las vistas predictivas.") from exc
    if resultado["huella"] not in _registradas:
        _registradas.add(resultado["huella"])
        seguimiento.registrar_seguro(db(), resultado)
    return resultado


def validar(tipo_objetivo, horizonte_dias):
    if tipo_objetivo not in OBJETIVOS:
        raise HTTPException(status_code=422, detail="El objetivo seleccionado no existe.")
    if horizonte_dias not in horizontes.DIAS_DISPONIBLES:
        raise HTTPException(status_code=422, detail="El horizonte seleccionado no está disponible.")


def niveles_de(resultado, objetivo, dias):
    clave = (resultado["huella"], objetivo, dias)
    with _bloqueo_respuestas:
        if clave not in _respuestas:
            if len(_respuestas) >= MAX_RESPUESTAS:
                _respuestas.clear()
            _respuestas[clave] = reparto.entidades(resultado, objetivo, dias)
        return _respuestas[clave]


def _preentrenar():
    try:
        modelos()
    except Exception:
        log.exception("No se pudo preentrenar el modelo predictivo.")


@asynccontextmanager
async def ciclo_de_vida(_app):
    # El primer usuario no espera el entrenamiento: un solo entrenamiento sirve a los tres objetivos y a todos los plazos.
    if engine is not None:
        threading.Thread(target=_preentrenar, daemon=True).start()
    yield


app = FastAPI(title="Modelo predictivo de eventos", version="3.0.0", lifespan=ciclo_de_vida)


@app.get("/health")
def health():
    if engine is None:
        raise HTTPException(status_code=503, detail="DATABASE_URL no está configurada.")
    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="No se pudo conectar a PostgreSQL.") from exc
    return {"status": "ok"}


@app.get("/tipos")
def listar_tipos():
    return {"tipos": list(OBJETIVOS)}


DESCRIPCIONES = {
    modelos_tasa.OBJETIVO_INCIDENTES: {
        "nombre": "Incidentes reales", "clave": "A",
        "predice": "Incidentes laborales esperados por semana en cada área de cada proyecto.",
    },
    modelos_tasa.OBJETIVO_LESIONES: {
        "nombre": "Incidentes con lesión", "clave": "A × B",
        "predice": "Tasa de incidentes por la probabilidad de que un incidente termine en lesión (modelo B).",
    },
    modelos_tasa.OBJETIVO_TODOS: {
        "nombre": "Todos los eventos", "clave": "C",
        "predice": "Eventos esperados por semana de cualquier tipo, sin Tarjetas PARE.",
    },
}


@app.get("/modelos")
def resumen_modelos():
    """Los tres modelos: qué predicen, cuál se publicó, su calidad y el riesgo total de la semana base."""
    resultado = modelos()
    areas = resultado["areas"]
    vigentes = set(reparto.vigentes(resultado["datos"])["id_proyecto"])
    en_curso = areas[areas["id_proyecto"].isin(vigentes)]
    lesion = resultado["calidad"][modelos_tasa.OBJETIVO_LESIONES]["area"].get("modelo_lesion", {})
    return limpiar({
        "version": resultado.get("version"), "semana_base": resultado["semana_base"],
        "entrenado_en": resultado.get("entrenado_en"), "proyectos_vigentes": len(vigentes),
        "horizontes_dias": list(horizontes.DIAS_DISPONIBLES),
        "objetivos": [{
            "tipo_objetivo": objetivo, **DESCRIPCIONES[objetivo],
            "calidad": resultado["calidad"][objetivo],
            "tasa_semanal_total": float(en_curso[f"tasa_{objetivo}"].sum()),
            "eventos_esperados_30_dias": float(en_curso[f"tasa_{objetivo}"].sum() * 30 / 7),
        } for objetivo in OBJETIVOS],
        "modelo_lesion": {
            "nombre": "Probabilidad de lesión dado un incidente", "clave": "B",
            "predice": "P(lesión | incidente) en cada área, según su historial y el contexto de la semana.",
            "calidad": lesion,
            "probabilidad_media": float(en_curso["p_lesion"].mean()) if len(en_curso) else None,
        },
    })


@app.get("/predicciones/entidades")
def predicciones_entidades(
    tipo_objetivo: str = Query(default=OBJETIVO_INCIDENTES, min_length=1, max_length=100),
    horizonte_dias: int = Query(default=horizontes.DIAS_PREDETERMINADOS, ge=1, le=90),
):
    """Todas las entidades vigentes con su riesgo en el plazo, sus factores y la calidad de cada modelo."""
    validar(tipo_objetivo, horizonte_dias)
    resultado = modelos()
    return limpiar({
        "tipo_objetivo": tipo_objetivo, "semana": resultado["semana_base"],
        "niveles": niveles_de(resultado, tipo_objetivo, horizonte_dias),
        "modelos": resultado["calidad"][tipo_objetivo], "historial": None, "coherencia": COHERENCIA,
        **horizontes.metadatos(horizonte_dias),
    })


@app.get("/modelo/evaluacion")
def evaluacion():
    """Aciertos de las predicciones publicadas, cuando su plazo ya terminó."""
    try:
        return {"evaluacion": limpiar(seguimiento.evaluar(db()))}
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="No se pudo evaluar lo publicado.") from exc


@app.post("/modelo/entrenar")
def entrenar_modelos(tipo_objetivo: str = Query(default=OBJETIVO_INCIDENTES, min_length=1, max_length=100)):
    """Reentrena los tres modelos aunque los datos no hayan cambiado y devuelve la calidad de cada nivel."""
    if tipo_objetivo not in OBJETIVOS:
        raise HTTPException(status_code=422, detail="El objetivo seleccionado no existe.")
    resultado = modelos(forzar=True)
    return limpiar({"modelos": resultado["calidad"][tipo_objetivo], "calidad": resultado["calidad"], "historial": None,
                    "semana_base": resultado["semana_base"]})


@app.get("/predicciones")
def predicciones(
    tipo_objetivo: str = Query(default=OBJETIVO_INCIDENTES, min_length=1, max_length=100),
    horizonte_dias: int = Query(default=horizontes.DIAS_PREDETERMINADOS, ge=1, le=90),
    id_proyecto: int | None = Query(default=None, ge=1),
):
    validar(tipo_objetivo, horizonte_dias)
    resultado = modelos()
    try:
        with db().connect() as conn:
            diagnostico = conn.execute(text("""
                SELECT current_database() AS base_datos, current_schema() AS esquema,
                       (SELECT count(*) FROM public.cuadrillas) AS cuadrillas_registradas
            """)).mappings().one()
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="No se pudo conectar a la base.") from exc

    niveles = niveles_de(resultado, tipo_objetivo, horizonte_dias)
    calidad = resultado["calidad"][tipo_objetivo]
    calidad_proyecto = calidad["proyecto"]
    semana = resultado["semana_base"]
    resultados = [{
        "id_proyecto": f["id"], "nombre_proyecto": f["nombre"], "semana": semana, "prob_evento": f["prob_evento"],
        "metodo": f["metodo"], "factores_principales": f["factores"],
        "variables": {x["etiqueta"]: x["valor"] for x in f["factores"]}, "tasa_semanal": f["tasa_semanal"],
    } for f in niveles["proyecto"] if id_proyecto is None or f["id"] == id_proyecto]
    validacion = None
    if calidad_proyecto.get("metricas"):
        validacion = {**calidad_proyecto["metricas"], "prevalencia": calidad_proyecto.get("prevalencia"),
                      "filas_validacion": calidad_proyecto.get("filas_validacion"),
                      "discriminacion": calidad_proyecto.get("discriminacion")}

    analisis, proximo = None, None
    objetivo_analisis = id_proyecto if id_proyecto is not None else (resultados[0]["id_proyecto"] if resultados else None)
    if objetivo_analisis is not None and any(f["id"] == objetivo_analisis for f in niveles["proyecto"]):
        calculado = reparto.analisis_proyecto(resultado, tipo_objetivo, objetivo_analisis, horizonte_dias, niveles)
        if id_proyecto is None:
            proximo = calculado["contexto"]["evento_estimado"]
        else:
            analisis = calculado
    cuadrillas = reparto.cuadrillas_globales(resultado, tipo_objetivo, horizonte_dias, niveles, id_proyecto)
    advertencia = calidad_proyecto.get("motivo")
    if id_proyecto is not None and not resultados:
        advertencia = "El proyecto no está vigente o no tiene semanas con datos: no hay predicción."
    return limpiar({
        "tipo_objetivo": tipo_objetivo,
        "unidad_analisis": "proyecto-área-semana (el proyecto es la suma de sus áreas)",
        "evento": "al menos un evento del objetivo dentro del plazo seleccionado",
        "modelo": calidad_proyecto.get("modelo"),
        "validacion": validacion,
        "modelos": calidad,
        "historial": None,
        "predicciones": resultados,
        "analisis_entidades": analisis,
        "analisis_global": {"cuadrillas": cuadrillas, "proximo_evento": proximo},
        "diagnostico": {
            "base_datos": diagnostico["base_datos"], "esquema": diagnostico["esquema"],
            "cuadrillas_registradas": int(diagnostico["cuadrillas_registradas"]), "cuadrillas_predichas": len(cuadrillas),
        },
        "advertencia_modelo": advertencia,
        "coherencia": COHERENCIA,
        **horizontes.metadatos(horizonte_dias),
    })
