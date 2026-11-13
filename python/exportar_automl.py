"""Exporta datasets limpios de proyecto y semana para Azure AutoML.

Separa por fecha con los mismos cortes de la red neuronal y deja fuera identificadores, fechas y todo
lo que revele el futuro. Las claves de cada fila quedan en un archivo aparte, que no se sube a AutoML.

Con --historicos usa el CSV anonimo de data/importar_logs.py (logs reales de AVA) y arma un panel
cliente-semana, porque esos logs no traen proyectos, cuadrillas ni trabajadores.

Con --nivel arma el panel de otra entidad (trabajador, cuadrilla, area o actividad) en vez del proyecto.
Con --severidad exporta un evento por fila para predecir si un incidente sera severo, solo con lo que se
sabe cuando ocurre: nada de causas ni severidad potencial, que se registran despues.

Uso: python exportar_automl.py --db postgresql+psycopg2://usuario:clave@host/base --salida carpeta --semanas 9 13
     python exportar_automl.py --db ... --salida carpeta --nivel trabajador --semanas 4 9 13
     python exportar_automl.py --db ... --salida carpeta --severidad
     python exportar_automl.py --historicos historicos.csv --salida carpeta --semanas 9 13
"""
import argparse
import json
import os
import re
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy import create_engine

from modelo_predictivo import OBJETIVO_INCIDENTES
from motor_riesgo import _expandir, construir_niveles, construir_panel, etiqueta, lunes
from red_neuronal import _cargar_base_red, dividir_temporal, preparar_eventos

COLUMNA_OBJETIVO = "evento"
PROHIBIDAS = re.compile(r"^(id_|entidad$|semana$|fecha|y$|observada$|sem_restantes$)")
NOMBRE_PLAZO = {4: "1_mes", 9: "2_meses", 13: "3_meses"}
TRAMOS = ("entrenamiento", "validacion", "prueba")
MLTABLE = """paths:
  - file: ./datos.csv
transformations:
  - read_delimited:
      delimiter: ','
      encoding: 'utf8'
      header: all_files_same_headers
"""


SEVERIDAD_HISTORICA = {"fatal": 5, "lesion_ctp": 4, "lesion_stp": 3}
# Sin cliente identificable no se sabe a que exposicion corresponde el incidente.
CLIENTES_SIN_OBRA = ("OTRO", "AVA")


def periodos_cubiertos(fechas, brecha_dias=180):
    """Separa los tramos de tiempo que cubren los logs; un vacio largo es un log faltante, no ceros."""
    fechas = fechas.sort_values()
    cortes = fechas.diff().dt.days.gt(brecha_dias).cumsum()
    return [(grupo.min(), grupo.max()) for _, grupo in fechas.groupby(cortes.to_numpy())]


def panel_historico(historicos, h):
    """Panel cliente-semana de los logs reales, con el objetivo de incidentes laborales.

    Cada periodo cubierto por los logs se arma por separado, para que ninguna fila mire hacia
    atras ni hacia adelante a traves de un vacio sin registros.
    """
    historicos = historicos.assign(fecha=pd.to_datetime(historicos["fecha"]))
    clientes = sorted(set(historicos["cliente"]) - set(CLIENTES_SIN_OBRA))
    numeros = {nombre: i for i, nombre in enumerate(clientes, start=1)}
    conocidos = set()
    paneles = []
    for inicio, fin in periodos_cubiertos(historicos["fecha"]):
        tramo = historicos[historicos["fecha"].between(inicio, fin)]
        X, meta = _panel_periodo(tramo, h, conocidos, numeros)
        paneles.append((X, meta.assign(periodo=str(inicio.date()))))
        conocidos |= set(tramo["cliente"])
    X = pd.concat([p[0] for p in paneles], ignore_index=True)
    meta = pd.concat([p[1] for p in paneles], ignore_index=True)
    # Un riesgo que no aparece en un periodo falta en su panel: son cero eventos, no un dato faltante.
    conteos = [c for c in X.columns if c.startswith("riesgo_")]
    X[conteos] = X[conteos].fillna(0)
    return X, meta


def _panel_periodo(historicos, h, conocidos, numeros):
    """Un cliente ya visto en un periodo anterior entra desde el inicio; uno nuevo, la semana
    siguiente a su primer incidente. Todos siguen hasta el final del periodo: cortarlos en su
    ultimo incidente revelaria el futuro. Solo se etiquetan semanas cuyo plazo cae en el periodo.
    """
    datos = historicos[~historicos["cliente"].isin(CLIENTES_SIN_OBRA)].copy()
    ev = pd.DataFrame({
        "entidad": datos["cliente"].map(numeros), "fecha": datos["fecha"], "fecha_cierre": pd.NaT,
        "objetivo": datos["laboral"].astype(bool), "proactivo": False, "pare": False,
        "severidad": datos["categoria"].map(SEVERIDAD_HISTORICA), "condicion": float("nan"),
        "noche": datos["turno"].eq("noche"), "dia_ciclo": pd.to_numeric(datos["dia_ciclo"], errors="coerce"),
        "riesgos": datos["riesgos"].fillna("").map(lambda r: [x for x in r.split(",") if x]),
    })
    fin_log = lunes(ev["fecha"]).max()
    inicio_periodo = lunes(ev["fecha"]).min()
    rango = ev.groupby("entidad")["fecha"].min().rename("inicio").reset_index()
    rango["inicio"] = lunes(rango["inicio"]) + pd.Timedelta(weeks=1)
    ya_vistos = rango["entidad"].isin([numeros[c] for c in conocidos if c in numeros])
    rango.loc[ya_vistos, "inicio"] = inicio_periodo
    rango["fin"] = fin_log
    # hoy = semana siguiente al cierre del log: lo posterior no esta registrado, no es cero.
    hoy = fin_log + pd.Timedelta(weeks=1)
    spine = _expandir(rango, "entidad", "inicio", "fin", hoy=hoy)
    return construir_panel(spine, ev, h, hoy=hoy)


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
            "claves": meta.loc[mascara, ["entidad", "semana"]],
        }
    return tramos, columnas


def guardar(tramos, columnas, h, carpeta, objetivo=OBJETIVO_INCIDENTES, nivel="proyecto"):
    resumen = {"objetivo": objetivo, "nivel": nivel, "semanas_modelo": h, "columna_objetivo": COLUMNA_OBJETIVO, "variables": len(columnas), "tramos": {}}
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


COLUMNA_SEVERO = "severo"
NIVEL_SEVERO = 3  # Media, Alta y Critica en cat_severidad
SQL_SEVERIDAD = """
    SELECT e.id_evento AS entidad, COALESCE(e.fecha_ocurrencia, e.fecha_creacion) AS semana,
           EXTRACT(hour FROM COALESCE(e.fecha_ocurrencia, e.fecha_creacion))::int AS hora,
           EXTRACT(isodow FROM COALESCE(e.fecha_ocurrencia, e.fecha_creacion))::int AS dia_semana,
           EXTRACT(month FROM COALESCE(e.fecha_ocurrencia, e.fecha_creacion))::int AS mes,
           ct.nombre AS turno, e.dia_ciclo, em.tipo = 'contratista' AS contratista,
           (COALESCE(e.fecha_ocurrencia, e.fecha_creacion)::date - t.fecha_ingreso) / 365.25 AS experiencia_anios,
           tob.nombre AS oficio, ce.nombre AS categoria_evento, rc.codigo AS riesgo_critico,
           e.nivel_elevacion, s.nivel AS nivel_severidad
    FROM public.eventos e
    JOIN public.tipo_eventos te ON te.id_tipo_evento = e.id_tipo_evento AND te.es_incidente
    JOIN public.cat_severidad s ON s.id_severidad = e.id_severidad
    LEFT JOIN public.trabajadores t ON t.id_trabajador = e.id_trabajador
    LEFT JOIN public.obreros o ON o.id_trabajador = e.id_trabajador
    LEFT JOIN public.tipo_obreros tob ON tob.id_tipo_obrero = o.id_tipo_obrero
    LEFT JOIN public.empresas em ON em.id_empresa = COALESCE(e.id_empresa, t.id_empresa)
    LEFT JOIN public.cat_turno ct ON ct.id_turno = e.id_turno
    LEFT JOIN public.cat_categoria_evento ce ON ce.id_categoria_evento = e.id_categoria_evento
    LEFT JOIN public.actividades ac ON ac.id_actividad = e.id_actividad
    LEFT JOIN public.cat_riesgo_critico rc ON rc.id_riesgo_critico = ac.id_riesgo_critico
"""
DESCRIPCION_SEVERIDAD = {
    "hora": "hora del evento (0-23)", "dia_semana": "día de la semana (1 lunes, 7 domingo)", "mes": "mes",
    "turno": "turno", "dia_ciclo": "día del ciclo de turno", "contratista": "la empresa es contratista",
    "experiencia_anios": "años del trabajador en la empresa al ocurrir el evento", "oficio": "oficio del trabajador",
    "categoria_evento": "tipo de accidente", "riesgo_critico": "riesgo crítico de la actividad",
    "nivel_elevacion": "nivel de elevación",
}


def exportar_severidad(engine, carpeta):
    """Un incidente por fila; el objetivo es si su severidad fue media o mayor."""
    from sqlalchemy import text

    eventos = pd.read_sql(text(SQL_SEVERIDAD), engine, parse_dates=["semana"]).sort_values("semana", ignore_index=True)
    q70, q85 = eventos["semana"].quantile(0.70), eventos["semana"].quantile(0.85)
    mascaras = (eventos["semana"] < q70, (eventos["semana"] >= q70) & (eventos["semana"] < q85), eventos["semana"] >= q85)
    variables = [c for c in DESCRIPCION_SEVERIDAD if c in eventos and eventos.loc[mascaras[0], c].nunique(dropna=True) > 1]
    y = (eventos["nivel_severidad"] >= NIVEL_SEVERO).astype(int)
    resumen = {"objetivo": f"severidad >= {NIVEL_SEVERO}", "nivel": "evento", "columna_objetivo": COLUMNA_SEVERO,
               "variables": len(variables), "tramos": {}}
    for nombre, mascara in zip(TRAMOS, mascaras):
        destino = carpeta / nombre
        destino.mkdir(parents=True, exist_ok=True)
        eventos.loc[mascara, variables].assign(**{COLUMNA_SEVERO: y[mascara]}).to_csv(destino / "datos.csv", index=False)
        (destino / "MLTable").write_text(MLTABLE, encoding="utf-8")
        resumen["tramos"][nombre] = {
            "filas": int(mascara.sum()), "eventos": int(y[mascara].sum()), "tasa": round(float(y[mascara].mean()), 4),
            "desde": str(eventos.loc[mascara, "semana"].min().date()), "hasta": str(eventos.loc[mascara, "semana"].max().date()),
        }
    claves = eventos[["entidad", "semana", "nivel_severidad"]].rename(columns={"entidad": "id_evento", "semana": "fecha"})
    claves["tramo"] = np.select(mascaras, TRAMOS, default="")
    claves.to_csv(carpeta / "claves_no_subir.csv", index=False)
    pd.DataFrame({"columna": variables, "descripcion": [DESCRIPCION_SEVERIDAD[c] for c in variables]}).to_csv(carpeta / "diccionario.csv", index=False)
    (carpeta / "resumen.json").write_text(json.dumps(resumen, indent=2, ensure_ascii=False), encoding="utf-8")
    return resumen


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--db", default=os.getenv("DATABASE_URL"))
    ap.add_argument("--historicos", help="CSV anonimo de data/importar_logs.py")
    ap.add_argument("--salida", required=True)
    ap.add_argument("--semanas", type=int, nargs="+", default=[9, 13])
    ap.add_argument("--nivel", default="proyecto", choices=["proyecto", "area", "cuadrilla", "trabajador", "actividad"])
    ap.add_argument("--severidad", action="store_true", help="un evento por fila, objetivo: severidad media o mayor")
    a = ap.parse_args()
    if a.historicos:
        historicos = pd.read_csv(a.historicos)
        for h in a.semanas:
            X, meta = panel_historico(historicos, h)
            tramos, columnas = armar_tramos(X, meta["y"], meta, h)
            carpeta = Path(a.salida) / NOMBRE_PLAZO.get(h, f"{h}_semanas")
            print(json.dumps(guardar(tramos, columnas, h, carpeta, "incidentes_laborales", "cliente"), ensure_ascii=False))
        return
    if not a.db:
        raise SystemExit("Define DATABASE_URL o usa --db.")
    engine = create_engine(a.db)
    if a.severidad:
        print(json.dumps(exportar_severidad(engine, Path(a.salida)), ensure_ascii=False))
        return
    base = _cargar_base_red(engine)
    for h in a.semanas:
        if a.nivel == "proyecto":
            X, Y, meta = preparar_eventos(base, h)
            if OBJETIVO_INCIDENTES not in Y:
                print(f"{h} semanas: los incidentes no tienen 20 semanas con y sin evento; no se exporta.")
                continue
            y = Y[OBJETIVO_INCIDENTES]
        else:
            niveles = construir_niveles(base, OBJETIVO_INCIDENTES, h)
            if a.nivel not in niveles:
                raise SystemExit(f"No hay datos para el nivel {a.nivel}.")
            spine, eventos, cats, numericas = niveles[a.nivel]
            X, meta = construir_panel(spine, eventos, h, cats, numericas)
            y = meta["y"]
        tramos, columnas = armar_tramos(X, y, meta, h)
        resumen = guardar(tramos, columnas, h, Path(a.salida) / NOMBRE_PLAZO.get(h, f"{h}_semanas"), nivel=a.nivel)
        print(json.dumps(resumen, ensure_ascii=False))


if __name__ == "__main__":
    main()
