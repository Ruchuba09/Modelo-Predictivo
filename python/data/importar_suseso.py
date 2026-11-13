"""Arma un dataset de tipo de accidente para AutoML con los datos abiertos de SUSESO.

Fuente: "Numero accidentes del trabajo y de trayecto" (datos.gob.cl, SUSESO). El archivo no trae casos
individuales sino conteos por combinacion de region, actividad, mes, tamano de empresa, forma del
accidente, edad y sexo. Cada conteo se expande a una fila por accidente.

Solo usa accidentes del trabajo (no de trayecto) desde 2021, cuando SUSESO pasa de boletines agregados
a sus registros administrativos. La forma del accidente se traduce a las categorias de AVA
(cat_categoria_evento); las filas sin forma informada se descartan.

Las variables son las que se conocen antes del accidente. El agente y la parte del cuerpo se omiten:
describen el accidente mismo y revelarian la respuesta.

Uso: python importar_suseso.py suseso.csv --salida carpeta [--actividad Construcción] [--desde 2026 --hasta 2026]
"""
import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

URL = ("https://datos.gob.cl/dataset/dea4c9ac-a159-4b2a-ba3d-cb0b9d6fd8fc/resource/"
       "15014f8e-db85-48ea-ae21-e60a7bc15eb9/download/accidentes_trabajo_trayecto_datos_gob.csv")
COLUMNAS = ["region", "actividad", "periodo", "origen", "tamano_empresa", "anio", "agente", "forma",
            "nacionalidad", "parte_cuerpo", "mutual", "tramo_edad", "mujer", "hombre", "sexo_sin_info", "total"]
DESDE = 2021
COLUMNA_OBJETIVO = "categoria"
TRAMOS = ("entrenamiento", "validacion", "prueba")
MLTABLE = """paths:
  - file: ./datos.csv
transformations:
  - read_delimited:
      delimiter: ','
      encoding: 'utf8'
      header: all_files_same_headers
"""
# Forma del accidente de SUSESO -> categoria de AVA. SUSESO no separa caida de altura y mismo nivel,
# ni golpeado por y contra, asi que esas categorias de AVA se agrupan.
CATEGORIA_AVA = {
    "Caída de personas": "Caída",
    "Pisadas (tropiezos sin caídas)": "Pérdida de equilibrio",
    "Golpes por o contra objetos": "Golpe",
    "Objetos corto-punzantes": "Contacto con",
    "Contacto con temperaturas extremas": "Contacto con",
    "Contacto con condiciones o sustancias físicas, químicas o biológicas": "Contacto con",
    "Contacto con corriente eléctrica": "Contacto eléctrico",
    "Proyección de partículas": "Proyección de",
    "Atrapamientos o amputaciones": "Atrapamiento",
    "Sobreesfuerzo y falsos movimientos": "Sobreesfuerzo",
    "Accidentes que involucran vehículos": "Otros",
    "Agresiones por animales": "Otros",
    "Amenazas o agresiones de personas": "Otros",
    "Picaduras de insectos": "Otros",
    "Otras formas de accidentes": "Otros",
}
DESCRIPCION = {
    "region": ("región del accidente", "parcial: proyectos.ubicacion es texto libre"),
    "tamano_empresa": ("tramo de trabajadores de la empresa", "sí: se calcula contando trabajadores por empresa"),
    "tramo_edad": ("tramo de edad del trabajador", "no: personas no guarda fecha de nacimiento"),
    "sexo": ("sexo del trabajador", "no"),
    "nacionalidad": ("nacionalidad del trabajador", "no"),
    "mes_sin": ("época del año", "sí"),
    "mes_cos": ("época del año", "sí"),
}


def leer(ruta, actividad, desde=DESDE, hasta=None):
    d = pd.read_csv(ruta, sep="|", dtype=str, names=COLUMNAS, header=0)
    d["anio"] = pd.to_numeric(d["anio"], errors="coerce")
    d = d[(d["anio"] >= desde) & (d["anio"] <= (hasta or d["anio"].max())) & (d["origen"] == "Accidentes del trabajo")]
    if actividad:
        d = d[d["actividad"] == actividad]
    d = d.assign(categoria=d["forma"].map(CATEGORIA_AVA)).dropna(subset=["categoria"])
    d["tamano_empresa"] = d["tamano_empresa"].str.strip('"')
    # Una fila por accidente: cada conteo por sexo se repite tantas veces como accidentes tenga.
    largo = d.melt(id_vars=[c for c in d if c not in ("mujer", "hombre", "sexo_sin_info", "total")],
                   value_vars=["mujer", "hombre", "sexo_sin_info"], var_name="sexo", value_name="n")
    largo["n"] = pd.to_numeric(largo["n"], errors="coerce").fillna(0).astype(int)
    largo = largo.loc[largo.index.repeat(largo["n"])].drop(columns="n")
    largo["sexo"] = largo["sexo"].replace({"sexo_sin_info": "sin_info"})
    largo["fecha"] = pd.to_datetime(largo["periodo"] + "-01")
    mes = largo["fecha"].dt.month
    largo["mes_sin"], largo["mes_cos"] = np.sin(2 * np.pi * mes / 12), np.cos(2 * np.pi * mes / 12)
    largo = largo.replace({"Sin información": np.nan, "Sin Información": np.nan})
    # El orden de filas dentro de un mes no significa nada: se baraja para no dejar patrones del archivo.
    return largo.sample(frac=1, random_state=0).sort_values("fecha", kind="stable", ignore_index=True)


def exportar(accidentes, carpeta, actividad):
    meses = accidentes["fecha"]
    q70, q85 = meses.quantile(0.70), meses.quantile(0.85)
    mascaras = (meses < q70, (meses >= q70) & (meses < q85), meses >= q85)
    variables = list(DESCRIPCION)
    resumen = {"objetivo": "categoría del accidente (forma SUSESO traducida a AVA)", "nivel": "accidente",
               "tarea": "clasificación multiclase", "columna_objetivo": COLUMNA_OBJETIVO, "fuente": URL,
               "actividad": actividad or "todas", "variables": len(variables), "tramos": {}}
    for nombre, mascara in zip(TRAMOS, mascaras):
        tramo = accidentes.loc[mascara]
        destino = carpeta / nombre
        destino.mkdir(parents=True, exist_ok=True)
        tramo[variables + [COLUMNA_OBJETIVO]].to_csv(destino / "datos.csv", index=False)
        (destino / "MLTable").write_text(MLTABLE, encoding="utf-8")
        resumen["tramos"][nombre] = {
            "filas": len(tramo), "desde": str(tramo["fecha"].min().date()), "hasta": str(tramo["fecha"].max().date()),
            "clases": tramo[COLUMNA_OBJETIVO].value_counts().to_dict(),
        }
    pd.DataFrame([{"columna": c, "descripcion": d, "en_base_de_datos_ava": a} for c, (d, a) in DESCRIPCION.items()]
                 ).to_csv(carpeta / "diccionario.csv", index=False)
    (carpeta / "resumen.json").write_text(json.dumps(resumen, indent=2, ensure_ascii=False), encoding="utf-8")
    return resumen


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("archivo", help=f"CSV de SUSESO, descargado de {URL}")
    ap.add_argument("--salida", required=True)
    ap.add_argument("--actividad", default="Construcción", help="actividad económica CIIU; vacío para todas")
    ap.add_argument("--desde", type=int, default=DESDE, help="primer año (desde 2021 hay registros administrativos)")
    ap.add_argument("--hasta", type=int, help="último año; por defecto el más reciente")
    a = ap.parse_args()
    if a.desde < DESDE:
        ap.error(f"antes de {DESDE} SUSESO solo publica boletines agregados")
    accidentes = leer(a.archivo, a.actividad, a.desde, a.hasta)
    resumen = exportar(accidentes, Path(a.salida), a.actividad)
    print(json.dumps(resumen["tramos"], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
