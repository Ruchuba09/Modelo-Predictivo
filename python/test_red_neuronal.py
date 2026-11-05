"""Pruebas sin base de datos de la red neuronal. Uso: python -m unittest test_red_neuronal"""
import unittest
import warnings

import numpy as np
import pandas as pd

from red_neuronal import _etiquetas_futuras, dividir_temporal, entrenar_red, predecir_red


def panel(n_entidades=6, semanas=150, semilla=0):
    """Dos salidas: una depende de una interaccion que un modelo lineal no captura; la otra es azar."""
    rng = np.random.default_rng(semilla)
    fechas = pd.date_range("2023-01-02", periods=semanas, freq="7D")
    filas = pd.DataFrame([(e, s) for e in range(n_entidades) for s in fechas], columns=["entidad", "semana"])
    filas["a"] = rng.normal(size=len(filas))
    filas["b"] = rng.normal(size=len(filas))
    prob = np.where(filas["a"] * filas["b"] > 0, 0.85, 0.08)
    Y = pd.DataFrame({"interaccion": (rng.random(len(filas)) < prob).astype(int), "azar": rng.integers(0, 2, len(filas))})
    return filas, Y


class Etiquetas(unittest.TestCase):
    def test_marca_el_evento_dentro_del_horizonte(self):
        fechas = pd.date_range("2026-01-05", periods=5, freq="7D")
        meta = pd.DataFrame({"entidad": 1, "semana": fechas})
        eventos = pd.DataFrame({"entidad": [1], "fecha": [fechas[3] + pd.Timedelta(days=2)]})
        self.assertEqual(_etiquetas_futuras(meta, eventos, 2).tolist(), [0, 0, 1, 1, 0])

    def test_sin_eventos_todo_es_cero(self):
        meta = pd.DataFrame({"entidad": 1, "semana": pd.date_range("2026-01-05", periods=3, freq="7D")})
        vacio = pd.DataFrame(columns=["entidad", "fecha"])
        self.assertEqual(_etiquetas_futuras(meta, vacio, 1).tolist(), [0, 0, 0])


class Division(unittest.TestCase):
    def test_tramos_no_se_solapan_y_respetan_la_brecha(self):
        semanas = pd.Series(pd.date_range("2023-01-02", periods=100, freq="7D"))
        tr, va, te = dividir_temporal(semanas, 4)
        self.assertLess(semanas[tr].max() + pd.Timedelta(weeks=4), semanas[va].min() + pd.Timedelta(weeks=1))
        self.assertLessEqual(semanas[va].max(), semanas[te].min())
        self.assertFalse((tr & te).any() or (va & te).any() or (tr & va).any())


class Entrenamiento(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        filas, Y = panel()
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            cls.ajuste = entrenar_red(filas[["a", "b"]], Y, filas["semana"], pd.Series(True, index=filas.index), 1)
        cls.filas = filas

    def test_aprende_una_interaccion_que_la_logistica_no_capta(self):
        f = self.ajuste["evaluacion"]["interaccion"]
        self.assertGreater(f["red"]["auc_roc"], 0.8)
        self.assertLess(f["logistica"]["auc_roc"], 0.65)
        self.assertTrue(f["supera_referencias"])

    def test_no_inventa_senal_donde_no_la_hay(self):
        self.assertLess(self.ajuste["evaluacion"]["azar"]["red"]["auc_roc"], 0.62)

    def test_predice_una_probabilidad_por_salida(self):
        p = predecir_red(self.ajuste, self.filas[["a", "b"]].head(4))
        self.assertEqual(p.shape, (4, 2))
        self.assertTrue(((p > 0) & (p < 1)).all())

    def test_salida_unica_tambien_funciona(self):
        filas, Y = panel(4, 80)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            ajuste = entrenar_red(filas[["a", "b"]], Y[["interaccion"]], filas["semana"], pd.Series(True, index=filas.index), 1)
        self.assertEqual(predecir_red(ajuste, filas[["a", "b"]].head(3)).shape, (3, 1))

    def test_prevalencia_por_grupo_no_premia_aprender_solo_el_grupo(self):
        # El grupo define la tasa y no hay mas senal: aprender el grupo no cuenta como mejora.
        filas, _ = panel(8, 120)
        rng = np.random.default_rng(1)
        grupos = pd.Series(np.where(filas["entidad"] < 4, "alto", "bajo"), index=filas.index)
        Y = pd.DataFrame({"evento": (rng.random(len(filas)) < np.where(grupos == "alto", 0.6, 0.05)).astype(int)})
        X = filas[["a", "b"]].assign(nivel=grupos)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            ajuste = entrenar_red(X, Y, filas["semana"], pd.Series(True, index=filas.index), 1, categoricas=("nivel",), columna_grupo="nivel")
        self.assertEqual(set(ajuste["por_grupo"]), {"alto", "bajo"})
        self.assertLess(ajuste["evaluacion"]["evento"]["mejora_log_loss_pct"], 5)
        # Predecir un solo nivel no debe fallar por los niveles ausentes en esas filas.
        self.assertEqual(predecir_red(ajuste, X[grupos == "alto"].head(3)).shape, (3, 1))


if __name__ == "__main__":
    unittest.main()
