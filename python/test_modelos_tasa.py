"""Pruebas de los modelos de tasa y del reparto con datos sinteticos (no requieren base de datos).

  python -m unittest test_modelos_tasa
"""
import unittest
import warnings

import numpy as np
import pandas as pd

import horizontes
import modelos_tasa as mt
import reparto

HOY = pd.Timestamp("2026-11-12")


def datos_sinteticos(semilla=0, semanas=80, proyectos=4):
    """Proyectos con dos areas y una cuadrilla de tres personas; el area 1 tiene el doble de incidentes."""
    rng = np.random.default_rng(semilla)
    inicio = (HOY - pd.Timedelta(weeks=semanas)).normalize()
    inicio -= pd.Timedelta(days=inicio.weekday())
    filas, participantes, id_evento = [], [], 0
    tipos = [("incidente", True, False), ("reporte_previene", False, True), ("tarjeta_pare", False, True)]
    for p in range(1, proyectos + 1):
        for s in range(semanas):
            semana = inicio + pd.Timedelta(weeks=s)
            for area, tasa in ((1, 0.4), (2, 0.2)):
                for tipo, es_incidente, proactivo in tipos:
                    n = rng.poisson(tasa if es_incidente else 1.0)
                    for _ in range(n):
                        id_evento += 1
                        fecha = semana + pd.Timedelta(days=int(rng.integers(0, 7)), hours=int(rng.integers(0, 24)))
                        if fecha > HOY:
                            continue
                        filas.append({
                            "clave": f"e{id_evento}", "id_evento": id_evento, "id_proyecto": p, "id_area": area,
                            "id_actividad": 10 * p + area if rng.random() < 0.7 else np.nan, "tipo": tipo,
                            "es_incidente": es_incidente, "proactivo": proactivo,
                            "con_lesion": es_incidente and rng.random() < 0.3, "laboral": True,
                            "severidad": float(rng.integers(1, 4)), "fecha": fecha, "fecha_cierre": pd.NaT,
                            "turno": "Día", "supervisor": "Sup", "categoria": None, "causa_inmediata": None,
                            "causa_basica": None, "empresa": None, "equipo": None,
                        })
                        participantes.append({"id_evento": id_evento, "id_trabajador": 100 * p + int(rng.integers(1, 4))})
    eventos = pd.DataFrame(filas)
    eventos["incidente"] = eventos["es_incidente"] & eventos["laboral"]
    eventos["lesion"] = eventos["incidente"] & eventos["con_lesion"]
    eventos["todos"] = eventos["tipo"] != mt.TIPO_AVISO
    eventos["noche"] = False
    eventos["semana"] = mt.lunes(eventos["fecha"])
    ids = range(1, proyectos + 1)
    lista_semanas = [inicio + pd.Timedelta(weeks=s) for s in range(semanas)]
    datos = {
        "hoy": HOY, "eventos": eventos, "participantes": pd.DataFrame(participantes),
        "proyectos": pd.DataFrame({"id_proyecto": list(ids), "nombre": [f"P{p}" for p in ids], "id_cliente": 1,
                                   "id_faena": 1, "fecha_inicio": inicio, "fecha_termino": pd.NaT, "cliente": "Cliente",
                                   "faena": "Faena", "num_contrato": "C"}),
        "semanas": pd.DataFrame([(p, s) for p in ids for s in lista_semanas if s <= HOY], columns=["id_proyecto", "semana"]),
        "contexto": pd.DataFrame([(p, s, 1, 1, 3, 2) for p in ids for s in lista_semanas],
                                 columns=["id_proyecto", "semana", "n_cuadrillas", "n_supervisores", "n_obreros", "n_actividades"]),
        "areas": pd.DataFrame({"id_area": [1, 2], "id_faena": 1, "codigo_area": ["A1", "A2"], "descripcion": ["Area 1", "Area 2"]}),
        "asignaciones": pd.DataFrame({"id_asignacion": list(ids), "id_cuadrilla": list(ids), "id_proyecto": list(ids),
                                      "fecha_inicio": inicio, "fecha_termino": pd.NaT}),
        "membresia": pd.DataFrame([(100 * p + k, p, inicio, pd.NaT) for p in ids for k in (1, 2, 3)],
                                  columns=["id_trabajador", "id_cuadrilla", "fecha_inicio", "fecha_fin"]),
        "obreros": pd.DataFrame(columns=["id_trabajador", "id_cuadrilla"]),
        "cuadrillas": pd.DataFrame({"id_cuadrilla": list(ids), "numero_cuadrilla": [f"C{p}" for p in ids], "supervisor": "Sup"}),
        "trabajadores": pd.DataFrame([(100 * p + k, f"T{p}{k}", f"T{p}{k}", "Obrero") for p in ids for k in (1, 2, 3)],
                                     columns=["id_trabajador", "nombre", "nombre_completo", "cargo"]),
        "actividades": pd.DataFrame([(10 * p + a, p, p, p, f"Act {p}-{a}", inicio, pd.NaT, None, None) for p in ids for a in (1, 2)],
                                    columns=["id_actividad", "id_asignacion", "id_proyecto", "id_cuadrilla", "nombre", "inicio",
                                             "termino", "riesgo_critico", "riesgo_critico_nombre"]),
        "extra": pd.DataFrame(),
    }
    datos["semana_base"] = eventos["semana"].max()
    return datos


class PruebasPanel(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.datos = datos_sinteticos()
        cls.X, cls.meta = mt.construir_panel(cls.datos)

    def test_una_fila_por_proyecto_area_semana(self):
        self.assertFalse(self.meta.duplicated(["id_proyecto", "id_area", "semana"]).any())
        # Dos areas de la faena mas "sin area".
        self.assertEqual(set(self.meta["id_area"]), {mt.SIN_AREA, 1, 2})

    def test_conteos_cuadran_con_los_eventos(self):
        ev = self.datos["eventos"]
        self.assertEqual(self.meta["n_inc"].sum(), ev["incidente"].sum())
        self.assertEqual(self.meta["n_todos"].sum(), ev["todos"].sum())
        self.assertLessEqual(self.meta["n_les"].sum(), self.meta["n_inc"].sum())

    def test_variables_no_miran_la_semana_actual(self):
        """Cambiar los eventos de la ultima semana no cambia sus variables: no hay fuga del objetivo."""
        datos = datos_sinteticos()
        ultima = datos["semana_base"]
        extra = datos["eventos"][datos["eventos"]["incidente"]].head(5).copy()
        extra["semana"] = ultima
        extra["fecha"] = ultima + pd.Timedelta(hours=1)
        datos["eventos"] = pd.concat([datos["eventos"], extra], ignore_index=True)
        X2, meta2 = mt.construir_panel(datos)
        actual = (self.meta["semana"] == ultima).to_numpy()
        pd.testing.assert_frame_equal(self.X[actual].reset_index(drop=True), X2[(meta2["semana"] == ultima).to_numpy()].reset_index(drop=True))

    def test_semana_base_no_es_entrenable(self):
        self.assertFalse(self.meta.loc[self.meta["semana"] == self.datos["semana_base"], "observada"].any())


class PruebasModelos(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            cls.resultado = mt.entrenar(datos_sinteticos())

    def test_tres_objetivos_con_calidad_por_nivel(self):
        for objetivo in mt.OBJETIVOS:
            calidad = self.resultado["calidad"][objetivo]
            for nivel in ("proyecto", "area", "cuadrilla", "trabajador", "actividad"):
                self.assertIn(nivel, calidad)
                self.assertTrue(calidad[nivel]["publicado"])
                self.assertIn("modelo", calidad[nivel])

    def test_lesiones_nunca_superan_incidentes(self):
        areas = self.resultado["areas"]
        self.assertTrue((areas["tasa_lesiones"] <= areas["tasa_incidentes_reales"] + 1e-12).all())
        self.assertTrue(((areas["p_lesion"] > 0) & (areas["p_lesion"] < 1)).all())

    def test_tasas_positivas_y_area_riesgosa_mayor(self):
        areas = self.resultado["areas"]
        self.assertTrue((areas[["tasa_incidentes_reales", "tasa_todos"]] > 0).all().all())
        por_area = areas.groupby("id_area")["tasa_incidentes_reales"].mean()
        self.assertGreater(por_area[1], por_area[2])

    def test_calibracion_aproximada(self):
        """La tasa predicha por proyecto se parece a la tasa real simulada (0.6 incidentes por semana)."""
        por_proyecto = self.resultado["areas"].groupby("id_proyecto")["tasa_incidentes_reales"].sum()
        self.assertTrue(((por_proyecto > 0.3) & (por_proyecto < 1.2)).all(), por_proyecto.to_dict())

    def test_metricas_de_validacion(self):
        area = self.resultado["calidad"][mt.OBJETIVO_INCIDENTES]["area"]
        self.assertIn("metricas", area)
        self.assertIn(mt.NOMBRE_REFERENCIA, area["candidatos"])
        self.assertTrue(0 <= area["metricas"]["auc_roc"] <= 1)


class PruebasReparto(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            cls.resultado = mt.entrenar(datos_sinteticos())

    def test_probabilidad_crece_con_el_plazo(self):
        anterior = None
        for dias in horizontes.DIAS_DISPONIBLES:
            niveles = reparto.entidades(self.resultado, mt.OBJETIVO_INCIDENTES, dias)
            actual = {f["id"]: f["prob_evento"] for f in niveles["proyecto"]}
            if anterior:
                self.assertTrue(all(actual[k] >= anterior[k] for k in actual))
            anterior = actual

    def test_partes_no_superan_al_proyecto(self):
        niveles = reparto.entidades(self.resultado, mt.OBJETIVO_INCIDENTES, 30)
        tasa = {f["id"]: f["tasa_semanal"] for f in niveles["proyecto"]}
        for nivel in ("area", "cuadrilla", "actividad"):
            suma = {}
            for f in niveles[nivel]:
                suma[f["id_proyecto"]] = suma.get(f["id_proyecto"], 0) + f["tasa_semanal"]
            for p, s in suma.items():
                self.assertLessEqual(s, tasa[p] + 1e-6, nivel)
        for f in niveles["trabajador"]:
            cuadrilla = next(c for c in niveles["cuadrilla"] if c["id_proyecto"] == f["id_proyecto"])
            self.assertLessEqual(f["prob_evento"], cuadrilla["prob_evento"])

    def test_cliente_suma_sus_proyectos(self):
        niveles = reparto.entidades(self.resultado, mt.OBJETIVO_TODOS, 7)
        total = sum(f["tasa_semanal"] for f in niveles["proyecto"])
        self.assertAlmostEqual(niveles["cliente"][0]["tasa_semanal"], total, places=4)

    def test_analisis_y_evento_estimado(self):
        niveles = reparto.entidades(self.resultado, mt.OBJETIVO_LESIONES, 30)
        analisis = reparto.analisis_proyecto(self.resultado, mt.OBJETIVO_LESIONES, 1, 30, niveles)
        for clave in ("trabajadores", "trabajador_actividad", "cuadrillas", "actividades", "areas", "dimensiones_operativas"):
            self.assertIn(clave, analisis["entidades"])
        estimado = analisis["contexto"]["evento_estimado"]
        self.assertEqual(estimado["id_proyecto"], 1)
        self.assertLessEqual(estimado["probabilidad_30_dias"], estimado["probabilidad_90_dias"])
        cuadrillas = reparto.cuadrillas_globales(self.resultado, mt.OBJETIVO_LESIONES, 30, niveles, 1)
        self.assertEqual(len(cuadrillas), 1)
        self.assertEqual(len(cuadrillas[0]["miembros"]), 3)


class PruebasHorizontes(unittest.TestCase):
    def test_probabilidad_desde_tasa(self):
        self.assertAlmostEqual(float(mt.probabilidad(0.5, 2)), 1 - np.exp(-1.0))
        self.assertEqual(float(mt.probabilidad(0.0, 13)), 0.0)

    def test_metadatos(self):
        self.assertTrue(horizontes.metadatos(2)["horizonte_derivado"])
        self.assertFalse(horizontes.metadatos(30)["horizonte_derivado"])
        self.assertIn(horizontes.DIAS_PREDETERMINADOS, horizontes.DIAS_DISPONIBLES)


if __name__ == "__main__":
    unittest.main()
