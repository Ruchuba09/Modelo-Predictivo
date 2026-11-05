import logging
import os
import threading
from contextlib import asynccontextmanager
from datetime import date

from fastapi import FastAPI, HTTPException, Query
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError

from modelo_predictivo import (
    OBJETIVO_INCIDENTES,
    OBJETIVO_LESIONES,
    generar_analisis_entidades,
    generar_predicciones_cuadrillas,
    generar_predicciones_historicas,
    sin_nulos,
    tipos_disponibles,
)
from motor_riesgo import evaluar_predicciones, obtener_modelos, predicciones_por_entidad, semana_actual


DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, pool_pre_ping=True) if DATABASE_URL else None


def _preentrenar():
    try:
        obtener_modelos(engine)
    except Exception:
        logging.getLogger(__name__).exception("No se pudo preentrenar el modelo predictivo.")


@asynccontextmanager
async def ciclo_de_vida(_app):
    # El primer usuario no espera el entrenamiento del objetivo y horizonte predeterminados.
    if engine is not None:
        threading.Thread(target=_preentrenar, daemon=True).start()
    yield


app = FastAPI(title="Modelo predictivo de eventos", version="2.0.0", lifespan=ciclo_de_vida)


def db():
    if engine is None:
        raise HTTPException(status_code=503, detail="El servicio no tiene conexión a la base configurada.")
    return engine


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
    try:
        return {"tipos": [OBJETIVO_INCIDENTES, OBJETIVO_LESIONES, "todos", *tipos_disponibles(db())]}
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="No se pudieron leer las vistas predictivas. Ejecuta primero 01_vistas_modelo_predictivo.sql.",
        ) from exc


@app.get("/predicciones/entidades")
def predicciones_entidades(
    tipo_objetivo: str = Query(default=OBJETIVO_INCIDENTES, min_length=1, max_length=100),
    horizonte: int = Query(default=4, ge=1, le=52),
):
    """Todas las entidades vigentes con su riesgo, sus factores y la calidad de cada modelo."""
    try:
        conexion = db()
        if tipo_objetivo not in (OBJETIVO_INCIDENTES, OBJETIVO_LESIONES, "todos") and tipo_objetivo not in tipos_disponibles(conexion):
            raise HTTPException(status_code=422, detail="El tipo de evento seleccionado no existe.")
        return sin_nulos(predicciones_por_entidad(conexion, tipo_objetivo, horizonte))
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="No se pudieron calcular las predicciones por entidad.") from exc


@app.get("/modelo/evaluacion")
def evaluacion():
    """Aciertos de las predicciones publicadas, cuando su horizonte ya terminó."""
    return {"evaluacion": sin_nulos(evaluar_predicciones(db()))}


@app.post("/modelo/entrenar")
def entrenar_modelos(
    tipo_objetivo: str = Query(default=OBJETIVO_INCIDENTES, min_length=1, max_length=100),
    horizonte: int = Query(default=4, ge=1, le=52),
):
    """Reentrena aunque los datos no hayan cambiado y devuelve la calidad de cada nivel."""
    motor = obtener_modelos(db(), tipo_objetivo, horizonte, forzar=True)
    return sin_nulos({"modelos": motor["niveles"], "historial": motor.get("historial")})


@app.get("/predicciones")
def predicciones(
    tipo_objetivo: str = Query(default=OBJETIVO_INCIDENTES, min_length=1, max_length=100),
    horizonte: int = Query(default=4, ge=1, le=52),
    id_proyecto: int | None = Query(default=None, ge=1),
):
    try:
        conexion = db()
        # Diagnóstico incluido en la respuesta: permite distinguir una tabla
        # vacía de un servicio Python conectado a otra base de datos.
        from sqlalchemy import text
        with conexion.connect() as conn:
            diagnostico_bd = conn.execute(text("""
                SELECT current_database() AS base_datos,
                       current_schema() AS esquema,
                       (SELECT count(*) FROM public.cuadrillas) AS cuadrillas_registradas
            """)).mappings().one()
        disponibles = tipos_disponibles(conexion)
        if tipo_objetivo not in (OBJETIVO_INCIDENTES, OBJETIVO_LESIONES, "todos") and tipo_objetivo not in disponibles:
            raise HTTPException(status_code=422, detail="El tipo de evento seleccionado no existe.")
        motor = obtener_modelos(conexion, tipo_objetivo, horizonte)
        calidad_proyecto = motor["niveles"].get("proyecto", {})
        predicciones_proyecto = motor["predicciones"].get("proyecto", {})
        advertencia_modelo = calidad_proyecto.get("motivo")
        validacion = None
        if predicciones_proyecto:
            nombre_modelo = calidad_proyecto["modelo"]
            validacion = {
                **calidad_proyecto["metricas"],
                "prevalencia": calidad_proyecto["prevalencia"],
                "filas_validacion": calidad_proyecto["filas_validacion"],
                "discriminacion": calidad_proyecto["discriminacion"],
            }
            semana = semana_actual().date().isoformat()
            resultados = sorted((
                {
                    "id_proyecto": proyecto, "semana": semana, "prob_evento": p["prob"], "metodo": p["metodo"],
                    "factores_principales": p["factores"],
                    "variables": {f["etiqueta"]: f["valor"] for f in p["factores"]},
                }
                for proyecto, p in predicciones_proyecto.items()
            ), key=lambda item: item["prob_evento"], reverse=True)
        else:
            # Sin datos para un modelo, el panel no queda vacío: usa una tasa histórica explícita.
            resultados = generar_predicciones_historicas(conexion, tipo_objetivo, horizonte)
            nombre_modelo = "Estimador histórico suavizado (respaldo)"
            advertencia_modelo = f"{advertencia_modelo or ''} Se muestran estimaciones históricas suavizadas.".strip()
        analisis = None
        proximo_evento_global = None
        id_analisis = id_proyecto
        if id_analisis is None and resultados:
            id_analisis = resultados[0]["id_proyecto"]
        if id_analisis is not None:
            principal = next((item for item in resultados if item["id_proyecto"] == id_analisis), None)
            analisis_calculado = generar_analisis_entidades(
                conexion, id_analisis, tipo_objetivo, horizonte,
                principal["prob_evento"] if principal else None, motor["predicciones"],
            )
            if id_proyecto is None:
                proximo_evento_global = analisis_calculado.get("contexto", {}).get("evento_estimado")
            else:
                analisis = analisis_calculado
            if id_proyecto is not None and principal is None and not predicciones_proyecto and analisis_calculado.get("contexto", {}).get("probabilidad_base_proyecto") is not None:
                resultados = [{
                    "id_proyecto": id_proyecto,
                    "semana": date.today().isoformat(),
                    "prob_evento": analisis_calculado["contexto"]["probabilidad_base_proyecto"],
                    "metodo": "tasa histórica suavizada; clasificador de proyecto sin datos suficientes",
                    "variables": {},
                }]
        probabilidades = {item["id_proyecto"]: item["prob_evento"] for item in resultados}
        cuadrillas = generar_predicciones_cuadrillas(
            conexion, horizonte, tipo_objetivo, probabilidades, id_proyecto, motor["predicciones"],
        )
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="No se pudo generar la predicción. Revisa las vistas, los datos y el tipo seleccionado.",
        ) from exc
    return sin_nulos({
        "tipo_objetivo": tipo_objetivo,
        "horizonte_semanas": horizonte,
        "unidad_analisis": "proyecto-semana",
        "evento": "al menos un evento del tipo objetivo dentro del horizonte seleccionado",
        "modelo": nombre_modelo,
        "validacion": validacion,
        "modelos": motor["niveles"],
        "historial": motor.get("historial"),
        "predicciones": resultados,
        "analisis_entidades": analisis,
        "analisis_global": {"cuadrillas": cuadrillas, "proximo_evento": proximo_evento_global},
        "diagnostico": {
            "base_datos": diagnostico_bd["base_datos"],
            "esquema": diagnostico_bd["esquema"],
            "cuadrillas_registradas": int(diagnostico_bd["cuadrillas_registradas"]),
            "cuadrillas_predichas": len(cuadrillas),
        },
        "advertencia_modelo": advertencia_modelo,
    })
