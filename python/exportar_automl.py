"""Exporta datasets limpios de proyecto y semana para Azure AutoML.

Separa por fecha con los mismos cortes de la red neuronal y deja fuera identificadores, fechas y todo
lo que revele el futuro. Las claves de cada fila quedan en un archivo aparte, que no se sube a AutoML.

Uso: python exportar_automl.py --db postgresql+psycopg2://usuario:clave@host/base --salida carpeta --semanas 9 13
"""
import argparse
import json
import os
import re
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine

from modelo_predictivo import OBJETIVO_INCIDENTES
from motor_riesgo import etiqueta
from red_neuronal import _cargar_base_red, dividir_temporal, preparar_eventos

COLUMNA_OBJETIVO = "evento"
PROHIBIDAS = re.compile(r"^(id_|entidad$|semana$|fecha|y$|observada$|sem_restantes$)")
NOMBRE_PLAZO = {9: "2_meses", 13: "3_meses"}
TRAMOS = ("entrenamiento", "validacion", "prueba")
MLTABLE = """paths:
  - file: ./datos.csv
transformations:
  - read_delimited:
      delimiter: ','
      encoding: 'utf8'
      header: all_files_same_headers
"""


def armar_tramos(X, y, meta, h):
    """Devuelve los tramos sin columnas prohibidas ni filas cuyo plazo aun no termina."""
    observadas = meta["observada"].to_numpy()
    X, y, meta = X[observadas], y[observadas], meta[observadas]
    en_train, en_val, en_test = dividir_temporal(meta["semana"], h)
    columnas = [
        c for c in X.columns
        if not PROHIBIDAS.search(c) and X.loc[en_train, c].notna().any() and X.loc[en_train, c].nunique(dropna=True) > 1
    ]
    tramos = {}
    for nombre, mascara in zip(TRAMOS, (en_train, en_val, en_test)):
        tramos[nombre] = {
            "datos": X.loc[mascara, columnas].assign(**{COLUMNA_OBJETIVO: y[mascara].astype(int)}),
            "claves": meta.loc[mascara, ["entidad", "semana"]].rename(columns={"entidad": "id_proyecto"}),
        }
    return tramos, columnas


def guardar(tramos, columnas, h, carpeta):
    resumen = {"objetivo": OBJETIVO_INCIDENTES, "nivel": "proyecto", "semanas_modelo": h, "columna_objetivo": COLUMNA_OBJETIVO, "variables": len(columnas), "tramos": {}}
    for nombre, tramo in tramos.items():
        destino = carpeta / nombre
        destino.mkdir(parents=True, exist_ok=True)
        tramo["datos"].to_csv(destino / "datos.csv", index=False)
        (destino / "MLTable").write_text(MLTABLE, encoding="utf-8")
        semanas = tramo["claves"]["semana"]
        resumen["tramos"][nombre] = {
            "filas": len(tramo["datos"]), "eventos": int(tramo["datos"][COLUMNA_OBJETIVO].sum()),
            "tasa": round(float(tramo["datos"][COLUMNA_OBJETIVO].mean()), 4),
            "desde": str(semanas.min().date()), "hasta": str(semanas.max().date()),
        }
    # Solo para comparar despues; no se sube a AutoML.
    pd.concat(t["claves"].assign(tramo=n) for n, t in tramos.items()).to_csv(carpeta / "claves_no_subir.csv", index=False)
    pd.DataFrame({"columna": columnas, "descripcion": [etiqueta(c) for c in columnas]}).to_csv(carpeta / "diccionario.csv", index=False)
    (carpeta / "resumen.json").write_text(json.dumps(resumen, indent=2, ensure_ascii=False), encoding="utf-8")
    return resumen


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--db", default=os.getenv("DATABASE_URL"))
    ap.add_argument("--salida", required=True)
    ap.add_argument("--semanas", type=int, nargs="+", default=[9, 13])
    a = ap.parse_args()
    if not a.db:
        raise SystemExit("Define DATABASE_URL o usa --db.")
    base = _cargar_base_red(create_engine(a.db))
    for h in a.semanas:
        X, Y, meta = preparar_eventos(base, h)
        tramos, columnas = armar_tramos(X, Y[OBJETIVO_INCIDENTES], meta, h)
        resumen = guardar(tramos, columnas, h, Path(a.salida) / NOMBRE_PLAZO.get(h, f"{h}_semanas"))
        print(json.dumps(resumen, ensure_ascii=False))


if __name__ == "__main__":
    main()
