"""Normaliza los logs de incidentes de AVA (Excel) a un formato comun y anonimo.

No conserva RUT, nombres ni texto libre: la descripcion solo se usa para extraer
etiquetas de riesgo. Los Excel originales no deben versionarse.

Uso:
  python importar_logs.py archivo1.xlsx archivo2.xlsx --salida historicos.csv
  python importar_logs.py archivo1.xlsx --db postgresql+psycopg2://usuario:clave@host/base
"""
import argparse
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

import pandas as pd
from openpyxl import load_workbook

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from riesgos_texto import etiquetas_riesgo, normalizar  # noqa: E402

CATEGORIAS = [
    (r"\bFATAL\b", "fatal"),
    (r"\bCTP\b", "lesion_ctp"),
    (r"\bSTP\b|\bNAT\b", "lesion_stp"),
    (r"\bEP\b|ENFERMEDAD PROFESIONAL", "enfermedad_profesional"),
    (r"TRAYECTO", "trayecto"),
    (r"\bAT\b", "accidente_at"),
    (r"\bDAS\b|\bDANS\b|AMBIENTAL", "dano_ambiental"),
    (r"\bDMS\b|\bDMNS\b|DANO MATERIAL|VEHICULAR", "dano_material"),
    (r"\bFO\b|OPERACIONAL", "falla_operacional"),
    (r"CUASI|ALTO POTENCIAL", "cuasi_accidente"),
    (r"COMUN", "comun"),
]
# Ocurren fuera de la exposicion laboral en terreno: no se predicen con datos de la obra.
CATEGORIAS_LABORALES = {
    "fatal", "lesion_ctp", "lesion_stp", "enfermedad_profesional", "accidente_at",
    "dano_ambiental", "dano_material", "falla_operacional", "cuasi_accidente",
}
CATEGORIAS_LESION = {"fatal", "lesion_ctp", "lesion_stp", "enfermedad_profesional", "accidente_at"}

CLIENTES = [
    (r"CMDIC|COLLAHUASI", "COLLAHUASI"),
    (r"SPENCE", "SPENCE"),
    (r"ESCONDIDA|\bMEL\b|LA NEGRA|NITRO", "ESCONDIDA"),
    (r"CENTINELA|NCEN", "CENTINELA"),
    (r"TALABRE|CODELCO|\bDCH\b|SALVADOR", "CODELCO"),
    (r"SIERRA GORDA|\bSG\b|SG-1", "SIERRA GORDA"),
    (r"MANTOS BLANCOS", "MANTOS BLANCOS"),
    (r"MANTO VERDE", "MANTO VERDE"),
    (r"NODO|OFICINA|\bAVA\b", "AVA"),
    (r"LITIO|SQM", "SQM"),
    (r"AMSA", "AMSA"),
]

def clasificar(valor, reglas, defecto):
    texto = normalizar(valor)
    for patron, categoria in reglas:
        if re.search(patron, texto):
            return categoria
    return defecto


def a_fecha(valor):
    if isinstance(valor, datetime):
        return valor.date()
    if isinstance(valor, date):
        return valor
    if isinstance(valor, (int, float)) and 30000 < valor < 60000:
        return date(1899, 12, 30) + timedelta(days=int(valor))
    return None


def a_hora(valor):
    """Devuelve la hora (0-23) desde una fraccion de dia, un time o texto como 11.20."""
    if valor is None:
        return None
    if hasattr(valor, "hour"):
        return valor.hour
    if isinstance(valor, (int, float)):
        if 0 <= valor < 1:
            return int(valor * 24)
        return int(valor) if valor < 24 else None
    coincide = re.match(r"\s*(\d{1,2})[:.]\d{1,2}", str(valor))
    return int(coincide.group(1)) if coincide and int(coincide.group(1)) < 24 else None


def _buscar_columnas(encabezado):
    """Ubica cada dato por el nombre de su columna, que cambia entre versiones del log."""
    columnas = {}
    patrones = {
        "n": r"^N.?$", "fecha": r"^FECHA( INCIDENTE| DEL INCIDENTE)?|^FECHA$", "dia": r"^DIA$", "mes": r"^MES$",
        "anio": r"^ANO$", "hora": r"^HORA", "turno": r"^TURNO$", "sistema": r"^TIPO DE TURNO",
        "contrato": r"^CONTRATO|^PROYECTO", "cliente": r"^CLIENTE|^OBRA", "lugar": r"^LUGAR",
        "clasificacion": r"^CLASIFICACION", "dia_turno": r"^DIA DE TURNO", "descripcion": r"^DESCRIPCION",
        "especialidad": r"^ESPECIALIDAD", "parte_cuerpo": r"^PARTE DEL CUERPO", "dias_perdidos": r"^DIAS PERDIDOS",
        "fecha_cierre": r"^FECHAS? DE CIERRE",
    }
    for indice, celda in enumerate(encabezado):
        if celda is None:
            continue
        nombre = normalizar(celda)
        for clave, patron in patrones.items():
            if clave not in columnas and re.search(patron, nombre):
                columnas[clave] = indice
    if "mes" in columnas and "anio" not in columnas and encabezado[columnas["mes"] + 1] is None:
        columnas["anio"] = columnas["mes"] + 1
    return columnas


def _fecha_incidente(dato):
    """Dia, mes y ano tienen prioridad: en ese formato, FECHA corresponde a una accion."""
    try:
        return date(int(dato("anio")), int(dato("mes")), int(dato("dia")))
    except (TypeError, ValueError):
        return a_fecha(dato("fecha"))


def leer_log(ruta):
    """Devuelve una fila anonima por incidente de la primera hoja del log."""
    libro = load_workbook(ruta, read_only=True, data_only=True)
    hoja = libro.worksheets[0]
    filas = hoja.iter_rows(values_only=True)
    columnas = None
    registros = []
    for fila in filas:
        if columnas is None:
            if fila and fila[0] is not None and re.match(r"^N.?$", normalizar(fila[0])):
                columnas = _buscar_columnas(fila)
            continue
        dato = lambda clave: fila[columnas[clave]] if clave in columnas and columnas[clave] < len(fila) else None
        if not isinstance(dato("n"), (int, float)):
            continue
        fecha = _fecha_incidente(dato)
        if fecha is None:
            continue
        hora = a_hora(dato("hora"))
        turno = normalizar(dato("turno") or "")
        categoria = clasificar(dato("clasificacion"), CATEGORIAS, "otro")
        dias = dato("dias_perdidos")
        dia_turno = dato("dia_turno")
        registros.append({
            "fecha": fecha,
            "hora": hora,
            "turno": "noche" if turno.startswith("NOCHE") else "dia" if turno.startswith("DIA") else None,
            "sistema_turno": normalizar(dato("sistema")).lower() if dato("sistema") else None,
            "dia_ciclo": int(dia_turno) if isinstance(dia_turno, (int, float)) and 0 < dia_turno <= 30 else None,
            "cliente": clasificar(f"{dato('cliente') or ''} {dato('contrato') or ''}", CLIENTES, "OTRO"),
            "contrato": normalizar(dato("contrato"))[:120] if dato("contrato") else None,
            "lugar": normalizar(dato("lugar"))[:120] if dato("lugar") else None,
            "clasificacion_original": normalizar(dato("clasificacion"))[:60],
            "categoria": categoria,
            "laboral": categoria in CATEGORIAS_LABORALES,
            "con_lesion": categoria in CATEGORIAS_LESION,
            "especialidad": normalizar(dato("especialidad"))[:60] if dato("especialidad") else None,
            "parte_cuerpo": normalizar(dato("parte_cuerpo"))[:60] if dato("parte_cuerpo") not in (None, "NA") else None,
            "dias_perdidos": int(dias) if isinstance(dias, (int, float)) else None,
            "riesgos": ",".join(etiquetas_riesgo(dato("descripcion"))),
        })
    libro.close()
    return pd.DataFrame(registros)


def combinar(rutas):
    """Une los logs; si un incidente aparece en dos archivos, conserva una sola fila."""
    logs = pd.concat([leer_log(ruta) for ruta in rutas], ignore_index=True)
    return logs.drop_duplicates(["fecha", "hora", "cliente", "categoria", "lugar"]).sort_values("fecha", ignore_index=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("archivos", nargs="+")
    ap.add_argument("--salida", help="CSV anonimo de salida")
    ap.add_argument("--db", help="URL de SQLAlchemy; reemplaza public.incidentes_historicos")
    a = ap.parse_args()
    if not a.salida and not a.db:
        raise SystemExit("Indica --salida o --db.")
    historicos = combinar(a.archivos)
    print(f"{len(historicos)} incidentes entre {historicos['fecha'].min()} y {historicos['fecha'].max()}")
    if a.salida:
        historicos.to_csv(a.salida, index=False)
    if a.db:
        from sqlalchemy import create_engine

        engine = create_engine(a.db)
        with engine.begin() as conexion:
            historicos.to_sql("incidentes_historicos", conexion, schema="public", if_exists="replace", index=False)
        print("Cargados en public.incidentes_historicos")


if __name__ == "__main__":
    main()
