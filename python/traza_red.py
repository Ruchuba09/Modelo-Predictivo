"""Registra como cambia la red en cada epoca para poder dibujarla durante el entrenamiento.

Cada foto guarda una muestra fija de neuronas, para que el dibujo sea comparable entre epocas,
y calcula las normas, los cambios y los histogramas con todos los pesos de la red.
"""
from datetime import datetime, timezone

import numpy as np

from motor_riesgo import etiqueta

MAX_ENTRADAS = 14
MAX_NEURONAS = 12
MAX_SALIDAS = 12
MAX_FOTOS = 2500
LIMITE_HISTOGRAMA = 1.0
BORDES_HISTOGRAMA = np.linspace(-LIMITE_HISTOGRAMA, LIMITE_HISTOGRAMA, 41)


def nombre_entrada(variable):
    """Convierte el nombre del preprocesador en una etiqueta legible."""
    variable = variable.split("__", 1)[-1]
    if variable.startswith("nivel_"):
        return f"Nivel: {variable.removeprefix('nivel_')}"
    if variable.startswith("categoria_"):
        return f"Categoría: {variable.removeprefix('categoria_')}"
    if variable == "entidad_semanas_activa":
        return "Semanas activa de la entidad"
    if variable == "entidad_tamano":
        return "Tamaño de la entidad"
    return etiqueta(variable.removeprefix("proyecto_"))


def elegir_entradas(Z, Y, maximo=MAX_ENTRADAS):
    """Entradas mas relacionadas con las salidas; quedan fijas durante todo el entrenamiento."""
    objetivo = Y.mean(axis=1)
    centrado_y = objetivo - objetivo.mean()
    centrado_z = Z - Z.mean(axis=0)
    divisor = np.sqrt((centrado_z ** 2).sum(axis=0) * (centrado_y ** 2).sum())
    correlacion = np.abs(centrado_z.T @ centrado_y) / np.where(divisor == 0, np.inf, divisor)
    return np.sort(np.argsort(-correlacion)[:maximo])


def propagar(red, x):
    """Paso hacia adelante de una fila: devuelve la activacion completa de cada capa."""
    activaciones = [x]
    for i, (pesos, sesgos) in enumerate(zip(red.coefs_, red.intercepts_)):
        salida = activaciones[-1] @ pesos + sesgos
        ultima = i == len(red.coefs_) - 1
        activaciones.append(1 / (1 + np.exp(-np.clip(salida, -30, 30))) if ultima else np.maximum(salida, 0))
    return activaciones


class Traza:
    def __init__(self, horizonte):
        self.horizonte = horizonte
        self.id = datetime.now(timezone.utc).isoformat(timespec="seconds")
        self.redes = {}
        self.fotos = []
        self.truncada = False
        self._muestras = {}
        self._anterior = None

    def iniciar_red(self, nombre, nombres_entradas, salidas, Ztr, Ytr, muestra):
        indices = elegir_entradas(Ztr, Ytr)
        self.redes[nombre] = {
            "entradas": [nombre_entrada(nombres_entradas[i]) for i in indices],
            "salidas": list(salidas)[:MAX_SALIDAS],
            "total_entradas": len(nombres_entradas),
            "ganadora": None,
        }
        self._muestras[nombre] = (indices, muestra)

    def elegir_ganadora(self, nombre, indice):
        self.redes[nombre]["ganadora"] = indice

    def registrar(self, nombre, red, etapa, indice_configuracion, configuracion, semilla, epoca, perdida_entrenamiento, perdida_validacion, es_mejor):
        if len(self.fotos) >= MAX_FOTOS:
            self.truncada = True
            return
        indices, muestra = self._muestras[nombre]
        pesos = red.coefs_
        activaciones = propagar(red, muestra)

        # Muestra dibujada: las entradas elegidas y las primeras neuronas de cada capa oculta.
        visibles = [indices] + [np.arange(min(MAX_NEURONAS, c.shape[1])) for c in pesos[:-1]] + [np.arange(min(MAX_SALIDAS, pesos[-1].shape[1]))]
        matrices = [np.round(c[np.ix_(visibles[i], visibles[i + 1])], 3).tolist() for i, c in enumerate(pesos)]

        cambios = None
        if self._anterior is not None and epoca > 1:
            cambios = [round(float(np.abs(a - b).mean()), 5) for a, b in zip(pesos, self._anterior)]
        self._anterior = [c.copy() for c in pesos]

        self.fotos.append({
            "red": nombre,
            "etapa": etapa,
            "configuracion_indice": indice_configuracion,
            "configuracion": {"capas": list(configuracion["capas"]), "alpha": configuracion["alpha"], "lr": configuracion["lr"]},
            "semilla": semilla,
            "epoca": epoca,
            "actualizaciones": int(np.ceil(red.t_ / red.batch_size)),
            "perdida_entrenamiento": round(float(perdida_entrenamiento), 5),
            "perdida_validacion": round(float(perdida_validacion), 5),
            "es_mejor": bool(es_mejor),
            "arquitectura": [pesos[0].shape[0], *[c.shape[1] for c in pesos]],
            "pesos": matrices,
            "activaciones": [np.round(a[v], 3).tolist() for a, v in zip(activaciones, visibles)],
            "magnitud": [round(float(np.abs(c).mean()), 5) for c in pesos],
            "cambio": cambios,
            "histogramas": [np.histogram(np.clip(c, -LIMITE_HISTOGRAMA, LIMITE_HISTOGRAMA), bins=BORDES_HISTOGRAMA)[0].tolist() for c in pesos],
        })

    def pagina(self, desde=0, limite=200):
        return {
            "id": self.id, "horizonte": self.horizonte, "total": len(self.fotos), "truncada": self.truncada,
            "redes": self.redes, "bordes_histograma": BORDES_HISTOGRAMA.round(2).tolist(),
            "fotos": self.fotos[desde:desde + limite],
        }

    def para_guardar(self):
        """Quita lo que solo sirve mientras se entrena."""
        self._muestras = {}
        self._anterior = None
        return self
