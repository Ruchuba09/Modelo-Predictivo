"""Plazos que ofrece el sistema.

Los modelos predicen una tasa semanal, asi que cualquier plazo sale de la misma prediccion:
P(al menos un evento en d dias) = 1 - exp(-tasa * d / 7). Un plazo mas largo nunca da menos riesgo.
Los plazos menores a una semana suponen que la tasa se reparte por igual entre los dias de la semana.
"""

DIAS_DISPONIBLES = (1, 2, 5, 7, 14, 21, 30, 60, 90)
DIAS_PREDETERMINADOS = 30


def semanas(dias):
    return dias / 7


def es_derivado(dias):
    """Menos de una semana: se reparte la tasa semanal entre los dias."""
    return dias < 7


def metadatos(dias):
    return {"horizonte_dias": dias, "horizonte_semanas": round(semanas(dias), 2), "semanas_modelo": 1,
            "horizonte_derivado": es_derivado(dias)}
