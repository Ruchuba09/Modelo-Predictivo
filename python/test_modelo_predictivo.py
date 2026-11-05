"""Pruebas sin base de datos del objetivo y el ranking. Uso: python -m unittest"""
import json
import unittest

import numpy as np
import pandas as pd

from modelo_predictivo import (
    OBJETIVO_INCIDENTES,
    DatosInsuficientes,
    acotar_al_proyecto,
    armar_panel,
    con_defecto,
    filas_observadas,
    filtrar_objetivo,
    mas_probable,
    semanas_exposicion,
    sin_nulos,
    validar_temporal,
    verificar_datos,
)


class FiltrarObjetivo(unittest.TestCase):
    tabla = pd.DataFrame({"tipo": [
        "accidente", "incidente", "reporte_flash", "informe_investigacion",
        "hallazgo", "reporte_previene", "tarjeta_pare",
    ]})

    def tipos(self, objetivo):
        return set(filtrar_objetivo(self.tabla, objetivo)["tipo"])

    def test_incidentes_reales_excluye_predictores_e_informes(self):
        self.assertEqual(self.tipos(OBJETIVO_INCIDENTES), {"accidente", "incidente", "reporte_flash"})

    def test_todos_no_cuenta_doble_el_informe(self):
        self.assertNotIn("informe_investigacion", self.tipos("todos"))
        self.assertIn("hallazgo", self.tipos("todos"))

    def test_tipo_puntual(self):
        self.assertEqual(self.tipos("tarjeta_pare"), {"tarjeta_pare"})


class MasProbable(unittest.TestCase):
    def test_elige_el_mayor_aunque_no_sea_el_primero(self):
        entidades = [
            {"id": 1, "prob_evento": 0.1, "historico_eventos": 1},
            {"id": 2, "prob_evento": 0.7, "historico_eventos": 2},
        ]
        self.assertEqual(mas_probable(entidades)["id"], 2)

    def test_sin_historial_no_senala_a_nadie(self):
        self.assertIsNone(mas_probable([{"prob_evento": 0.5, "historico_eventos": 0}]))
        self.assertIsNone(mas_probable([]))


class Panel(unittest.TestCase):
    """Un hallazgo y un informe en la semana 2; un accidente en la semana 3."""

    semanas = pd.date_range("2026-01-05", periods=4, freq="7D")

    def armar(self, objetivo):
        spine = pd.DataFrame({"id_proyecto": 1, "semana": self.semanas})
        conteo = pd.DataFrame({
            "id_proyecto": 1,
            "semana": [self.semanas[1], self.semanas[1], self.semanas[2]],
            "tipo": ["hallazgo", "informe_investigacion", "accidente"],
            "n": 1,
            "sev_max": [None, None, None],
        })
        ctx = pd.DataFrame({
            "id_proyecto": 1, "semana": self.semanas, "n_cuadrillas": 1,
            "n_supervisores": 1, "n_obreros": 5, "n_actividades": 1,
        })
        est = pd.DataFrame({
            "id_proyecto": [1], "id_faena": [1], "id_cliente": [1], "n_areas_faena": [1],
            "fecha_inicio": [self.semanas[0]], "fecha_termino": [pd.NaT],
        })
        extra = pd.DataFrame(columns=["id_proyecto", "semana"])
        extra["id_proyecto"] = extra["id_proyecto"].astype("int64")
        extra["semana"] = pd.to_datetime(extra["semana"])
        return armar_panel(spine, conteo, ctx, est, extra, objetivo, 1)[0]

    def test_el_objetivo_solo_marca_incidentes(self):
        df = self.armar(OBJETIVO_INCIDENTES)
        self.assertEqual(df["y"].tolist(), [0, 0, 1, 0])

    def test_todos_cuenta_hallazgo_pero_no_informe(self):
        df = self.armar("todos")
        self.assertEqual(df["n_todos"].tolist(), [0, 1, 1, 0])

    def test_sin_incidentes_informa_el_motivo(self):
        spine = pd.DataFrame({"id_proyecto": 1, "semana": self.semanas})
        conteo = pd.DataFrame({
            "id_proyecto": [1], "semana": [self.semanas[0]], "tipo": ["hallazgo"],
            "n": [1], "sev_max": [None],
        })
        vacio = pd.DataFrame()
        with self.assertRaises(DatosInsuficientes):
            armar_panel(spine, conteo, vacio, vacio, vacio, OBJETIVO_INCIDENTES, 1)


class FilasObservadas(unittest.TestCase):
    semanas = pd.date_range("2026-01-05", periods=4, freq="7D")
    df = pd.DataFrame({"semana": semanas, "sem_restantes": [3, 2, 1, 0]})

    def fechas(self, h, hoy):
        return filas_observadas(self.df, h, pd.Timestamp(hoy))["semana"].dt.strftime("%m-%d").tolist()

    def test_excluye_la_semana_en_curso(self):
        # Miercoles de la ultima semana: esa semana aun no termina.
        self.assertEqual(self.fechas(1, "2026-01-28"), ["01-05", "01-12", "01-19"])

    def test_horizonte_largo_tampoco_incluye_la_semana_en_curso(self):
        self.assertEqual(self.fechas(2, "2026-01-28"), ["01-05", "01-12"])

    def test_proyecto_terminado_usa_todas_sus_semanas(self):
        self.assertEqual(len(self.fechas(1, "2026-06-01")), 4)


class Validacion(unittest.TestCase):
    @staticmethod
    def panel(senal=True):
        rng = np.random.default_rng(0)
        semanas = pd.date_range("2024-01-01", periods=100, freq="7D")
        df = pd.DataFrame({
            "id_proyecto": np.tile([1, 2, 3], 100),
            "semana": np.repeat(semanas, 3),
            "x": rng.random(300),
        })
        df["y"] = (df["x"] > 0.5).astype(int) if senal else rng.integers(0, 2, 300)
        return df

    def test_exige_positivos_y_proyectos(self):
        df = self.panel()
        with self.assertRaises(DatosInsuficientes):
            verificar_datos(df[df["id_proyecto"] < 3])
        with self.assertRaises(DatosInsuficientes):
            verificar_datos(df[df["y"] == 0])
        verificar_datos(df)

    def test_publica_metricas_si_discrimina(self):
        metricas, calibrador = validar_temporal(self.panel(), ["x"], 1)
        self.assertGreaterEqual(metricas["auc_roc"], 0.6)
        self.assertGreater(calibrador.coef_[0][0], 0)

    def test_rechaza_modelo_sin_senal(self):
        with self.assertRaises(DatosInsuficientes):
            validar_temporal(self.panel(senal=False), ["x"], 1)


class Nulos(unittest.TestCase):
    def test_nulos_de_pandas_pasan_a_json_valido(self):
        limpio = sin_nulos({"a": float("nan"), "b": [pd.NaT, np.float64("nan"), 1.5], "c": "x"})
        self.assertEqual(limpio, {"a": None, "b": [None, None, 1.5], "c": "x"})
        json.dumps(limpio, allow_nan=False)

    def test_nan_en_nombre_usa_el_valor_por_defecto(self):
        self.assertEqual(con_defecto(float("nan"), "Sin proyecto activo"), "Sin proyecto activo")
        self.assertEqual(con_defecto(None, "d"), "d")
        self.assertEqual(con_defecto("C-001", "d"), "C-001")


class RiesgoPorEntidad(unittest.TestCase):
    def test_la_suma_no_supera_al_proyecto(self):
        tasa_proyecto = -np.log1p(-0.30) / 4
        entidades = [
            {"tasa_semanal_suavizada": 0.5, "prob_evento": 0.9},
            {"tasa_semanal_suavizada": 0.1, "prob_evento": 0.3},
        ]
        acotar_al_proyecto(entidades, tasa_proyecto, 4)
        conjunta = 1 - np.prod([1 - e["prob_evento"] for e in entidades])
        self.assertAlmostEqual(conjunta, 0.30, places=3)
        self.assertGreater(entidades[0]["prob_evento"], entidades[1]["prob_evento"])

    def test_no_modifica_si_ya_cabe_en_el_proyecto(self):
        entidades = [{"tasa_semanal_suavizada": 0.001, "prob_evento": 0.004}]
        acotar_al_proyecto(entidades, 0.5, 4)
        self.assertEqual(entidades[0]["prob_evento"], 0.004)

    def test_exposicion_se_detiene_al_terminar_el_proyecto(self):
        hoy = pd.Timestamp("2026-06-01")
        inicio, termino = pd.Timestamp("2026-01-05"), pd.Timestamp("2026-01-26")
        self.assertEqual(semanas_exposicion(inicio, termino, hoy), 3.0)
        self.assertEqual(semanas_exposicion(pd.NaT, termino, hoy), 1.0)


if __name__ == "__main__":
    unittest.main()
