"""Reparto de la tasa del proyecto entre sus areas, cuadrillas, trabajadores y actividades.

Estas entidades no tienen modelo propio: con pocos eventos por entidad, un clasificador solo aprenderia
ruido. En cambio, cada una recibe una parte de la tasa semanal de su proyecto proporcional a sus
eventos historicos, suavizada hacia una parte "justa" (segun tamano o en partes iguales). Las partes
de un proyecto suman, como maximo, la tasa del proyecto, de modo que ninguna cuadrilla puede tener
mas riesgo que su proyecto.

  cuadrilla:   (n_c + ALFA * e_c / E_p) / (N_p + ALFA)     e = integrantes
  trabajador:  parte de su cuadrilla * (n_w + BETA / tamano) / (sum n + BETA)
  actividad:   (n_a + ALFA / A_p) / (N_p + ALFA)
"""
import numpy as np
import pandas as pd

from modelos_tasa import OBJETIVO_INCIDENTES, OBJETIVO_LESIONES, OBJETIVO_TODOS, COLUMNA_OBJETIVO, SIN_AREA, etiqueta, probabilidad

ALFA = 8.0
BETA = 4.0
VENTANA_HISTORIAL_SEMANAS = 104
UMBRALES_EVIDENCIA = (5, 20)
SUMABLES = ("inc_u", "todos_u", "proact_u", "ewm_inc")
SOLO_AREA = {"tasa_hist_inc", "sem_desde_ult", "sev_max_u13"}  # sin sentido sumadas: en el proyecto no muestran valor
HORIZONTES_REFERENCIA_DIAS = (30, 90)


def evidencia(n):
    return "alta" if n >= UMBRALES_EVIDENCIA[1] else "media" if n >= UMBRALES_EVIDENCIA[0] else "baja"


def _r(valor, digitos=6):
    return None if valor is None or (isinstance(valor, float) and np.isnan(valor)) else round(float(valor), digitos)


def vigentes(datos):
    """Proyectos en curso a la fecha de los datos."""
    p = datos["proyectos"]
    hoy = datos["hoy"]
    return p[(p["fecha_inicio"].isna() | (p["fecha_inicio"] <= hoy)) & (p["fecha_termino"].isna() | (p["fecha_termino"] >= hoy))]


def _eventos_objetivo(datos, objetivo):
    ev = datos["eventos"]
    desde = datos["semana_base"] - pd.Timedelta(weeks=VENTANA_HISTORIAL_SEMANAS)
    return ev[ev[COLUMNA_OBJETIVO[objetivo]] & (ev["semana"] >= desde) & (ev["semana"] < datos["semana_base"])]


def cuadrillas_activas(datos):
    """Cuadrillas asignadas hoy a cada proyecto, con sus integrantes vigentes."""
    hoy = datos["hoy"]
    asg = datos["asignaciones"]
    asg = asg[(asg["fecha_inicio"].isna() | (asg["fecha_inicio"] <= hoy)) & (asg["fecha_termino"].isna() | (asg["fecha_termino"] >= hoy))]
    asg = asg.sort_values("fecha_inicio").drop_duplicates(["id_proyecto", "id_cuadrilla"], keep="last")
    mem = datos["membresia"]
    mem = mem[(mem["fecha_inicio"].isna() | (mem["fecha_inicio"] <= hoy)) & (mem["fecha_fin"].isna() | (mem["fecha_fin"] >= hoy))]
    # Una cuadrilla sin historial con fechas se aproxima con su composicion actual.
    sin_historial = ~datos["obreros"]["id_cuadrilla"].isin(datos["membresia"]["id_cuadrilla"])
    miembros = pd.concat([mem[["id_trabajador", "id_cuadrilla"]], datos["obreros"][sin_historial]]).drop_duplicates()
    return asg[["id_proyecto", "id_cuadrilla"]], miembros


def _eventos_por_trabajador(datos, eventos):
    participantes = datos["participantes"].merge(eventos[["id_evento", "id_proyecto"]].dropna(subset=["id_evento"]), on="id_evento")
    return participantes.groupby(["id_proyecto", "id_trabajador"])["id_evento"].nunique()


def repartir(datos, tasas_proyecto, objetivo):
    """Tasa semanal de cada cuadrilla, trabajador y actividad de los proyectos vigentes."""
    eventos = _eventos_objetivo(datos, objetivo)
    activas, miembros = cuadrillas_activas(datos)
    por_trabajador = _eventos_por_trabajador(datos, eventos)
    nombres = datos["trabajadores"].set_index("id_trabajador")
    cuadrillas_info = datos["cuadrillas"].set_index("id_cuadrilla")
    salida = {"cuadrilla": [], "trabajador": [], "actividad": []}

    for id_proyecto, tasa in tasas_proyecto.items():
        propios = eventos[eventos["id_proyecto"] == id_proyecto]
        n_proyecto = len(propios)
        cuadrillas = activas.loc[activas["id_proyecto"] == id_proyecto, "id_cuadrilla"].tolist()
        integrantes = {c: miembros.loc[miembros["id_cuadrilla"] == c, "id_trabajador"].tolist() for c in cuadrillas}
        total_integrantes = sum(len(v) for v in integrantes.values()) or len(cuadrillas) or 1
        eventos_trab = {w: int(por_trabajador.get((id_proyecto, w), 0)) for c in cuadrillas for w in integrantes[c]}
        for c in cuadrillas:
            n_c = sum(eventos_trab[w] for w in integrantes[c])
            tamano = len(integrantes[c]) or 1
            parte_c = (n_c + ALFA * (len(integrantes[c]) or 1) / total_integrantes) / (n_proyecto + ALFA)
            tasa_c = tasa * min(parte_c, 1.0)
            info = cuadrillas_info.loc[c] if c in cuadrillas_info.index else None
            salida["cuadrilla"].append({
                "id": int(c), "id_proyecto": int(id_proyecto), "nombre": None if info is None else info["numero_cuadrilla"],
                "detalle": None if info is None else info["supervisor"], "tasa": tasa_c, "historico": n_c,
                "integrantes": len(integrantes[c]), "miembros": [int(w) for w in integrantes[c]],
            })
            suma = sum(eventos_trab[w] for w in integrantes[c])
            for w in integrantes[c]:
                parte_w = (eventos_trab[w] + BETA / tamano) / (suma + BETA)
                persona = nombres.loc[w] if w in nombres.index else None
                salida["trabajador"].append({
                    "id": int(w), "id_proyecto": int(id_proyecto), "id_cuadrilla": int(c),
                    "nombre": None if persona is None else persona["nombre_completo"],
                    "detalle": " · ".join(str(x) for x in (None if persona is None else persona["cargo"],
                                                            None if info is None else info["numero_cuadrilla"]) if x),
                    "cargo": None if persona is None else persona["cargo"],
                    "tasa": tasa_c * parte_w, "historico": eventos_trab[w],
                })

        acts = datos["actividades"]
        hoy = datos["hoy"]
        acts = acts[(acts["id_proyecto"] == id_proyecto) & (acts["inicio"].isna() | (acts["inicio"] <= hoy)) &
                    (acts["termino"].isna() | (acts["termino"] >= hoy))]
        if not acts.empty:
            conteo = propios["id_actividad"].value_counts()
            for fila in acts.itertuples():
                n_a = int(conteo.get(fila.id_actividad, 0))
                parte = (n_a + ALFA / len(acts)) / (n_proyecto + ALFA)
                info = cuadrillas_info.loc[fila.id_cuadrilla] if fila.id_cuadrilla in cuadrillas_info.index else None
                salida["actividad"].append({
                    "id": int(fila.id_actividad), "id_proyecto": int(id_proyecto), "nombre": fila.nombre,
                    "detalle": " · ".join(str(x) for x in (fila.riesgo_critico_nombre if fila.riesgo_critico else None,
                                                            None if info is None else info["numero_cuadrilla"]) if x),
                    "id_cuadrilla": int(fila.id_cuadrilla), "tasa": tasa * min(parte, 1.0), "historico": n_a,
                })
    return salida


# ---------------------------------------------------------------- estructura de cada respuesta

def factores_de(resultado, objetivo, dias, indices):
    """Factores locales del modelo: cuanto cambia el riesgo del plazo si la variable vuelve a su valor tipico."""
    efectos = resultado["efectos"][objetivo]
    if not efectos:
        return []
    tasa_col = f"tasa_{objetivo}"
    tasa = resultado["areas"].loc[indices, tasa_col].sum()
    semanas = dias / 7
    salida = []
    for variable, alternativa in efectos.items():
        tasa_sin = tasa - resultado["areas"].loc[indices, tasa_col].sum() + alternativa[indices].sum()
        efecto = float(probabilidad(tasa, semanas) - probabilidad(tasa_sin, semanas))
        valor = None
        if variable in resultado["valores"]:
            columna = resultado["valores"].loc[indices, variable]
            # Los conteos del area se suman para el proyecto; las variables del proyecto son iguales en todas sus areas.
            if len(indices) == 1 or (variable not in SOLO_AREA and not variable.startswith(SUMABLES)):
                valor = float(columna.iloc[0])
            elif variable.startswith(SUMABLES):
                valor = float(columna.sum())
        salida.append({"variable": variable, "etiqueta": etiqueta(variable), "valor": _r(valor, 4), "efecto": round(efecto, 6)})
    salida.sort(key=lambda f: abs(f["efecto"]), reverse=True)
    return [f for f in salida if abs(f["efecto"]) >= 0.001][:5]


def indicadores_de(resultado, indices, nivel_area):
    tabla = resultado["indicadores"].loc[indices]
    if tabla.empty:
        return {}
    primera = tabla.iloc[0]
    def valor(columna, suma=False):
        if columna not in tabla:
            return None
        return _r(tabla[columna].sum() if suma else primera[columna], 2)
    if nivel_area:
        return {"incidentes_13_semanas": valor("inc_u13"), "reportes_preventivos_13_semanas": valor("proact_u13"),
                "semanas_desde_ultimo_incidente": valor("sem_desde_ult"), "pendientes_de_cierre": valor("p_abiertos"),
                "personas_expuestas": valor("n_obreros")}
    return {"incidentes_13_semanas": valor("p_inc_u13"), "reportes_preventivos_13_semanas": valor("p_proact_u13"),
            "pendientes_de_cierre": valor("p_abiertos"), "semanas_desde_ultimo_incidente": valor("p_sem_desde_ult"),
            "personas_expuestas": valor("n_obreros")}


def tasas_por_proyecto(resultado, objetivo):
    return resultado["areas"].groupby("id_proyecto")[f"tasa_{objetivo}"].sum().to_dict()


def nombre_modelo(resultado, objetivo, nivel):
    return resultado["calidad"][objetivo].get(nivel, {}).get("modelo", "")


def metodo_de(resultado, objetivo, nivel):
    return resultado["calidad"][objetivo].get(nivel, {}).get("metodo", "modelo")


def entidades(resultado, objetivo, dias):
    """Niveles de /predicciones/entidades: cada entidad vigente con su probabilidad en el plazo."""
    datos = resultado["datos"]
    semanas = dias / 7
    areas = resultado["areas"]
    proyectos = vigentes(datos).set_index("id_proyecto")
    tasas = tasas_por_proyecto(resultado, objetivo)
    contexto = lambda id_p: {"id_proyecto": int(id_p), "proyecto": proyectos.at[id_p, "nombre"],
                             "cliente": proyectos.at[id_p, "cliente"], "faena": proyectos.at[id_p, "faena"]}
    niveles = {nivel: [] for nivel in ("proyecto", "area", "cuadrilla", "trabajador", "actividad", "cliente", "faena")}

    for id_p in proyectos.index:
        indices = areas.index[areas["id_proyecto"] == id_p]
        if len(indices) == 0:
            continue
        niveles["proyecto"].append({
            "id": int(id_p), "nombre": proyectos.at[id_p, "nombre"], "detalle": proyectos.at[id_p, "num_contrato"],
            **contexto(id_p), "prob_evento": _r(probabilidad(tasas[id_p], semanas)),
            "metodo": metodo_de(resultado, objetivo, "proyecto"), "modelo": nombre_modelo(resultado, objetivo, "proyecto"),
            "factores": factores_de(resultado, objetivo, dias, indices),
            "indicadores": indicadores_de(resultado, indices, False), "tasa_semanal": _r(tasas[id_p]),
        })
        info_areas = datos["areas"].set_index("id_area")
        for i in indices:
            id_a = int(areas.at[i, "id_area"])
            if id_a == SIN_AREA:
                continue  # El riesgo sin area forma parte del proyecto, pero no es un lugar que se pueda gestionar.
            info = info_areas.loc[id_a] if id_a in info_areas.index else None
            niveles["area"].append({
                "id": id_a, "nombre": None if info is None else (info["descripcion"] or info["codigo_area"]),
                "detalle": None if info is None else info["codigo_area"], **contexto(id_p),
                "prob_evento": _r(probabilidad(areas.at[i, f"tasa_{objetivo}"], semanas)),
                "metodo": metodo_de(resultado, objetivo, "area"), "modelo": nombre_modelo(resultado, objetivo, "area"),
                "factores": factores_de(resultado, objetivo, dias, pd.Index([i])),
                "indicadores": indicadores_de(resultado, pd.Index([i]), True), "tasa_semanal": _r(areas.at[i, f"tasa_{objetivo}"]),
            })

    repartos = repartir(datos, {p: t for p, t in tasas.items() if p in proyectos.index}, objetivo)
    calidad = resultado["calidad"][objetivo]
    for nivel, filas in repartos.items():
        for fila in filas:
            niveles[nivel].append({
                "id": fila["id"], "nombre": fila["nombre"], "detalle": fila.get("detalle"), **contexto(fila["id_proyecto"]),
                "prob_evento": _r(probabilidad(fila["tasa"], semanas)), "metodo": "reparto",
                "modelo": calidad[nivel]["modelo"], "factores": [],
                "indicadores": {"incidentes_13_semanas": None, "eventos_historicos": fila["historico"],
                                "personas_expuestas": fila.get("integrantes")},
                "tasa_semanal": _r(fila["tasa"]),
            })

    # Un trabajador en varias cuadrillas activas: se queda con su mayor riesgo.
    niveles["trabajador"] = list({f["id"]: f for f in sorted(niveles["trabajador"], key=lambda f: f["prob_evento"])}.values())
    for nivel, campo in (("cliente", "cliente"), ("faena", "faena")):
        grupos = {}
        for fila in niveles["proyecto"]:
            if fila.get(campo):
                grupos.setdefault(fila[campo], []).append(fila)
        for indice, (nombre, grupo) in enumerate(sorted(grupos.items()), start=1):
            tasa = sum(f["tasa_semanal"] for f in grupo)
            niveles[nivel].append({
                "id": indice, "nombre": nombre, "detalle": f"{len(grupo)} {'proyecto vigente' if len(grupo) == 1 else 'proyectos vigentes'}",
                "id_proyecto": None, "proyecto": None, "cliente": None, "faena": None,
                "prob_evento": _r(probabilidad(tasa, semanas)), "metodo": "suma", "modelo": "Suma de las tasas de sus proyectos",
                "factores": [], "tasa_semanal": _r(tasa),
                "indicadores": {c: sum(f["indicadores"].get(c) or 0 for f in grupo)
                                for c in ("incidentes_13_semanas", "reportes_preventivos_13_semanas", "pendientes_de_cierre")},
            })
    for nivel in niveles:
        niveles[nivel].sort(key=lambda f: f["prob_evento"] or 0, reverse=True)
    return niveles


def evento_estimado(resultado, objetivo, id_proyecto, dias, niveles):
    """Proximo evento probable de un proyecto: donde, quien y cuando, con su evidencia."""
    datos = resultado["datos"]
    proyectos = datos["proyectos"].set_index("id_proyecto")
    tasa = tasas_por_proyecto(resultado, objetivo).get(id_proyecto)
    if tasa is None or id_proyecto not in proyectos.index:
        return None
    del_proyecto = lambda nivel: [f for f in niveles[nivel] if f.get("id_proyecto") == id_proyecto]
    eventos = _eventos_objetivo(datos, objetivo)
    propios = eventos[eventos["id_proyecto"] == id_proyecto]
    tipos = propios["tipo"].value_counts()
    semanas_base = max(len(datos["semanas"][datos["semanas"]["id_proyecto"] == id_proyecto]), 1)

    def mejor(nivel):
        filas = del_proyecto(nivel)
        if not filas:
            return None, None
        fila = max(filas, key=lambda f: f["prob_evento"] or 0)
        return fila, fila["tasa_semanal"] / tasa if tasa else None

    area, parte_area = mejor("area")
    actividad, parte_actividad = mejor("actividad")
    cuadrilla, parte_cuadrilla = mejor("cuadrilla")
    trabajador, _ = mejor("trabajador")
    espera_dias = 7 / tasa if tasa > 0 else None
    n = len(propios)
    return {
        "id_proyecto": int(id_proyecto), "nombre_proyecto": proyectos.at[id_proyecto, "nombre"],
        "cliente": proyectos.at[id_proyecto, "cliente"], "faena": proyectos.at[id_proyecto, "faena"],
        "id_area_probable": None if area is None else area["id"], "area_probable": None if area is None else area["nombre"],
        "probabilidad_area": _r(parte_area, 4), "actividad_probable": None if actividad is None else actividad["nombre"],
        "probabilidad_actividad": _r(parte_actividad, 4),
        "trabajador_probable": None if trabajador is None else trabajador["nombre"],
        "id_trabajador_probable": None if trabajador is None else trabajador["id"],
        "cuadrilla_probable": None if cuadrilla is None else cuadrilla["nombre"], "probabilidad_cuadrilla": _r(parte_cuadrilla, 4),
        "tipo_evento_probable": tipos.index[0] if len(tipos) else None,
        "tipos_historicos": [{"tipo": t, "eventos": int(c)} for t, c in tipos.head(5).items()],
        "eventos_historicos_tipo": int(tipos.iloc[0]) if len(tipos) else 0, "eventos_historicos_proyecto": int(n),
        "prob_evento_horizonte": _r(probabilidad(tasa, dias / 7)),
        "espera_estimada_dias": _r(espera_dias, 1), "espera_estimada_semanas": _r(None if espera_dias is None else espera_dias / 7, 1),
        "fecha_estimada": None if espera_dias is None else str((datos["semana_base"] + pd.Timedelta(days=7 + min(espera_dias, 3650))).date()),
        "probabilidad_30_dias": _r(probabilidad(tasa, 30 / 7)), "probabilidad_90_dias": _r(probabilidad(tasa, 90 / 7)),
        "evidencia": evidencia(n), "tasa_semanal": _r(tasa), "semanas_observadas": semanas_base,
        "metodo_tiempo": "Espera media de un proceso de Poisson: 1 / tasa semanal del proyecto.",
        "advertencia": ("Estimación probabilística: la fecha es la espera media, no un pronóstico exacto. "
                        "Área, actividad, cuadrilla y trabajador son los de mayor parte de la tasa del proyecto."),
    }


def analisis_proyecto(resultado, objetivo, id_proyecto, dias, niveles):
    """Bloque analisis_entidades de /predicciones para un proyecto."""
    datos = resultado["datos"]
    del_proyecto = lambda nivel: [f for f in niveles[nivel] if f.get("id_proyecto") == id_proyecto]
    eventos = _eventos_objetivo(datos, objetivo)
    propios = eventos[eventos["id_proyecto"] == id_proyecto]
    tasa = tasas_por_proyecto(resultado, objetivo).get(id_proyecto, 0.0)

    trabajadores = [{
        "id_trabajador": f["id"], "nombre_trabajador": f["nombre"], "cargo": f["detalle"], "prob_evento": f["prob_evento"],
        "historico_eventos": f["indicadores"]["eventos_historicos"], "evidencia": evidencia(f["indicadores"]["eventos_historicos"]),
        "tasa_semanal": f["tasa_semanal"],
    } for f in del_proyecto("trabajador")]
    cuadrillas = [{
        "id_cuadrilla": f["id"], "nombre": f["nombre"], "supervisor": f["detalle"], "prob_evento": f["prob_evento"],
        "integrantes": f["indicadores"]["personas_expuestas"], "historico_eventos_asociados": f["indicadores"]["eventos_historicos"],
        "evidencia": evidencia(f["indicadores"]["eventos_historicos"]), "tasa_semanal": f["tasa_semanal"],
    } for f in del_proyecto("cuadrilla")]
    actividades = [{
        "id_actividad": f["id"], "actividad": f["nombre"], "riesgo": f["detalle"], "prob_evento": f["prob_evento"],
        "historico_eventos": f["indicadores"]["eventos_historicos"], "evidencia": evidencia(f["indicadores"]["eventos_historicos"]),
        "tasa_semanal": f["tasa_semanal"],
    } for f in del_proyecto("actividad")]
    areas = [{
        "id_area": f["id"], "nombre": f["nombre"], "prob_evento": f["prob_evento"],
        "historico_eventos": int((propios["id_area"] == f["id"]).sum()), "evidencia": evidencia(int((propios["id_area"] == f["id"]).sum())),
        "factores_principales": f["factores"], "tasa_semanal": f["tasa_semanal"],
    } for f in del_proyecto("area")]

    # Trabajador x actividad: la parte del trabajador dentro de la actividad de su cuadrilla.
    trabajador_actividad = []
    _, tabla_miembros = cuadrillas_activas(datos)
    miembros = tabla_miembros.groupby("id_cuadrilla")["id_trabajador"].apply(list).to_dict()
    trab = {f["id"]: f for f in del_proyecto("trabajador")}
    acts = datos["actividades"].set_index("id_actividad")
    for a in del_proyecto("actividad"):
        id_c = int(acts.at[a["id"], "id_cuadrilla"]) if a["id"] in acts.index else None
        grupo = [trab[w] for w in miembros.get(id_c, []) if w in trab]
        total = sum(t["tasa_semanal"] for t in grupo)
        for t in grupo:
            parte = t["tasa_semanal"] / total if total else 1 / len(grupo)
            tasa_ta = a["tasa_semanal"] * parte
            trabajador_actividad.append({
                "id_trabajador": t["id"], "nombre_trabajador": t["nombre"], "id_actividad": a["id"], "actividad": a["nombre"],
                "prob_evento": _r(probabilidad(tasa_ta, dias / 7)), "historico_eventos": t["indicadores"]["eventos_historicos"],
                "evidencia": evidencia(t["indicadores"]["eventos_historicos"]), "tasa_semanal": _r(tasa_ta),
            })
    trabajador_actividad.sort(key=lambda f: f["prob_evento"] or 0, reverse=True)

    # Factores operativos: parte de los eventos del proyecto en cada turno, causa o categoria.
    dimensiones = []
    for dimension in ("turno", "supervisor", "categoria", "causa_inmediata", "causa_basica", "empresa", "equipo"):
        conteo = propios[dimension].replace("", np.nan).dropna().value_counts()
        for valor, n in conteo.head(5).items():
            parte = n / (len(propios) + ALFA)
            dimensiones.append({
                "dimension": dimension, "valor": valor, "nombre": valor, "prob_evento": _r(probabilidad(tasa * parte, dias / 7)),
                "historico_eventos": int(n), "evidencia": evidencia(int(n)),
            })
    dimensiones.sort(key=lambda f: f["prob_evento"] or 0, reverse=True)

    proyecto = next((f for f in niveles["proyecto"] if f["id"] == id_proyecto), None)
    faena = next((f for f in niveles["faena"] if proyecto and f["nombre"] == proyecto.get("faena")), None)
    cliente = next((f for f in niveles["cliente"] if proyecto and f["nombre"] == proyecto.get("cliente")), None)
    resumen = lambda f: None if f is None else {"nombre": f["nombre"], "prob_evento": f["prob_evento"], "detalle": f["detalle"],
                                                "historico_eventos": f["indicadores"].get("incidentes_13_semanas"),
                                                "evidencia": "media", "tasa_semanal": f["tasa_semanal"]}
    return {
        "entidades": {
            "trabajadores": sorted(trabajadores, key=lambda f: f["prob_evento"] or 0, reverse=True),
            "trabajador_actividad": trabajador_actividad[:50],
            "cuadrillas": sorted(cuadrillas, key=lambda f: f["prob_evento"] or 0, reverse=True),
            "actividades": sorted(actividades, key=lambda f: f["prob_evento"] or 0, reverse=True),
            "areas": sorted(areas, key=lambda f: f["prob_evento"] or 0, reverse=True),
            "dimensiones_operativas": dimensiones[:20],
            "faena": resumen(faena), "cliente": resumen(cliente),
        },
        "contexto": {
            "id_proyecto": int(id_proyecto), "tipo_objetivo": objetivo, "horizonte_dias": dias,
            "metodo": ("Tasa semanal del proyecto (suma de sus áreas) repartida según los eventos históricos de cada "
                       f"entidad en las últimas {VENTANA_HISTORIAL_SEMANAS} semanas, suavizados"),
            "probabilidad_base_proyecto": None if proyecto is None else proyecto["prob_evento"],
            "tasa_semanal_proyecto": _r(tasa), "eventos_historicos": int(len(propios)),
            "evento_estimado": evento_estimado(resultado, objetivo, id_proyecto, dias, niveles),
        },
    }


def cuadrillas_globales(resultado, objetivo, dias, niveles, id_proyecto=None):
    """Bloque analisis_global.cuadrillas de /predicciones."""
    nombres = resultado["datos"]["trabajadores"].set_index("id_trabajador")
    proyectos = {f["id"]: f for f in niveles["proyecto"]}
    trabajadores = {f["id"]: f for f in niveles["trabajador"]}
    _, tabla_miembros = cuadrillas_activas(resultado["datos"])
    salida = []
    for f in niveles["cuadrilla"]:
        if id_proyecto is not None and f["id_proyecto"] != id_proyecto:
            continue
        ids = tabla_miembros.loc[tabla_miembros["id_cuadrilla"] == f["id"], "id_trabajador"].tolist()
        miembros = []
        for w in ids:
            t = trabajadores.get(w)
            persona = nombres.loc[w] if w in nombres.index else None
            miembros.append({
                "id_trabajador": int(w), "nombre": None if persona is None else persona["nombre_completo"],
                "cargo": None if persona is None else persona["cargo"],
                "historico_eventos": None if t is None else t["indicadores"]["eventos_historicos"],
                "tasa_semanal_suavizada": None if t is None else t["tasa_semanal"],
                "prob_evento": None if t is None else t["prob_evento"],
            })
        proyecto = proyectos.get(f["id_proyecto"], {})
        salida.append({
            "id_proyecto": f["id_proyecto"], "proyecto": f["proyecto"], "id_cuadrilla": f["id"], "cuadrilla": f["nombre"],
            "prob_evento": f["prob_evento"], "tipo_objetivo": objetivo, "horizonte_semanas": round(dias / 7, 2),
            "integrantes": f["indicadores"]["personas_expuestas"], "historico_eventos_asociados": f["indicadores"]["eventos_historicos"],
            "evidencia": evidencia(f["indicadores"]["eventos_historicos"]), "estado_asignacion": "activa",
            "miembros": miembros, "miembros_detalle": miembros,
            "factores": {"probabilidad_base_proyecto": proyecto.get("prob_evento"), "metodo": "reparto de la tasa del proyecto",
                         "tasa_semanal": f["tasa_semanal"], "parte_del_proyecto": _r(f["tasa_semanal"] / proyecto["tasa_semanal"], 4)
                         if proyecto.get("tasa_semanal") else None},
        })
    return sorted(salida, key=lambda f: f["prob_evento"] or 0, reverse=True)


__all__ = ["entidades", "analisis_proyecto", "cuadrillas_globales", "evento_estimado", "vigentes", "repartir",
           "OBJETIVO_INCIDENTES", "OBJETIVO_LESIONES", "OBJETIVO_TODOS"]
