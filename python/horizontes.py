"""Plazos que ofrece el sistema y su relacion con los modelos, que trabajan por semanas.

Cada plazo usa el modelo semanal mas cercano. La probabilidad se ajusta a los dias exactos suponiendo
una tasa constante dentro del plazo. En 1, 2 y 5 dias es una estimacion: no hay un modelo diario.
"""

import math

SEMANAS_POR_DIAS = {1: 1, 2: 1, 5: 1, 7: 1, 14: 2, 21: 3, 30: 4, 60: 9, 90: 13}
DIAS_PREDETERMINADOS = 30
SEMANAS_ENTRENABLES = sorted(set(SEMANAS_POR_DIAS.values()))

DIAS_POR_SEMANAS = {semanas: dias for dias, semanas in SEMANAS_POR_DIAS.items() if dias >= 7}

CLAVES_PROBABILIDAD = {
    "prob", "prob_evento", "prob_evento_horizonte", "probabilidad_base_proyecto",
    "probabilidad_area", "probabilidad_actividad", "probabilidad_cuadrilla",
}
CLAVES_FACTORES = ("factores", "factores_principales")


def semanas_modelo(dias):
    return SEMANAS_POR_DIAS[dias]


def es_derivado(dias):
    """Los plazos menores a una semana no tienen un modelo propio."""
    return dias < 7


def factor(dias):
    return dias / (7 * semanas_modelo(dias))


def convertir_probabilidad(probabilidad, proporcion):
    """Con tasa constante, 1 - p es la probabilidad de no tener eventos y se eleva a la proporcion."""
    p = min(max(float(probabilidad), 0.0), 0.999999)
    return 1 - (1 - p) ** proporcion


def riesgo_acumulado(probabilidad, proporcion=1.0):
    """Tasa acumulada en el plazo: a diferencia de la probabilidad, se puede sumar entre partes."""
    return -math.log1p(-min(max(float(probabilidad), 0.0), 0.999999)) * proporcion


def probabilidad_de(acumulado, proporcion=1.0):
    return 1 - math.exp(-acumulado / proporcion)


def plazos_coherentes(series, padres=None, topes=None):
    """Ajusta plazos crecientes: el riesgo acumulado nunca baja y las partes no superan a su padre.

    series: lista por plazo de {entidad: riesgo acumulado}. padres: {entidad: padre}.
    topes: lista paralela de {padre: riesgo acumulado ya ajustado}. Devuelve el resultado de cada plazo.
    Cada plazo solo reparte lo que el padre gano respecto del anterior, asi ambas reglas se cumplen a la vez.
    """
    padres = padres or {}
    actual = {}
    historia = []
    for paso, valores in enumerate(series):
        tope_paso = topes[paso] if topes else {}
        aumentos = {e: max(v - actual.get(e, 0.0), 0.0) for e, v in valores.items()}
        grupos = {}
        for entidad in actual.keys() | aumentos.keys():
            grupos.setdefault(padres.get(entidad), []).append(entidad)
        for padre, entidades in grupos.items():
            if padre is not None and padre in tope_paso:
                margen = max(tope_paso[padre] - sum(actual.get(e, 0.0) for e in entidades), 0.0)
                total = sum(aumentos.get(e, 0.0) for e in entidades)
                if total > margen:
                    escala = margen / total if total else 0.0
                    for e in entidades:
                        if e in aumentos:
                            aumentos[e] *= escala
        for entidad, aumento in aumentos.items():
            actual[entidad] = actual.get(entidad, 0.0) + aumento
        historia.append(dict(actual))
    return historia


def _convertir_factores(lista, probabilidad, proporcion):
    salida = []
    for elemento in lista:
        if isinstance(elemento, dict) and elemento.get("efecto") is not None:
            sin_efecto = probabilidad - elemento["efecto"]
            efecto = convertir_probabilidad(probabilidad, proporcion) - convertir_probabilidad(sin_efecto, proporcion)
            elemento = {**elemento, "efecto": round(efecto, 6)}
        salida.append(elemento)
    return salida


def _convertir(datos, proporcion):
    if isinstance(datos, list):
        return [_convertir(elemento, proporcion) for elemento in datos]
    if not isinstance(datos, dict):
        return datos
    salida = {}
    base = next((datos[c] for c in ("prob_evento", "prob") if isinstance(datos.get(c), (int, float))), None)
    for clave, valor in datos.items():
        if clave in CLAVES_PROBABILIDAD and isinstance(valor, (int, float)) and not isinstance(valor, bool):
            salida[clave] = round(convertir_probabilidad(valor, proporcion), 6)
        elif clave == "probabilidades_individuales_combinadas" and isinstance(valor, list):
            salida[clave] = [round(convertir_probabilidad(p, proporcion), 6) for p in valor]
        elif clave == "suma_probabilidades_individuales" and isinstance(valor, (int, float)):
            salida[clave] = round(float(valor) * proporcion, 6)
        elif clave in CLAVES_FACTORES and isinstance(valor, list) and base is not None:
            salida[clave] = _convertir_factores(valor, base, proporcion)
        else:
            salida[clave] = _convertir(valor, proporcion)
    return salida


def convertir_respuesta(datos, dias):
    """Lleva las probabilidades al plazo pedido; las metricas y tasas semanales no cambian."""
    proporcion = factor(dias)
    salida = datos if proporcion == 1 else _convertir(datos, proporcion)
    return {**salida, "horizonte_dias": dias, "semanas_modelo": semanas_modelo(dias), "horizonte_derivado": es_derivado(dias)}
