"""Pruebas sin base de datos del motor. Uso: python -m unittest test_motor_riesgo"""
import unittest
from unittest.mock import patch

import numpy as np
import pandas as pd

from threadpoolctl import threadpool_limits

from motor_riesgo import construir_panel, predecir, seleccionar_modelo


HOY = pd.Timestamp("2026-06-03")


def spine(n_entidades=8, semanas=150):
    fechas = pd.date_range(end=pd.Timestamp("2026-06-01"), periods=semanas, freq="7D")
    return pd.DataFrame([{"entidad": e, "semana": s} for e in range(1, n_entidades + 1) for s in fechas])


def evento(entidad, fecha, objetivo=True, proactivo=False, condicion=np.nan, riesgos=None, cierre=pd.NaT):
    return {
        "entidad": entidad, "fecha": fecha, "fecha_cierre": cierre, "objetivo": objetivo, "proactivo": proactivo,
        "pare": False, "severidad": np.nan, "condicion": condicion, "noche": False, "riesgos": riesgos or [],
    }


def con_senal(semilla=0):
    """Cada reporte preventivo de una semana aumenta mucho el riesgo de incidente en la siguiente."""
    rng = np.random.default_rng(semilla)
    base = spine()
    filas = []
    for entidad, grupo in base.groupby("entidad"):
        for semana in grupo["semana"]:
            preventivos = rng.poisson(0.5)
            for _ in range(preventivos):
                filas.append(evento(entidad, semana + pd.Timedelta(days=1), objetivo=False, proactivo=True))
            if rng.random() < 0.03 + 0.45 * min(preventivos, 2):
                filas.append(evento(entidad, semana + pd.Timedelta(days=9)))
    return base, pd.DataFrame(filas)


def sin_senal(semilla=1):
    rng = np.random.default_rng(semilla)
    base = spine()
    filas = [evento(e, s + pd.Timedelta(days=2)) for e, s in zip(base["entidad"], base["semana"]) if rng.random() < 0.15]
    return base, pd.DataFrame(filas)


class Panel(unittest.TestCase):
    base = spine(1, 6)
    fechas = sorted(base["semana"])

    def panel(self, eventos, h=1):
        return construir_panel(self.base, pd.DataFrame(eventos), h, hoy=self.fechas[-1] + pd.Timedelta(days=2))

    def test_no_usa_informacion_de_la_semana_actual_ni_futura(self):
        X, meta = self.panel([evento(1, self.fechas[3] + pd.Timedelta(days=1))])
        self.assertEqual(X["objetivo_u1"].fillna(0).tolist(), [0, 0, 0, 0, 1, 0])
        self.assertEqual(meta["y"].tolist(), [0, 0, 0, 1, 0, 0])

    def test_semana_en_curso_no_entra_a_entrenamiento(self):
        _, meta = self.panel([evento(1, self.fechas[0])], h=2)
        self.assertEqual(meta["observada"].tolist(), [True, True, True, True, False, False])

    def test_pendientes_descuentan_lo_cerrado(self):
        X, _ = self.panel([
            evento(1, self.fechas[0], cierre=self.fechas[2]),
            evento(1, self.fechas[1]),
        ])
        self.assertEqual(X["abiertos"].fillna(0).tolist(), [0, 1, 2, 1, 1, 1])

    def test_recurrencia_y_etiquetas(self):
        X, _ = self.panel([
            evento(1, self.fechas[0], objetivo=False, condicion=3, riesgos=["altura"]),
            evento(1, self.fechas[1], objetivo=False, condicion=3),
        ])
        self.assertEqual(X["recurrencia_u13"].iloc[-1], 2)
        self.assertEqual(X["riesgo_altura_u13"].iloc[-1], 1)


class Seleccion(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Muchos hilos de OpenMP hacen estas pruebas mucho mas lentas, igual que en el servicio.
        cls.limite = threadpool_limits(limits=1)
        cls.resultados = {}

    @classmethod
    def tearDownClass(cls):
        cls.limite.restore_original_limits()

    def evaluar(self, generador):
        if generador.__name__ not in self.resultados:
            X, meta = construir_panel(*generador(), 1, hoy=HOY)
            self.resultados[generador.__name__] = seleccionar_modelo(X, meta, (), 1) + (X, meta)
        return self.resultados[generador.__name__]

    def test_detecta_la_senal_plantada(self):
        resumen, ajuste, X, meta = self.evaluar(con_senal)
        self.assertEqual(resumen["metodo"], "modelo")
        self.assertGreater(resumen["metricas"]["auc_roc"], 0.7)
        self.assertGreater(resumen["mejora_log_loss_pct"], 3)
        self.assertTrue(any(f["variable"].startswith("proactivo") for f in resumen["importancia"][:3]))

    def test_explica_cada_prediccion(self):
        resumen, ajuste, X, meta = self.evaluar(con_senal)
        predicciones = predecir(ajuste, resumen, X, meta, HOY)
        self.assertEqual(len(predicciones), 8)
        self.assertTrue(all(0 < p["prob"] < 1 for p in predicciones.values()))
        self.assertTrue(any(p["factores"] for p in predicciones.values()))

    def test_sin_senal_no_presume_discriminacion(self):
        resumen, _, _, _ = self.evaluar(sin_senal)
        self.assertLess(resumen["metricas"]["auc_roc"], 0.6)
        self.assertIn(resumen["discriminacion"], ("muy baja", "baja"))

    def test_sin_senal_publica_la_tasa_historica(self):
        resumen, ajuste, _, _ = self.evaluar(sin_senal)
        self.assertEqual(resumen["metodo"], "referencia")
        self.assertIn("tasas", ajuste)

    def test_exige_el_margen_minimo(self):
        _, _, X, meta = self.evaluar(con_senal)
        with patch("motor_riesgo.MARGEN_MINIMO_PCT", 1000):
            resumen, ajuste = seleccionar_modelo(X, meta, (), 1)
        self.assertEqual(resumen["metodo"], "referencia")
        self.assertIn("por al menos", resumen["motivo"])

    def invertir_final(self, meta, proporcion=1.0):
        """Cambia lo ocurrido en el tramo final, sin tocar las semanas anteriores."""
        alterada = meta.copy()
        finales = alterada.index[alterada["observada"] & (alterada["semana"] >= alterada.loc[alterada["observada"], "semana"].quantile(0.85))]
        elegidas = finales[np.random.default_rng(0).random(len(finales)) < proporcion]
        alterada.loc[elegidas, "y"] = 1 - alterada.loc[elegidas, "y"]
        return alterada

    def test_el_tramo_final_no_influye_en_la_eleccion(self):
        resumen, _, X, meta = self.evaluar(con_senal)
        otro, _ = seleccionar_modelo(X, self.invertir_final(meta), (), 1)
        self.assertEqual(resumen["candidatos"], otro["candidatos"])

    def test_un_modelo_que_no_se_confirma_no_se_publica(self):
        _, _, X, meta = self.evaluar(con_senal)
        resumen, ajuste = seleccionar_modelo(X, self.invertir_final(meta), (), 1)
        self.assertEqual(resumen["metodo"], "referencia")
        self.assertIn("ordena el riesgo al revés", resumen["motivo"])

    def test_la_confirmacion_debe_cubrir_el_plazo(self):
        _, _, X, meta = self.evaluar(con_senal)
        resumen, ajuste = seleccionar_modelo(X, meta, (), 500)
        self.assertNotEqual(resumen["metodo"], "modelo")

    def test_el_modelo_publicado_no_aprendio_del_tramo_final(self):
        resumen, ajuste, X, meta = self.evaluar(con_senal)
        otro_resumen, otro = seleccionar_modelo(X, self.invertir_final(meta, 0.03), (), 1)
        self.assertEqual(otro_resumen["metodo"], "modelo")
        filas = X[ajuste["columnas"]].head(20)
        np.testing.assert_allclose(ajuste["modelo"].predict_proba(filas), otro["modelo"].predict_proba(filas))
        self.assertFalse(np.allclose(ajuste["calibrador"].coef_, otro["calibrador"].coef_))

    def test_informa_la_confirmacion_del_modelo_publicado(self):
        resumen, _, _, _ = self.evaluar(con_senal)
        self.assertEqual(resumen["confirmacion"]["modelo"], resumen["modelo"])
        self.assertEqual(resumen["metricas"], resumen["confirmacion"]["metricas"])
        self.assertEqual(resumen["filas_validacion"], resumen["confirmacion"]["filas"])

    def test_datos_insuficientes_no_publican(self):
        base = spine(2, 30)
        eventos = pd.DataFrame([evento(1, base["semana"].iloc[5])])
        X, meta = construir_panel(base, eventos, 1, hoy=HOY)
        resumen, ajuste = seleccionar_modelo(X, meta, (), 1)
        self.assertIsNone(ajuste)
        self.assertFalse(resumen["publicado"])


if __name__ == "__main__":
    unittest.main()
