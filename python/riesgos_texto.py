"""Extrae etiquetas de riesgo de texto libre, sin conservar el texto ni datos personales."""
import re
import unicodedata

RIESGOS = {
    "altura": r"ALTURA|ANDAMIO|ARNES|DISTINTO NIVEL",
    "izaje": r"IZAJE|GRUA|ESLINGA|RIGGER|MANIOBRA DE CARGA",
    "vehiculo": r"CAMION|VEHICUL|RAMPLA|\bBUS\b|RETROCESO|COLISION|CHOQUE",
    "maquinaria": r"EXCAVADORA|MAQUINARIA|BULLDOZER|MOTONIVELADORA|HORQUILLA|MANIPULADOR",
    "electrico": r"ELECTRIC|ENERGIZ|TENSION|TRANSFORMADOR|BLOQUEO",
    "confinado": r"CONFINADO",
    "derrame": r"DERRAME|HIDROCARBURO|ACEITE",
    "golpe": r"GOLPE|ATRICCION|ATRICION|ATRAPAMIENTO|CORTE\b|CONTUSION",
    "caida_mismo_nivel": r"RESBAL|TROPIEZ|TORCEDURA|CAIDA",
    "herramientas": r"HERRAMIENTA|ESMERIL|TALADRO|PRENSA",
    "fatiga": r"FATIGA|CANSANCIO|SOMNOLENCIA",
}


def normalizar(texto):
    sin_tildes = unicodedata.normalize("NFKD", str(texto)).encode("ascii", "ignore").decode()
    return " ".join(sin_tildes.upper().split())


def etiquetas_riesgo(texto):
    limpio = normalizar(texto or "")
    return sorted(nombre for nombre, patron in RIESGOS.items() if re.search(patron, limpio))
