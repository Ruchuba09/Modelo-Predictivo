"""Pruebas sin base de datos del objetivo y el ranking. Uso: python -m unittest"""
import unittest

import pandas as pd

from modelo_predictivo import OBJETIVO_INCIDENTES, armar_panel, filtrar_objetivo, mas_probable


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
        with self.assertRaises(SystemExit):
            armar_panel(spine, conteo, vacio, vacio, vacio, OBJETIVO_INCIDENTES, 1)


if __name__ == "__main__":
    unittest.main()
