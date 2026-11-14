"""Registro de las predicciones publicadas y su evaluacion cuando su plazo termina.

La primera prediccion de cada semana queda como la oficial (la tabla tiene una clave unica por semana,
nivel, entidad, objetivo y plazo). La evaluacion compara lo predicho con lo que ocurrio despues.
"""
import logging

import numpy as np
import pandas as pd
from sklearn.metrics import brier_score_loss, roc_auc_score
from sqlalchemy import inspect, text

import reparto
from modelos_tasa import COLUMNA_OBJETIVO, OBJETIVOS, SEMANAS_REGISTRO, cargar_datos, probabilidad

NIVELES_REGISTRADOS = ("proyecto", "area", "cuadrilla", "trabajador", "actividad")
TABLA = "predicciones_registradas"


def registrar(engine, resultado):
    """Guarda la probabilidad de cada entidad vigente para los plazos evaluables (en semanas)."""
    if not inspect(engine).has_table(TABLA):
        return 0
    semana = resultado["semana_base"].date()
    filas = []
    for objetivo in OBJETIVOS:
        niveles = reparto.entidades(resultado, objetivo, 7)
        calidad = resultado["calidad"][objetivo]
        for nivel in NIVELES_REGISTRADOS:
            for fila in niveles[nivel]:
                tasa = fila["tasa_semanal"] or 0.0
                for h in SEMANAS_REGISTRO:
                    filas.append({
                        "semana": semana, "nivel": nivel, "id": fila["id"], "tipo": objetivo, "h": h,
                        "p": round(float(probabilidad(tasa, h)), 6), "modelo": calidad[nivel]["modelo"][:255],
                        "metodo": fila["metodo"],
                    })
    if filas:
        with engine.begin() as conexion:
            conexion.execute(text(f"""
                INSERT INTO public.{TABLA} (semana, nivel, id_entidad, tipo_objetivo, horizonte, probabilidad, modelo, metodo)
                VALUES (:semana, :nivel, :id, :tipo, :h, :p, :modelo, :metodo)
                ON CONFLICT DO NOTHING
            """), filas)
    return len(filas)


def _eventos_por_entidad(datos):
    """Una fila por (evento, nivel, entidad): a que entidades se atribuye cada evento."""
    ev = datos["eventos"].reset_index().rename(columns={"index": "fila"})
    columnas = ["fila", "fecha", *COLUMNA_OBJETIVO.values()]
    partes = [
        ev[columnas].assign(nivel="proyecto", id_entidad=ev["id_proyecto"]),
        ev[ev["id_area"] != reparto.SIN_AREA][columnas].assign(nivel="area", id_entidad=ev["id_area"]),
        ev.dropna(subset=["id_actividad"])[columnas].assign(nivel="actividad", id_entidad=lambda d: ev.loc[d.index, "id_actividad"]),
    ]
    participantes = datos["participantes"].merge(ev.dropna(subset=["id_evento"])[["id_evento", *columnas]], on="id_evento")
    partes.append(participantes[columnas].assign(nivel="trabajador", id_entidad=participantes["id_trabajador"]))
    # Cuadrilla: algun participante era integrante en la fecha del evento.
    mem = datos["membresia"]
    cruce = participantes.merge(mem, on="id_trabajador")
    cruce = cruce[(cruce["fecha_inicio"].isna() | (cruce["fecha_inicio"] <= cruce["fecha"])) &
                  (cruce["fecha_fin"].isna() | (cruce["fecha_fin"] >= cruce["fecha"]))]
    obreros = participantes.merge(datos["obreros"][~datos["obreros"]["id_cuadrilla"].isin(mem["id_cuadrilla"])], on="id_trabajador")
    for tabla in (cruce, obreros):
        partes.append(tabla[columnas].assign(nivel="cuadrilla", id_entidad=tabla["id_cuadrilla"]))
    salida = pd.concat(partes, ignore_index=True).drop_duplicates(["fila", "nivel", "id_entidad"])
    salida["id_entidad"] = salida["id_entidad"].astype(int)
    salida["semana"] = salida["fecha"] - pd.to_timedelta(salida["fecha"].dt.weekday, unit="D")
    salida["semana"] = salida["semana"].dt.normalize()
    return salida


def evaluar(engine, hoy=None):
    """Aciertos de lo publicado, solo en semanas cuyo plazo ya termino."""
    if not inspect(engine).has_table(TABLA):
        return []
    registros = pd.read_sql(text(f"SELECT semana, nivel, id_entidad, tipo_objetivo, horizonte, probabilidad FROM public.{TABLA}"), engine)
    registros = registros[registros["tipo_objetivo"].isin(OBJETIVOS)]
    if registros.empty:
        return []
    datos = cargar_datos(engine, hoy)
    registros["semana"] = pd.to_datetime(registros["semana"])
    registros["fin"] = registros["semana"] + pd.to_timedelta(registros["horizonte"] * 7, unit="D")
    # Solo plazos completos: la ultima semana con datos aun puede recibir eventos.
    registros = registros[registros["fin"] <= datos["semana_base"]]
    if registros.empty:
        return []
    atribuidos = _eventos_por_entidad(datos)
    salida = []
    for (objetivo, horizonte, nivel), grupo in registros.groupby(["tipo_objetivo", "horizonte", "nivel"]):
        eventos = atribuidos[(atribuidos["nivel"] == nivel) & atribuidos[COLUMNA_OBJETIVO[objetivo]]][["id_entidad", "fecha"]]
        cruce = grupo.reset_index().merge(eventos, how="left", on="id_entidad")
        cruce["ocurrio"] = (cruce["fecha"] >= cruce["semana"]) & (cruce["fecha"] < cruce["fin"])
        y = cruce.groupby("index")["ocurrio"].any().reindex(grupo.index, fill_value=False).astype(int)
        p = grupo["probabilidad"].astype(float)
        fila = {
            "nivel": nivel, "tipo_objetivo": objetivo, "horizonte": int(horizonte), "predicciones": int(len(grupo)),
            "ocurrieron": int(y.sum()), "riesgo_predicho": round(float(p.mean()), 4), "tasa_real": round(float(y.mean()), 4),
            "brier": round(float(brier_score_loss(y, np.clip(p, 0, 1))), 4),
        }
        if y.nunique() == 2 and len(y) >= 20:
            fila["auc_roc"] = round(float(roc_auc_score(y, p)), 4)
        salida.append(fila)
    return salida


def registrar_seguro(engine, resultado):
    try:
        return registrar(engine, resultado)
    except Exception:
        logging.getLogger(__name__).exception("No se pudieron registrar las predicciones.")
        return 0
