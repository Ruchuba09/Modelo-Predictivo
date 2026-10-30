import os
from datetime import date

from fastapi import FastAPI, HTTPException, Query
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError

from modelo_predictivo import (
    generar_analisis_entidades,
    generar_predicciones,
    generar_predicciones_cuadrillas,
    generar_predicciones_historicas,
    tipos_disponibles,
)


DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, pool_pre_ping=True) if DATABASE_URL else None
app = FastAPI(title="Modelo predictivo de eventos", version="1.0.0")


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
        return {"tipos": ["todos", *tipos_disponibles(db())]}
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="No se pudieron leer las vistas predictivas. Ejecuta primero 01_vistas_modelo_predictivo.sql.",
        ) from exc


@app.get("/predicciones")
def predicciones(
    tipo_objetivo: str = Query(default="todos", min_length=1, max_length=100),
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
        if tipo_objetivo != "todos" and tipo_objetivo not in disponibles:
            raise HTTPException(status_code=422, detail="El tipo de evento seleccionado no existe.")
        advertencia_modelo = None
        nombre_modelo = "HistGradientBoostingClassifier"
        try:
            # Siempre entrega la tabla comparativa de todos los proyectos vigentes;
            # el id solicitado solo limita el análisis detallado por entidades.
            resultados = generar_predicciones(conexion, tipo_objetivo, horizonte)
        except (ValueError, SystemExit) as exc:
            # La falta de historial suficiente no deja la vista vacía: entrega
            # un estimador histórico explícito para todos los proyectos.
            resultados = generar_predicciones_historicas(conexion, tipo_objetivo, horizonte)
            advertencia_modelo = str(exc)
            nombre_modelo = "Estimador histórico suavizado (respaldo)"
        analisis = None
        proximo_evento_global = None
        id_analisis = id_proyecto
        if id_analisis is None and resultados:
            id_analisis = resultados[0]["id_proyecto"]
        if id_analisis is not None:
            principal = next((item for item in resultados if item["id_proyecto"] == id_analisis), None)
            analisis_calculado = generar_analisis_entidades(
                conexion, id_analisis, tipo_objetivo, horizonte,
                principal["prob_evento"] if principal else None,
            )
            if id_proyecto is None:
                proximo_evento_global = analisis_calculado.get("contexto", {}).get("evento_estimado")
            else:
                analisis = analisis_calculado
            if id_proyecto is not None and principal is None and advertencia_modelo and analisis_calculado.get("contexto", {}).get("probabilidad_base_proyecto") is not None:
                resultados = [{
                    "id_proyecto": id_proyecto,
                    "semana": date.today().isoformat(),
                    "prob_evento": analisis_calculado["contexto"]["probabilidad_base_proyecto"],
                    "metodo": "tasa histórica suavizada; clasificador de proyecto sin datos suficientes",
                    "variables": {},
                }]
        probabilidades = {item["id_proyecto"]: item["prob_evento"] for item in resultados}
        cuadrillas = generar_predicciones_cuadrillas(
            conexion, horizonte, tipo_objetivo, probabilidades, id_proyecto,
        )
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="No se pudo generar la predicción. Revisa las vistas, los datos y el tipo seleccionado.",
        ) from exc
    return {
        "tipo_objetivo": tipo_objetivo,
        "horizonte_semanas": horizonte,
        "unidad_analisis": "proyecto-semana",
        "evento": "al menos un evento del tipo objetivo dentro del horizonte seleccionado",
        "modelo": nombre_modelo,
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
    }
