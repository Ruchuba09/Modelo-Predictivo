"""Exporta los datasets de los tres modelos para Azure AutoML y compara sus predicciones con las del sistema.

Cada dataset se separa por fecha en entrenamiento, validacion y prueba (las semanas mas recientes), para que
Azure no aprenda del futuro. No lleva identificadores ni fechas: las claves de cada fila y las predicciones del
sistema para el tramo de prueba quedan en claves_no_subir.csv, que no se sube a Azure.

Datasets:
  incidentes/  regresion: incidentes reales por proyecto-area-semana (modelo A).
  lesion/      clasificacion: si un incidente termino con lesion (modelo B).
  todos/       regresion: eventos de cualquier tipo salvo Tarjeta PARE por proyecto-area-semana (modelo C).

Uso:
  python exportar_azure.py exportar --db postgresql+psycopg2://usuario:clave@host/base --salida data/automl
  python exportar_azure.py evaluar --carpeta data/automl/incidentes --predicciones predicciones_azure.csv

Exportar ajusta copias de los modelos en memoria para predecir el tramo de prueba; no toca los modelos
publicados ni su cache.
"""
import argparse
import json
import os
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import brier_score_loss, log_loss, mean_poisson_deviance, roc_auc_score
from threadpoolctl import threadpool_limits

import modelos_tasa as mt

TRAMOS = ("entrenamiento", "validacion", "prueba")
MLTABLE = """paths:
  - file: ./datos.csv
transformations:
  - read_delimited:
      delimiter: ','
      encoding: 'utf8'
      header: all_files_same_headers
"""
REGRESION = {"incidentes": ("n_inc", "incidentes"), "todos": ("n_todos", "eventos")}
OBJETIVO_LESION = "lesion"
GB, RP = "Gradient boosting de Poisson", "Regresión de Poisson"


def tramos_por_semana(semanas, semanas_prueba, semanas_validacion):
    """Etiqueta cada semana observada: las ultimas son prueba, las anteriores validacion y el resto entrenamiento."""
    orden = np.sort(pd.unique(semanas))
    inicio_prueba = orden[-semanas_prueba]
    inicio_validacion = orden[-(semanas_prueba + semanas_validacion)]
    return np.select([semanas >= inicio_prueba, semanas >= inicio_validacion], ["prueba", "validacion"], "entrenamiento")


def _guardar(carpeta, datos, claves, tramo, descripcion):
    carpeta.mkdir(parents=True, exist_ok=True)
    for nombre in TRAMOS:
        destino = carpeta / nombre
        destino.mkdir(exist_ok=True)
        datos[tramo == nombre].to_csv(destino / "datos.csv", index=False)
        (destino / "MLTable").write_text(MLTABLE, encoding="utf-8")
    claves.assign(tramo=tramo).to_csv(carpeta / "claves_no_subir.csv", index=False)
    pd.DataFrame({"columna": list(datos.columns), "descripcion": [descripcion.get(c, mt.etiqueta(c)) for c in datos.columns]}).to_csv(
        carpeta / "diccionario.csv", index=False)


def _resumen_tramos(claves, tramo, objetivo):
    salida = {}
    for nombre in TRAMOS:
        filas = claves[tramo == nombre]
        salida[nombre] = {"filas": int(len(filas)), "desde": str(filas["semana"].min().date()), "hasta": str(filas["semana"].max().date()),
                          "suma_objetivo": float(filas[objetivo].sum()), "filas_con_evento": int((filas[objetivo] > 0).sum())}
    return salida


def exportar(engine, salida, semanas_prueba=26, semanas_validacion=26):
    datos = mt.cargar_datos(engine)
    X, meta = mt.construir_panel(datos)
    observadas = meta["observada"].to_numpy()
    X, meta = X[observadas].reset_index(drop=True), meta[observadas].reset_index(drop=True)
    tramo = tramos_por_semana(meta["semana"].to_numpy(), semanas_prueba, semanas_validacion)
    entrena, prueba = tramo == "entrenamiento", tramo == "prueba"
    # Variables elegidas solo con el entrenamiento, como haria Azure.
    columnas = mt.columnas_tasa(X[entrena])
    resumen = {"semana_base": str(datos["semana_base"].date()), "semanas_prueba": semanas_prueba, "semanas_validacion": semanas_validacion, "datasets": {}}

    with threadpool_limits(limits=1):
        for nombre, (conteo, objetivo) in REGRESION.items():
            tabla = X[columnas].assign(**{objetivo: meta[conteo].to_numpy()})
            claves = meta[["id_proyecto", "id_area", "semana"]].assign(**{objetivo: meta[conteo].to_numpy()})
            # Predicciones del sistema para la prueba, entrenado solo con el tramo de entrenamiento.
            y = meta.loc[entrena, conteo]
            claves["pred_referencia"] = np.nan
            claves.loc[prueba, "pred_referencia"] = mt.TasaReferencia().fit(meta[entrena], y).predict(meta[prueba])
            for candidato, columna in ((GB, "pred_boosting"), (RP, "pred_poisson")):
                modelo = mt.CANDIDATOS_TASA[candidato]().fit(X.loc[entrena, columnas], y)
                claves[columna] = np.nan
                claves.loc[prueba, columna] = np.clip(modelo.predict(X.loc[prueba, columnas]), 1e-6, None)
            _guardar(Path(salida) / nombre, tabla, claves, tramo, {objetivo: f"OBJETIVO: {mt.etiqueta(conteo)} en la semana"})
            resumen["datasets"][nombre] = {"tarea": "regresion", "objetivo": objetivo, "variables": len(columnas),
                                           "tramos": _resumen_tramos(claves, tramo, objetivo)}

        # Modelo B: un incidente por fila; solo lo que se sabe antes de su semana.
        incidentes, Xl = mt._incidentes_del_panel(datos, X, meta)
        semana_inc = incidentes["semana"].to_numpy()
        tramo_l = np.where(semana_inc >= meta.loc[prueba, "semana"].min(), "prueba",
                           np.where(semana_inc >= meta.loc[tramo == "validacion", "semana"].min(), "validacion", "entrenamiento"))
        columnas_l = columnas + [c for c in mt.COLUMNAS_SOLO_LESION if c in Xl]
        y_l = incidentes[OBJETIVO_LESION].astype(int).to_numpy()
        tabla_l = Xl[columnas_l].assign(**{OBJETIVO_LESION: y_l})
        claves_l = incidentes[["id_proyecto", "id_area", "semana"]].assign(**{OBJETIVO_LESION: y_l})
        en_l, pr_l = tramo_l == "entrenamiento", tramo_l == "prueba"
        for clase, columna in ((mt.LesionReferencia, "pred_referencia"), (mt.LesionLogistica, "pred_logistica")):
            modelo = clase().fit(Xl[en_l], y_l[en_l])
            claves_l[columna] = np.nan
            claves_l.loc[pr_l, columna] = modelo.predict(Xl[pr_l])
        _guardar(Path(salida) / "lesion", tabla_l, claves_l, tramo_l, {OBJETIVO_LESION: "OBJETIVO: 1 si el incidente tuvo lesión, 0 si no"})
        resumen["datasets"]["lesion"] = {"tarea": "clasificacion", "objetivo": OBJETIVO_LESION, "variables": len(columnas_l),
                                         "tramos": _resumen_tramos(claves_l, tramo_l, OBJETIVO_LESION)}

    (Path(salida) / "resumen.json").write_text(json.dumps(resumen, indent=2, ensure_ascii=False), encoding="utf-8")
    return resumen


# ---------------------------------------------------------------- evaluacion

def _columna_prediccion(df, columna=None):
    """Azure nombra la prediccion '<objetivo>_predicted' y las probabilidades por clase; se acepta cualquiera."""
    if columna:
        return df[columna]
    for candidata in ("1", "1.0", "True", "probabilidad", "prediccion"):
        if candidata in df:
            return df[candidata]
    # En clasificacion se necesita la probabilidad, no la clase predicha.
    predichas = sorted((c for c in df.columns if "_predicted" in c), key=lambda c: "proba" not in c)
    if not predichas:
        raise SystemExit(f"No encuentro la columna de prediccion; indica --columna. Columnas: {list(df.columns)}")
    return df[predichas[0]]


def _metricas_regresion(y, p):
    p = np.clip(np.asarray(p, dtype=float), 1e-6, None)
    positivos = y > 0
    return {"devianza_poisson": round(float(mean_poisson_deviance(y, p)), 5),
            "auc_roc": round(float(roc_auc_score(positivos, p)), 4) if 0 < positivos.sum() < len(y) else None,
            "predicho_total": round(float(p.sum()), 1), "real_total": float(y.sum())}


def _metricas_clasificacion(y, p):
    p = np.clip(np.asarray(p, dtype=float), 1e-6, 1 - 1e-6)
    return {"log_loss": round(float(log_loss(y, p, labels=[0, 1])), 5), "brier": round(float(brier_score_loss(y, p)), 5),
            "auc_roc": round(float(roc_auc_score(y, p)), 4) if 0 < y.sum() < len(y) else None,
            "predicho_medio": round(float(p.mean()), 4), "real_medio": round(float(y.mean()), 4)}


def evaluar(carpeta, predicciones, columna=None):
    """Compara las predicciones de Azure para el tramo de prueba con las del sistema, fila por fila."""
    carpeta = Path(carpeta)
    claves = pd.read_csv(carpeta / "claves_no_subir.csv")
    claves = claves[claves["tramo"] == "prueba"].reset_index(drop=True)
    azure = _columna_prediccion(pd.read_csv(predicciones), columna).to_numpy(dtype=float)
    if len(azure) != len(claves):
        raise SystemExit(f"Azure entrego {len(azure)} predicciones y la prueba tiene {len(claves)} filas: deben venir en el mismo orden que prueba/datos.csv.")
    clasificacion = OBJETIVO_LESION in claves
    objetivo = OBJETIVO_LESION if clasificacion else next(o for _, o in REGRESION.values() if o in claves)
    y = claves[objetivo].to_numpy(dtype=float)
    metricas = _metricas_clasificacion if clasificacion else _metricas_regresion
    resultado = {"Azure AutoML": metricas(y, azure)}
    for columna_sistema in [c for c in claves.columns if c.startswith("pred_")]:
        resultado[columna_sistema.removeprefix("pred_")] = metricas(y, claves[columna_sistema].to_numpy())
    clave = "log_loss" if clasificacion else "devianza_poisson"
    referencia = resultado["referencia"][clave]
    for nombre, valores in resultado.items():
        valores["mejora_vs_referencia_pct"] = round(100 * (referencia - valores[clave]) / referencia, 2)
    return {"objetivo": objetivo, "filas_prueba": len(y), "metrica_principal": clave, "modelos": resultado}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="accion", required=True)
    ex = sub.add_parser("exportar")
    ex.add_argument("--db", default=os.getenv("DATABASE_URL"))
    ex.add_argument("--salida", default="data/automl")
    ex.add_argument("--semanas-prueba", type=int, default=26)
    ex.add_argument("--semanas-validacion", type=int, default=26)
    ev = sub.add_parser("evaluar")
    ev.add_argument("--carpeta", required=True)
    ev.add_argument("--predicciones", required=True)
    ev.add_argument("--columna")
    a = parser.parse_args()
    warnings.simplefilter("ignore")
    if a.accion == "exportar":
        if not a.db:
            raise SystemExit("Indica --db o DATABASE_URL.")
        from sqlalchemy import create_engine
        resultado = exportar(create_engine(a.db), a.salida, a.semanas_prueba, a.semanas_validacion)
    else:
        resultado = evaluar(a.carpeta, a.predicciones, a.columna)
    print(json.dumps(resultado, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
