"""Extrae los datos estructurados de los informes de investigacion de AVA (FG-08-02 y FG-08-12).

Cada informe describe un incidente. Solo conserva campos sin datos personales: fecha, hora, turno,
cliente, tipo, gravedad, criticidad y codigos de causa. No guarda nombres, RUT, edades, relatos
ni texto libre; los textos solo se usan para extraer etiquetas de riesgo.

Uso: python importar_investigaciones.py informe1.xlsx informe2.xlsx --salida investigaciones.csv
"""
import argparse
import re
import sys
from pathlib import Path

import pandas as pd
from openpyxl import load_workbook

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from riesgos_texto import etiquetas_riesgo, normalizar  # noqa: E402
from importar_logs import CLIENTES, a_fecha, a_hora, clasificar  # noqa: E402

COLUMNAS_INVESTIGACION = ["sistema_turno", "criticidad", "potencial_probabilidad", "potencial_consecuencia",
                          "causas_inmediatas", "causas_basicas"]
ETIQUETAS = {
    "fecha": r"^FECHA (DEL )?(INCIDENTE|ACCIDENTE|EVENTO)|^FECHA DE OCURRENCIA",
    "hora": r"^HORA (DEL )?(INCIDENTE|ACCIDENTE|EVENTO)|^HORA DE OCURRENCIA",
    "turno": r"^TURNO$|^SISTEMA DE TURNO|^JORNADA",
    "lugar": r"^LUGAR",
    "criticidad": r"^NIVEL DE CRITICIDAD",
    "probabilidad": r"^POTENCIAL DE PROBABILIDAD",
    "consecuencia": r"^POTENCIAL DE CO",
}
# Codigos como "05- Mal manejo de materiales": se guarda el numero, no el texto.
CODIGO_CAUSA = re.compile(r"^\s*(\d{1,2})\s*[-.]")


def _celdas(ruta):
    hoja = load_workbook(ruta, read_only=True, data_only=True).worksheets[0]
    return [list(fila) for fila in hoja.iter_rows(values_only=True)]


def _valor_a_la_derecha(fila, columna):
    for valor in fila[columna + 1:]:
        if valor not in (None, ""):
            return valor
    return None


def _valor_debajo(filas, r, c):
    for fila in filas[r + 1:r + 3]:
        if c < len(fila) and fila[c] not in (None, ""):
            return fila[c]
    return None


def leer_informe(ruta):
    filas = _celdas(ruta)
    campos, texto = {}, []
    causas = {"inmediatas": set(), "basicas": set()}
    seccion_causas = None
    for r, fila in enumerate(filas):
        for c, valor in enumerate(fila):
            if not isinstance(valor, str):
                continue
            etiqueta = normalizar(valor).rstrip(" :")
            texto.append(valor)
            for clave, patron in ETIQUETAS.items():
                if clave not in campos and re.search(patron, etiqueta):
                    dato = _valor_a_la_derecha(fila, c)
                    campos[clave] = dato if dato is not None else _valor_debajo(filas, r, c)
            if etiqueta.startswith("CAUSAS INMEDIATAS"):
                seccion_causas = ("inmediatas", r)
            elif etiqueta.startswith("CAUSAS BASICAS"):
                seccion_causas = ("basicas", r) if seccion_causas is None else seccion_causas
            codigo = CODIGO_CAUSA.match(valor)
            if codigo and seccion_causas and 0 < r - seccion_causas[1] < 8:
                # En el formato FG-08-02 las basicas van desde la columna 4.
                causas["basicas" if c >= 4 else "inmediatas"].add(int(codigo.group(1)))
    # El tipo y la gravedad se marcan con formato sobre una lista de opciones: el texto no dice
    # cual aplica, asi que la clasificacion se toma del log al enlazar el caso.
    contexto = " ".join(str(v) for v in texto[:80])
    return {
        "fecha": a_fecha(campos.get("fecha")),
        "hora": a_hora(campos.get("hora")),
        "sistema_turno": normalizar(campos["turno"]).lower()[:20] if campos.get("turno") else None,
        "cliente": clasificar(contexto, CLIENTES, "OTRO"),
        "criticidad": normalizar(campos["criticidad"]).lower()[:10] if isinstance(campos.get("criticidad"), str) else None,
        "potencial_probabilidad": campos.get("probabilidad") if isinstance(campos.get("probabilidad"), (int, float)) else None,
        "potencial_consecuencia": campos.get("consecuencia") if isinstance(campos.get("consecuencia"), (int, float)) else None,
        "causas_inmediatas": ",".join(map(str, sorted(causas["inmediatas"]))),
        "causas_basicas": ",".join(map(str, sorted(causas["basicas"]))),
        "riesgos": ",".join(etiquetas_riesgo(" ".join(map(str, texto)))),
    }


def enlazar(historicos, informes):
    """Agrega a cada caso del log los datos de su informe: mismo dia y, si se conoce, mismo cliente.

    Devuelve los casos enriquecidos y los informes sin caso en el log. Estos no se agregan como
    casos: sin la clasificacion del log no se sabe si son incidentes laborales.
    """
    casos = historicos.copy()
    casos["fecha"] = pd.to_datetime(casos["fecha"])
    for columna in COLUMNAS_INVESTIGACION:
        if columna not in casos:
            casos[columna] = None
    casos["investigado"] = False
    sueltos = []
    for _, informe in informes.dropna(subset=["fecha"]).iterrows():
        mismo_dia = casos["fecha"] == pd.Timestamp(informe["fecha"])
        con_cliente = mismo_dia & casos["cliente"].eq(informe["cliente"])
        candidatos = casos.index[con_cliente if con_cliente.any() else mismo_dia]
        if len(candidatos) == 0:
            sueltos.append(informe)
            continue
        # Si hay varios el mismo dia, el de hora mas cercana.
        horas = (casos.loc[candidatos, "hora"] - informe["hora"]).abs().fillna(99)
        fila = horas.idxmin()
        for columna in COLUMNAS_INVESTIGACION:
            if pd.notna(informe.get(columna)) and informe.get(columna) != "":
                casos.at[fila, columna] = informe[columna]
        casos.at[fila, "investigado"] = True
    return casos, pd.DataFrame(sueltos)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("archivos", nargs="+")
    ap.add_argument("--salida", required=True)
    ap.add_argument("--historicos", help="CSV de importar_logs.py para enlazar cada informe con su caso")
    a = ap.parse_args()
    informes = pd.DataFrame([leer_informe(ruta) for ruta in a.archivos])
    print(informes.drop(columns=["riesgos"]).to_string())
    if not a.historicos:
        informes.to_csv(a.salida, index=False)
        return
    casos, sueltos = enlazar(pd.read_csv(a.historicos), informes)
    casos.to_csv(a.salida, index=False)
    print(f"{int(casos['investigado'].sum())} informes enlazados con su caso; {len(sueltos)} sin caso en el log;",
          f"{len(informes) - informes['fecha'].notna().sum()} sin fecha de incidente.")


if __name__ == "__main__":
    main()
