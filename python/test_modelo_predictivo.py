"""Pruebas sin base de datos del objetivo y el ranking. Uso: python -m unittest"""
import json
import unittest

import numpy as np
import pandas as pd

from modelo_predictivo import (
    OBJETIVO_INCIDENTES,
    OBJETIVO_LESIONES,
    acotar_al_proyecto,
    aplicar_modelo,
    con_defecto,
    filtrar_objetivo,
    mas_probable,
    semanas_exposicion,
    sin_nulos,
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

    def test_excluye_trayecto_y_permite_objetivo_de_lesiones(self):
        tabla = pd.DataFrame({
            "tipo": ["accidente", "accidente", "incidente"],
            "laboral": [True, False, True],
            "con_lesion": [True, True, False],
        })
        self.assertEqual(len(filtrar_objetivo(tabla, OBJETIVO_INCIDENTES)), 2)
        self.assertEqual(len(filtrar_objetivo(tabla, OBJETIVO_LESIONES)), 1)

    def test_todos_no_cuenta_doble_el_informe(self):
        self.assertNotIn("informe_investigacion", self.tipos("todos"))
        self.assertIn("hallazgo", self.tipos("todos"))

    def test_todos_no_cuenta_la_tarjeta_pare_como_riesgo(self):
        self.assertNotIn("tarjeta_pare", self.tipos("todos"))

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
    def test_aplica_el_modelo_solo_donde_existe(self):
        entidades = [{"id": 1, "prob_evento": 0.1, "tasa_semanal_suavizada": 0.02},
                     {"id": 2, "prob_evento": 0.2, "tasa_semanal_suavizada": 0.05}]
        aplicar_modelo(entidades, "id", {1: {"prob": 0.4, "metodo": "modelo", "modelo": "M", "factores": []}}, 4)
        self.assertEqual(entidades[0]["prob_evento"], 0.4)
        self.assertEqual(entidades[0]["metodo"], "modelo")
        self.assertEqual(entidades[1]["prob_evento"], 0.2)

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
