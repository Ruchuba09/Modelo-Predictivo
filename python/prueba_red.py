"""Pruebas de acierto de la red con semanas que no uso para aprender.

El umbral para decir "habra evento" se elige con validacion, nunca con las semanas de prueba, y la
incertidumbre se estima remuestreando semanas completas porque las filas de una misma semana se parecen.
"""
import numpy as np
from sklearn.metrics import brier_score_loss, log_loss, roc_auc_score

REMUESTREOS = 300
MIN_POSITIVOS = 30
UMBRALES = np.arange(1, 100) / 100


def _perdida(y, p):
    return float(log_loss(y, np.clip(p, 1e-6, 1 - 1e-6), labels=[0, 1]))


def _auc(y, p):
    return float(roc_auc_score(y, p)) if len(np.unique(y)) == 2 else None


def curva_umbrales(y, p):
    """Aciertos y errores para cada umbral entre 1 % y 99 %."""
    y = y.astype(bool)
    predice = p[None, :] >= UMBRALES[:, None]
    vp = (predice & y).sum(axis=1)
    fp = (predice & ~y).sum(axis=1)
    return [
        {"umbral": round(float(u), 2), "vp": int(a), "fp": int(b), "fn": int(y.sum() - a), "vn": int((~y).sum() - b)}
        for u, a, b in zip(UMBRALES, vp, fp)
    ]


def elegir_umbral(y, p, criterio="f1"):
    """Mejor umbral en validacion. F1 prioriza anticipar eventos; exactitud, acertar mas filas.

    Sin eventos en ese tramo se usa 50 %.
    """
    if len(np.unique(y)) < 2:
        return 0.5
    mejor, mejor_valor = 0.5, -1.0
    for fila in curva_umbrales(y, p):
        if criterio == "exactitud":
            valor = (fila["vp"] + fila["vn"]) / len(y)
        else:
            divisor = 2 * fila["vp"] + fila["fp"] + fila["fn"]
            valor = 2 * fila["vp"] / divisor if divisor else 0.0
        if valor > mejor_valor:
            mejor, mejor_valor = fila["umbral"], valor
    return mejor


def metricas_umbral(y, p, umbral):
    y = y.astype(bool)
    predice = p >= umbral
    vp, fp = int((predice & y).sum()), int((predice & ~y).sum())
    fn, vn = int((~predice & y).sum()), int((~predice & ~y).sum())
    razon = lambda a, b: round(a / b, 4) if b else None
    return {
        "umbral": umbral, "vp": vp, "fp": fp, "fn": fn, "vn": vn,
        "exactitud": razon(vp + vn, len(y)), "precision": razon(vp, vp + fp),
        "sensibilidad": razon(vp, vp + fn), "especificidad": razon(vn, vn + fp),
        "exactitud_mayoria": razon(max(int(y.sum()), int((~y).sum())), len(y)),
    }


def calibracion(y, p, grupos=10):
    """Riesgo predicho contra tasa real, en grupos de igual tamano ordenados por riesgo."""
    orden = np.argsort(p, kind="stable")
    salida = []
    for parte in np.array_split(orden, min(grupos, max(len(p), 1))):
        if len(parte):
            salida.append({"predicho": round(float(p[parte].mean()), 4), "real": round(float(y[parte].mean()), 4), "filas": len(parte)})
    error = sum(abs(g["predicho"] - g["real"]) * g["filas"] for g in salida) / max(len(p), 1)
    return salida, round(float(error), 4)


def _indices_semana(semanas):
    return [np.flatnonzero(semanas == s) for s in np.unique(semanas)]


def intervalos(y, p, referencias, semanas, semilla=0):
    """Intervalos al 95 % del AUC y de la ventaja en log-loss, remuestreando semanas."""
    rng = np.random.default_rng(semilla)
    bloques = _indices_semana(semanas)
    aucs, ventajas = [], {nombre: [] for nombre in referencias}
    for _ in range(REMUESTREOS):
        indice = np.concatenate([bloques[i] for i in rng.integers(0, len(bloques), len(bloques))])
        valor = _auc(y[indice], p[indice])
        if valor is not None:
            aucs.append(valor)
        perdida = _perdida(y[indice], p[indice])
        for nombre, referencia in referencias.items():
            ventajas[nombre].append(_perdida(y[indice], referencia[indice]) - perdida)
    rango = lambda valores: [round(float(v), 4) for v in np.percentile(valores, [2.5, 97.5])] if valores else None
    return rango(aucs), {nombre: rango(valores) for nombre, valores in ventajas.items()}


def _prueba(clave, nombre, descripcion, criterio, valor, paso):
    return {"clave": clave, "nombre": nombre, "descripcion": descripcion, "criterio": criterio, "valor": valor, "aprobada": bool(paso)}


def evaluar_salida(y, p, p_logistica, p_prevalencia, semanas, y_val, p_val):
    y = np.asarray(y).astype(int)
    tasa = float(y.mean())
    referencias = {"tasa_historica": p_prevalencia}
    tiene_logistica = not np.isnan(p_logistica).any()
    if tiene_logistica:
        referencias["logistica"] = p_logistica
    auc = _auc(y, p)
    ic_auc, ic_ventajas = intervalos(y, p, referencias, semanas)
    perdida = _perdida(y, p)
    perdida_previa = _perdida(y, p_prevalencia)
    grupos, error_calibracion = calibracion(y, p)
    y_val = np.asarray(y_val).astype(int)
    avisos = metricas_umbral(y, p, elegir_umbral(y_val, p_val))
    acierto = metricas_umbral(y, p, elegir_umbral(y_val, p_val, "exactitud"))

    corte = max(int(np.ceil(len(p) * 0.1)), 1)
    decil = np.argsort(-p, kind="stable")[:corte]
    tasa_decil = float(y[decil].mean())
    elevacion = tasa_decil / tasa if tasa else None

    ordenadas = np.unique(semanas)
    mitad = semanas <= ordenadas[len(ordenadas) // 2 - 1] if len(ordenadas) > 1 else np.ones(len(y), bool)
    auc_inicio, auc_final = _auc(y[mitad], p[mitad]), _auc(y[~mitad], p[~mitad]) if (~mitad).any() else None
    limite_calibracion = max(0.01, min(0.05, 0.25 * tasa))

    pruebas = [
        _prueba("azar", "Ordena el riesgo mejor que el azar", "Da más riesgo a las filas donde sí hubo evento, incluso considerando la incertidumbre.",
                "Límite inferior del AUC al 95 % sobre 0,5", {"auc": auc, "intervalo": ic_auc}, ic_auc is not None and ic_auc[0] > 0.5),
        _prueba("tasa", "Supera a la tasa histórica", "Sus probabilidades son mejores que usar siempre la tasa histórica.",
                "Log-loss menor a la de la tasa histórica", {"red": round(perdida, 4), "referencia": round(perdida_previa, 4), "intervalo_ventaja": ic_ventajas["tasa_historica"]}, perdida < perdida_previa),
    ]
    if tiene_logistica:
        perdida_logistica = _perdida(y, p_logistica)
        pruebas.append(_prueba("logistica", "Supera a la regresión logística", "Justifica usar una red en vez de un modelo lineal más simple.",
                               "Log-loss menor a la de la regresión logística", {"red": round(perdida, 4), "referencia": round(perdida_logistica, 4), "intervalo_ventaja": ic_ventajas["logistica"]}, perdida < perdida_logistica))
    pruebas += [
        _prueba("calibracion", "Probabilidades bien calibradas", "Un 30 % predicho se parece a un 30 % real.",
                f"Error medio de calibración de hasta {limite_calibracion * 100:.1f} puntos", {"error": error_calibracion, "limite": round(limite_calibracion, 4)}, error_calibracion <= limite_calibracion),
        _prueba("mayoria", "Acierta más que responder siempre lo mismo", "Compara con decir siempre el resultado más común, usando el umbral de mayor exactitud en validación.",
                "Exactitud mayor a la de la clase mayoritaria", {"exactitud": acierto["exactitud"], "referencia": acierto["exactitud_mayoria"]}, (acierto["exactitud"] or 0) > (acierto["exactitud_mayoria"] or 0)),
        _prueba("prioriza", "Sirve para priorizar", "El 10 % con más riesgo concentra más eventos que el promedio.",
                "Tasa real del 10 % más riesgoso al menos 1,5 veces la general", {"tasa_grupo": round(tasa_decil, 4), "tasa_general": round(tasa, 4), "veces": None if elevacion is None else round(elevacion, 2)}, elevacion is not None and elevacion >= 1.5),
        _prueba("estable", "Se mantiene en el tiempo", "Ordena bien tanto en la primera como en la segunda mitad del periodo de prueba.",
                "AUC sobre 0,55 en ambas mitades", {"auc_inicio": None if auc_inicio is None else round(auc_inicio, 4), "auc_final": None if auc_final is None else round(auc_final, 4)},
                auc_inicio is not None and auc_final is not None and auc_inicio > 0.55 and auc_final > 0.55),
    ]
    return {
        "filas": len(y), "positivos": int(y.sum()), "semanas": len(ordenadas), "tasa_real": round(tasa, 4), "riesgo_predicho": round(float(p.mean()), 4),
        "evidencia_suficiente": int(y.sum()) >= MIN_POSITIVOS and int((1 - y).sum()) >= MIN_POSITIVOS,
        "auc": None if auc is None else round(auc, 4), "auc_intervalo": ic_auc, "log_loss": round(perdida, 4), "brier": round(float(brier_score_loss(y, np.clip(p, 0, 1))), 4),
        "umbral_validacion": avisos, "umbral_exactitud": acierto, "curva": curva_umbrales(y, p), "calibracion": grupos, "error_calibracion": error_calibracion,
        "pruebas": pruebas, "aprobadas": sum(1 for prueba in pruebas if prueba["aprobada"]), "total_pruebas": len(pruebas),
    }


def ejemplos(y, p, semanas, entidades, nombre_de, cantidad=10):
    """Los casos de mayor riesgo y los eventos que la red menos anticipo."""
    fila = lambda i: {"entidad": nombre_de(int(entidades[i])), "semana": str(np.datetime_as_string(semanas[i], unit="D")), "prob": round(float(p[i]), 4), "ocurrio": bool(y[i])}
    mayor = np.argsort(-p, kind="stable")[:cantidad]
    eventos = np.flatnonzero(np.asarray(y) == 1)
    sorpresas = eventos[np.argsort(p[eventos], kind="stable")][:cantidad // 2]
    return {"mayor_riesgo": [fila(i) for i in mayor], "sorpresas": [fila(i) for i in sorpresas]}
