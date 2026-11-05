"""Pruebas sin base de datos de la red neuronal. Uso: python -m unittest test_red_neuronal"""
import unittest
import warnings

import numpy as np
import pandas as pd

import horizontes
import prueba_red
from red_neuronal import _etiquetas_futuras, _probabilidades, dividir_temporal, entrenar_red, etiqueta_dias, medir_conversion, predecir_red
from traza_red import MAX_ENTRADAS, MAX_NEURONAS, Traza, elegir_entradas, nombre_entrada, propagar


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


class Horizontes(unittest.TestCase):
    def test_cada_plazo_usa_su_modelo_semanal(self):
        esperado = {1: 1, 2: 1, 5: 1, 7: 1, 14: 2, 21: 3, 30: 4, 60: 9, 90: 13}
        self.assertEqual({d: horizontes.semanas_modelo(d) for d in esperado}, esperado)
        self.assertTrue(horizontes.es_derivado(5))
        self.assertFalse(horizontes.es_derivado(7))

    def test_componer_dias_equivale_a_la_semana(self):
        tres = horizontes.convertir_probabilidad(0.4, 3 / 7)
        cuatro = horizontes.convertir_probabilidad(0.4, 4 / 7)
        self.assertAlmostEqual(1 - (1 - tres) * (1 - cuatro), 0.4)

    def test_convierte_solo_las_probabilidades_del_plazo(self):
        datos = {
            "prob_evento": 0.5, "tasa_semanal_suavizada": 0.1, "probabilidad_30_dias": 0.7,
            "factores": [{"variable": "a", "efecto": 0.2}],
            "modelos": {"proyecto": {"metricas": {"auc_roc": 0.7, "log_loss": 0.5}, "prevalencia": 0.3}},
            "niveles": {"area": [{"prob_evento": 0.5}]},
            "historial": {"predicciones": [{"cliente": "x", "prob": 0.5}]},
        }
        salida = horizontes.convertir_respuesta(datos, 1)
        esperado = round(1 - 0.5 ** (1 / 7), 6)
        self.assertEqual(salida["prob_evento"], esperado)
        self.assertEqual(salida["niveles"]["area"][0]["prob_evento"], esperado)
        self.assertEqual(salida["historial"]["predicciones"][0]["prob"], esperado)
        self.assertEqual(salida["tasa_semanal_suavizada"], 0.1)
        self.assertEqual(salida["probabilidad_30_dias"], 0.7)
        self.assertEqual(salida["modelos"], datos["modelos"])
        self.assertLess(salida["factores"][0]["efecto"], 0.2)
        self.assertGreater(salida["factores"][0]["efecto"], 0)
        self.assertTrue(salida["horizonte_derivado"])

    def test_la_semana_exacta_no_cambia_y_el_mes_se_ajusta_a_30_dias(self):
        self.assertEqual(horizontes.convertir_respuesta({"prob_evento": 0.5}, 7)["prob_evento"], 0.5)
        self.assertGreater(horizontes.convertir_respuesta({"prob_evento": 0.5}, 30)["prob_evento"], 0.5)

    def test_etiqueta_solo_los_primeros_dias(self):
        lunes = pd.Timestamp("2026-01-05")
        meta = pd.DataFrame({"entidad": [1], "semana": [lunes]})
        eventos = pd.DataFrame({"entidad": [1], "fecha": [lunes + pd.Timedelta(days=3)]})
        self.assertEqual(etiqueta_dias(meta, eventos, 2).tolist(), [0])
        self.assertEqual(etiqueta_dias(meta, eventos, 5).tolist(), [1])

    def test_mide_bien_una_conversion_correcta(self):
        # Eventos repartidos parejo en la semana: la tasa predicha debe acercarse a la real.
        rng = np.random.default_rng(0)
        semanas = pd.date_range("2024-01-01", periods=300, freq="7D")
        meta = pd.DataFrame([(e, s) for e in range(30) for s in semanas], columns=["entidad", "semana"])
        hay = rng.random(len(meta)) < 0.3
        eventos = meta[hay].assign(fecha=lambda d: d["semana"] + pd.to_timedelta(rng.integers(0, 7, hay.sum()), unit="D"))
        medida = medir_conversion(np.full(len(meta), 0.3), meta, meta, eventos)
        for dias in ("1", "2", "5"):
            self.assertAlmostEqual(medida[dias]["riesgo_predicho"], medida[dias]["tasa_real"], delta=0.015)


class PlazosCoherentes(unittest.TestCase):
    def test_un_plazo_mayor_nunca_baja(self):
        historia = horizontes.plazos_coherentes([{"a": 0.5, "b": 0.1}, {"a": 0.3, "b": 0.2}, {"a": 0.7, "b": 0.05}])
        self.assertEqual([h["a"] for h in historia], [0.5, 0.5, 0.7])
        self.assertEqual([h["b"] for h in historia], [0.1, 0.2, 0.2])

    def test_sin_contradicciones_no_cambia_nada(self):
        series = [{"a": 0.1}, {"a": 0.2}, {"a": 0.3}]
        self.assertEqual(horizontes.plazos_coherentes(series), series)

    def test_las_partes_no_superan_al_padre_y_tampoco_bajan(self):
        rng = np.random.default_rng(0)
        for _ in range(200):
            pasos = 6
            padres = {i: "p" for i in range(8)}
            topes = horizontes.plazos_coherentes([{"p": float(v)} for v in rng.gamma(2, 0.5, pasos)])
            series = [{i: float(rng.gamma(1, 0.3)) for i in padres} for _ in range(pasos)]
            historia = horizontes.plazos_coherentes(series, padres, topes)
            for paso in range(pasos):
                self.assertLessEqual(sum(historia[paso].values()), topes[paso]["p"] + 1e-9)
                if paso:
                    self.assertTrue(all(historia[paso][i] >= historia[paso - 1][i] - 1e-12 for i in padres))

    def test_entidad_nueva_en_un_plazo_mayor(self):
        historia = horizontes.plazos_coherentes([{"a": 0.1}, {"a": 0.1, "b": 0.4}])
        self.assertEqual(historia[-1], {"a": 0.1, "b": 0.4})

    def test_los_dias_exactos_tambien_quedan_ordenados(self):
        # 1 mes usa 4 semanas (se alarga) y 2 meses usa 9 semanas (se acorta).
        p4, p9 = 0.50, 0.51
        mes = horizontes.riesgo_acumulado(p4, horizontes.factor(30))
        dos = horizontes.riesgo_acumulado(p9, horizontes.factor(60))
        self.assertGreater(mes, dos)
        final = horizontes.plazos_coherentes([{"a": mes}, {"a": dos}])[-1]["a"]
        self.assertGreaterEqual(horizontes.probabilidad_de(final, horizontes.factor(60)), p9)


def filas_prueba(semilla=0, semanas=40, por_semana=30):
    rng = np.random.default_rng(semilla)
    fechas = pd.date_range("2025-01-06", periods=semanas, freq="7D").to_numpy()
    semana = np.repeat(fechas, por_semana)
    return rng, semana, len(semana)


class PruebasDeAcierto(unittest.TestCase):
    def evaluar(self, y, p, semana, rng):
        referencia = np.full(len(y), y.mean())
        return prueba_red.evaluar_salida(y, p, referencia, referencia, semana, y, p)

    def resultado(self, salida, clave):
        return next(x for x in salida["pruebas"] if x["clave"] == clave)["aprobada"]

    def test_un_modelo_con_senal_aprueba(self):
        rng, semana, n = filas_prueba()
        p = rng.beta(1, 3, n)
        y = (rng.random(n) < p).astype(int)
        salida = self.evaluar(y, p, semana, rng)
        for clave in ("azar", "tasa", "calibracion", "prioriza", "estable"):
            self.assertTrue(self.resultado(salida, clave), clave)

    def test_un_modelo_sin_senal_no_aprueba(self):
        rng, semana, n = filas_prueba(1)
        p = rng.beta(1, 3, n)
        y = (rng.random(n) < 0.25).astype(int)
        salida = self.evaluar(y, p, semana, rng)
        for clave in ("azar", "tasa", "prioriza"):
            self.assertFalse(self.resultado(salida, clave), clave)

    def test_detecta_probabilidades_descalibradas(self):
        rng, semana, n = filas_prueba(2)
        p = rng.beta(2, 2, n)
        y = (rng.random(n) < p / 3).astype(int)
        self.assertFalse(self.resultado(self.evaluar(y, p, semana, rng), "calibracion"))

    def test_el_umbral_sale_de_validacion_y_no_de_la_prueba(self):
        rng, semana, n = filas_prueba(3)
        p = rng.random(n)
        y = (p > 0.5).astype(int)
        y_val = np.array([0, 0, 1, 1])
        p_val = np.array([0.1, 0.15, 0.2, 0.25])
        referencia = np.full(n, y.mean())
        salida = prueba_red.evaluar_salida(y, p, referencia, referencia, semana, y_val, p_val)
        self.assertLessEqual(salida["umbral_validacion"]["umbral"], 0.2)

    def test_cada_criterio_elige_su_umbral(self):
        # Pocos eventos: anticiparlos exige avisar antes de lo que conviene para acertar mas filas.
        y = np.array([0] * 90 + [1] * 10)
        p = np.concatenate([np.linspace(0.01, 0.4, 90), np.linspace(0.2, 0.5, 10)])
        self.assertLess(prueba_red.elegir_umbral(y, p, "f1"), 0.42)
        self.assertGreaterEqual(prueba_red.metricas_umbral(y, p, prueba_red.elegir_umbral(y, p, "exactitud"))["exactitud"], 0.9)

    def test_la_matriz_suma_todas_las_filas(self):
        rng, semana, n = filas_prueba(4)
        p = rng.random(n)
        y = rng.integers(0, 2, n)
        for fila in prueba_red.curva_umbrales(y, p):
            self.assertEqual(fila["vp"] + fila["fp"] + fila["fn"] + fila["vn"], n)
        self.assertEqual(prueba_red.metricas_umbral(y, p, 0.5)["vp"], prueba_red.curva_umbrales(y, p)[49]["vp"])

    def test_sin_eventos_no_falla_y_avisa_poca_evidencia(self):
        rng, semana, n = filas_prueba(5)
        y = np.zeros(n, dtype=int)
        salida = self.evaluar(y, rng.random(n) * 0.1, semana, rng)
        self.assertFalse(salida["evidencia_suficiente"])
        self.assertIsNone(salida["auc"])
        self.assertFalse(self.resultado(salida, "azar"))

    def test_los_ejemplos_marcan_lo_ocurrido(self):
        semana = pd.date_range("2025-01-06", periods=4, freq="7D").to_numpy()
        salida = prueba_red.ejemplos(np.array([1, 0, 1, 0]), np.array([0.9, 0.8, 0.1, 0.2]), semana, np.array([1, 2, 3, 4]), lambda i: f"E{i}")
        self.assertEqual(salida["mayor_riesgo"][0], {"entidad": "E1", "semana": "2025-01-06", "prob": 0.9, "ocurrio": True})
        self.assertEqual(salida["sorpresas"][0]["entidad"], "E3")


class TrazaDeEntrenamiento(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        rng = np.random.default_rng(0)
        fechas = pd.date_range("2023-01-02", periods=120, freq="7D")
        filas = pd.DataFrame([(e, s) for e in range(5) for s in fechas], columns=["entidad", "semana"])
        cls.columnas = [f"v{i}" for i in range(20)]
        X = pd.DataFrame(rng.normal(size=(len(filas), 20)), columns=cls.columnas)
        Y = pd.DataFrame({"a": (X["v3"] > 0).astype(int), "b": (X["v7"] > 0).astype(int)})
        cls.traza = Traza(1)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            cls.ajuste = entrenar_red(X, Y, filas["semana"], pd.Series(True, index=filas.index), 1, traza=cls.traza, nombre_red="eventos")
        cls.X = X

    def test_registra_cada_etapa_y_la_ganadora(self):
        etapas = {f["etapa"] for f in self.traza.fotos}
        self.assertEqual(etapas, {"busqueda", "ensamble"})
        self.assertEqual({f["configuracion_indice"] for f in self.traza.fotos if f["etapa"] == "ensamble"}, {self.traza.redes["eventos"]["ganadora"]})

    def test_el_tamano_de_lo_dibujado_coincide_con_la_red(self):
        for foto in self.traza.fotos:
            self.assertEqual(len(foto["activaciones"]), len(foto["arquitectura"]))
            self.assertEqual(len(foto["pesos"]), len(foto["arquitectura"]) - 1)
            self.assertEqual(len(foto["pesos"][0]), MAX_ENTRADAS)
            self.assertLessEqual(len(foto["pesos"][0][0]), MAX_NEURONAS)
            self.assertEqual(len(foto["pesos"][-1][0]), 2)

    def test_los_pesos_cambian_entre_epocas(self):
        primera, segunda = self.traza.fotos[0], self.traza.fotos[1]
        self.assertNotEqual(primera["pesos"], segunda["pesos"])
        self.assertIsNone(primera["cambio"])
        self.assertGreater(segunda["cambio"][0], 0)

    def test_elige_las_entradas_con_senal(self):
        rng = np.random.default_rng(1)
        Z = rng.normal(size=(500, 10))
        y = (Z[:, 4] > 0).astype(float).reshape(-1, 1)
        self.assertIn(4, elegir_entradas(Z, y, 1))

    def test_la_propagacion_coincide_con_la_red(self):
        red = self.ajuste["redes"][0]
        Z = self.ajuste["preproceso"].transform(self.X.head(1))
        np.testing.assert_allclose(propagar(red, Z[0])[-1], _probabilidades(red, Z)[0], rtol=1e-6)

    def test_perdidas_comparables_entre_tramos(self):
        # Ambas son log-loss medias por salida: rondan 0,69 al comienzo y no suman las salidas.
        primera = self.traza.fotos[0]
        self.assertLess(primera["perdida_entrenamiento"], 1.0)
        self.assertLess(primera["perdida_validacion"], 1.0)

    def test_el_histograma_cuenta_todos_los_pesos(self):
        foto = self.traza.fotos[-1]
        red = foto["arquitectura"]
        self.assertEqual(sum(foto["histogramas"][0]), red[0] * red[1])

    def test_paginacion(self):
        pagina = self.traza.pagina(2, 3)
        self.assertEqual(len(pagina["fotos"]), 3)
        self.assertEqual(pagina["fotos"][0], self.traza.fotos[2])
        self.assertEqual(pagina["total"], len(self.traza.fotos))

    def test_nombres_legibles(self):
        self.assertEqual(nombre_entrada("cat__nivel_area"), "Nivel: area")
        self.assertEqual(nombre_entrada("num__entidad_tamano"), "Tamaño de la entidad")


if __name__ == "__main__":
    unittest.main()
