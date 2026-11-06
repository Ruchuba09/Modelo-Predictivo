"""Objetivos del modelo, riesgo por entidad y estimador historico de respaldo.

El entrenamiento y la seleccion de modelos estan en motor_riesgo.py. Aqui se arma el analisis
de cada entidad: usa la prediccion del motor cuando existe y, si no, una tasa suavizada.
"""
import numpy as np
import pandas as pd

# Objetivo por defecto: lo que AVA pide predecir. Hallazgos, Previene y PARE quedan
# como predictores; incluirlos en el objetivo haria predecir reportes, no incidentes.
OBJETIVO_INCIDENTES = "incidentes_reales"
OBJETIVO_LESIONES = "lesiones"
# Se completa con los tipos marcados es_incidente en tipo_eventos (ver actualizar_tipos).
TIPOS_INCIDENTE_REAL = {"accidente", "incidente", "reporte_flash"}
SQL_TIPO = "COALESCE(te.codigo, lower(regexp_replace(trim(te.nombre), '[[:space:]]+', '_', 'g')))"
SQL_CLASIFICACION = "COALESCE(ci.con_lesion, FALSE) AS con_lesion, COALESCE(ci.laboral, TRUE) AS laboral"
# El informe documenta un incidente ya contado por su Reporte Flash.
TIPOS_SEGUIMIENTO = frozenset({"informe_investigacion"})
NOMBRES_NIVEL_SEVERIDAD = {"Grave": "Crítica"}
OBJETIVOS_AGRUPADOS = frozenset({"todos", OBJETIVO_INCIDENTES, OBJETIVO_LESIONES})


def actualizar_tipos(engine):
    """Toma del catalogo que tipos son incidentes; asi un tipo nuevo no exige cambiar el codigo."""
    from sqlalchemy import text

    incidentes = pd.read_sql(text("SELECT codigo FROM public.tipo_eventos WHERE es_incidente AND codigo IS NOT NULL"), engine)
    TIPOS_INCIDENTE_REAL.clear()
    TIPOS_INCIDENTE_REAL.update({"reporte_flash", *incidentes["codigo"]})

def tasa_desde_probabilidad(probabilidad, horizonte):
    p = min(max(float(probabilidad), 0.0001), 0.9999)
    return -np.log1p(-p) / max(horizonte, 1)


def semanas_exposicion(inicio, termino, hoy):
    """Semanas de actividad hasta el termino del proyecto o hasta hoy."""
    if pd.isna(inicio):
        return 1.0
    fin = min(termino, hoy) if pd.notna(termino) else hoy
    return max(1.0, (fin - inicio).days / 7)


def acotar_al_proyecto(entidades, tasa_proyecto, horizonte):
    """Reduce tasas cuya suma supere la del proyecto: una parte no puede superar al total."""
    suma = sum(e["tasa_semanal_suavizada"] for e in entidades)
    if suma <= tasa_proyecto or suma == 0:
        return
    factor = tasa_proyecto / suma
    for e in entidades:
        tasa = e["tasa_semanal_suavizada"] * factor
        e["tasa_semanal_suavizada"] = round(float(tasa), 6)
        e["prob_evento"] = round(float(1 - np.exp(-tasa * horizonte)), 6)


def aplicar_modelo(entidades, clave, predicciones, horizonte):
    """Reemplaza la tasa suavizada por la prediccion del motor cuando existe."""
    for entidad in entidades:
        prediccion = (predicciones or {}).get(entidad[clave])
        if prediccion is None:
            continue
        entidad["prob_evento"] = prediccion["prob"]
        entidad["tasa_semanal_suavizada"] = round(float(tasa_desde_probabilidad(prediccion["prob"], horizonte)), 6)
        entidad["metodo"] = prediccion["metodo"]
        entidad["modelo"] = prediccion["modelo"]
        entidad["factores_principales"] = prediccion["factores"]


def con_defecto(valor, defecto):
    """Un nulo de pandas puede ser NaN, que en Python cuenta como verdadero."""
    return defecto if pd.isna(valor) or not valor else valor


def sin_nulos(valor):
    """Reemplaza NaN, infinitos y NaT por None: JSON no los admite."""
    if isinstance(valor, dict):
        return {clave: sin_nulos(x) for clave, x in valor.items()}
    if isinstance(valor, (list, tuple)):
        return [sin_nulos(x) for x in valor]
    if valor is pd.NaT or valor is pd.NA or (isinstance(valor, float) and not np.isfinite(valor)):
        return None
    return valor


def filtrar_objetivo(tabla, tipo_obj):
    """Filas de `tabla` (con columna tipo) que cuentan para el objetivo."""
    if tipo_obj == "todos":
        return tabla[~tabla["tipo"].isin(TIPOS_SEGUIMIENTO)]
    if tipo_obj in (OBJETIVO_INCIDENTES, OBJETIVO_LESIONES):
        filas = tabla["tipo"].isin(TIPOS_INCIDENTE_REAL)
        # Trayecto y enfermedad comun ocurren fuera de la obra: no se predicen con sus datos.
        if "laboral" in tabla:
            filas &= tabla["laboral"].fillna(True).astype(bool)
        if tipo_obj == OBJETIVO_LESIONES:
            filas &= tabla["con_lesion"].fillna(False).astype(bool) if "con_lesion" in tabla else False
        return tabla[filas]
    return tabla[tabla["tipo"] == tipo_obj]


def mas_probable(entidades, clave_historico="historico_eventos"):
    """Entidad de mayor riesgo con historial propio; sin historial no hay a quien senalar."""
    con_historial = [e for e in entidades if e.get(clave_historico, 0) > 0]
    return max(con_historial, key=lambda e: e["prob_evento"], default=None)


def tipos_disponibles(engine):
    filas = pd.read_sql(
        "SELECT DISTINCT tipo FROM public.v_conteo_semanal_tipo ORDER BY tipo", engine
    )
    return filas["tipo"].dropna().tolist()


def _nombres_dimensiones(engine):
    """Traduce los identificadores de las dimensiones operativas a nombres legibles."""
    from sqlalchemy import text

    consultas = {
        "supervisor": """SELECT s.id_trabajador AS id, trim(concat_ws(' ', pe.nombre_1, pe.apellido_1)) AS nombre
                         FROM public.supervisores s JOIN public.trabajadores t USING (id_trabajador)
                         JOIN public.personas pe USING (id_persona)""",
        "turno": "SELECT id_turno AS id, nombre FROM public.cat_turno",
        "categoria": "SELECT id_categoria_evento AS id, nombre FROM public.cat_categoria_evento",
        "causa_inmediata": "SELECT id_causa AS id, nombre FROM public.cat_causa",
        "causa_basica": "SELECT id_causa AS id, nombre FROM public.cat_causa",
        "empresa": "SELECT id_empresa AS id, razon_social AS nombre FROM public.empresas",
        "equipo": "SELECT id_equipo AS id, codigo AS nombre FROM public.equipos",
    }
    return {
        dimension: dict(zip(tabla["id"].astype(int), tabla["nombre"]))
        for dimension, tabla in ((d, pd.read_sql(text(sql), engine)) for d, sql in consultas.items())
    }


def generar_analisis_entidades(engine, id_proyecto, tipo_obj=OBJETIVO_INCIDENTES, horizonte=4,
                               probabilidad_proyecto=None, modelos=None):
    """Estima riesgos por trabajador, actividad, cuadrilla, área y cliente.

    Usa la predicción de `modelos` (salida del motor) cuando el nivel tiene modelo y, si no,
    una tasa histórica suavizada hacia la tasa del proyecto.
    """
    modelos = modelos or {}
    from sqlalchemy import text

    proyecto = pd.read_sql(text("""
        SELECT p.id_proyecto, p.nombre, p.id_cliente, p.id_faena,
               p.fecha_inicio, p.fecha_termino, c.codigo_historico,
               COALESCE(c.nombre, c.razon_social) AS cliente, f.nombre AS faena
        FROM public.proyectos p
        LEFT JOIN public.clientes c ON c.id_cliente = p.id_cliente
        LEFT JOIN public.faenas f ON f.id_faena = p.id_faena
        WHERE p.id_proyecto = :id
    """), engine, params={"id": id_proyecto})
    if proyecto.empty:
        return {"entidades": {}, "contexto": {"mensaje": "Proyecto no encontrado."}}
    p = proyecto.iloc[0]
    hoy = pd.Timestamp.today().normalize()
    inicio = pd.to_datetime(p["fecha_inicio"], errors="coerce")
    semanas_proyecto = semanas_exposicion(inicio, pd.to_datetime(p["fecha_termino"], errors="coerce"), hoy)
    semanas_prior = 8.0
    base = float(probabilidad_proyecto if probabilidad_proyecto is not None else 0.05)
    base = min(max(base, 0.0001), 0.9999)
    hazard_base = tasa_desde_probabilidad(base, horizonte)

    columnas_evento = pd.read_sql(text("""
        SELECT column_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name='eventos'
    """), engine)["column_name"].tolist()
    fecha_expr = "COALESCE(e.fecha_ocurrencia, e.fecha_creacion)" \
        if "fecha_ocurrencia" in columnas_evento else "e.fecha_creacion"
    actividad_expr = "e.id_actividad" if "id_actividad" in columnas_evento else "NULL::bigint"
    area_expr = "e.id_area" if "id_area" in columnas_evento else "NULL::bigint"
    severidad_expr = "e.severidad" if "severidad" in columnas_evento else "NULL::text"
    dimensiones_ids = {
        "supervisor": "id_supervisor", "equipo": "id_equipo", "empresa": "id_empresa",
        "turno": "id_turno", "categoria": "id_categoria_evento",
        "causa_inmediata": "id_causa_inmediata", "causa_basica": "id_causa_basica",
    }
    dimensiones_select = ",\n               ".join(
        f"e.{columna} AS dimension_{nombre}" if columna in columnas_evento
        else f"NULL::bigint AS dimension_{nombre}"
        for nombre, columna in dimensiones_ids.items()
    )
    eventos = pd.read_sql(text(f"""
        SELECT e.id_evento, e.id_proyecto, {fecha_expr}::date AS fecha, {SQL_CLASIFICACION},
               {SQL_TIPO} AS tipo,
               e.id_trabajador, {area_expr} AS id_area,
               {actividad_expr} AS id_actividad, {severidad_expr} AS severidad,
               {dimensiones_select},
               pr.id_cliente, pr.id_faena
        FROM public.eventos e
        JOIN public.tipo_eventos te USING (id_tipo_evento)
        LEFT JOIN public.cat_clasificacion_incidente ci ON ci.id_clasificacion_incidente = e.id_clasificacion_incidente
        JOIN public.proyectos pr USING (id_proyecto)
        WHERE e.id_proyecto IS NOT NULL AND {fecha_expr} IS NOT NULL
    """), engine)
    # Suma reportes e informes unificados al historial de proyecto/cliente/faena.
    # No se inventan asociaciones a personas cuando el origen no las registra.
    extras = pd.read_sql(text("""
        SELECT 'origen:' || u.origen || ':' || u.id_origen AS id_evento,
               u.id_proyecto, u.fecha, u.tipo, u.con_lesion, u.laboral, NULL::bigint AS id_trabajador,
               u.id_area, NULL::bigint AS id_actividad,
               u.severidad::text AS severidad,
               NULL::bigint AS dimension_supervisor, NULL::bigint AS dimension_equipo,
               NULL::bigint AS dimension_empresa, NULL::bigint AS dimension_turno,
               NULL::bigint AS dimension_categoria, NULL::bigint AS dimension_causa_inmediata,
               NULL::bigint AS dimension_causa_basica,
               p.id_cliente, p.id_faena
        FROM public.v_eventos_unificados u
        JOIN public.proyectos p USING (id_proyecto)
        WHERE u.origen <> 'eventos' AND u.id_proyecto IS NOT NULL AND u.fecha IS NOT NULL
    """), engine)
    if not extras.empty:
        eventos["id_evento"] = eventos["id_evento"].astype(object)
        eventos = pd.concat([eventos, extras], ignore_index=True)
    eventos_obj = filtrar_objetivo(eventos, tipo_obj)

    # Incorpora participantes secundarios sin duplicar el trabajador principal.
    participantes = eventos[["id_evento", "id_trabajador"]].dropna().copy()
    participantes["id_trabajador"] = participantes["id_trabajador"].astype(int)
    try:
        extra_part = pd.read_sql(text("""
            SELECT id_evento, id_trabajador FROM public.evento_trabajador
        """), engine)
        participantes = pd.concat([participantes, extra_part], ignore_index=True)
        participantes = participantes.drop_duplicates(["id_evento", "id_trabajador"])
    except Exception:
        pass
    participantes = participantes.merge(eventos[["id_evento", "id_proyecto", "fecha", "tipo", "con_lesion", "laboral"]],
                                         on="id_evento", how="inner")
    participantes = filtrar_objetivo(participantes, tipo_obj).copy()
    participantes["fecha"] = pd.to_datetime(participantes["fecha"])

    # Exposición actual de trabajadores/cuadrillas/actividades del proyecto.
    asignaciones = pd.read_sql(text("""
        SELECT a.id_asignacion, a.id_cuadrilla, a.fecha_inicio AS asignacion_inicio,
               ac.id_actividad, ac.nombre AS actividad,
               ac.fecha_inicio AS actividad_inicio, ac.fecha_termino AS actividad_termino,
               o.id_trabajador, t.cargo,
               trim(concat_ws(' ', pe.nombre_1, pe.nombre_2, pe.apellido_1, pe.apellido_2)) AS nombre_trabajador,
               c.numero_cuadrilla AS cuadrilla
        FROM public.asignaciones a
        LEFT JOIN public.cuadrillas c ON c.id_cuadrilla = a.id_cuadrilla
        LEFT JOIN public.obreros o ON o.id_cuadrilla = a.id_cuadrilla
        LEFT JOIN public.trabajadores t ON t.id_trabajador = o.id_trabajador
        LEFT JOIN public.personas pe ON pe.id_persona = t.id_persona
        LEFT JOIN public.actividades ac
               ON ac.id_asignacion = a.id_asignacion
              AND COALESCE(ac.fecha_inicio, a.fecha_inicio) <= CURRENT_DATE
              AND COALESCE(ac.fecha_termino, 'infinity'::date) >= CURRENT_DATE
        WHERE a.id_proyecto = :id
          AND a.fecha_inicio <= CURRENT_DATE
          AND COALESCE(a.fecha_termino, 'infinity'::date) >= CURRENT_DATE
    """), engine, params={"id": id_proyecto})

    def riesgo(n_eventos, exposicion, soporte, fraccion=1.0):
        """`fraccion` es la parte del riesgo del proyecto que corresponde a la entidad a priori."""
        exposicion = max(float(exposicion or 0), 0.0)
        tasa = (float(n_eventos) + hazard_base * fraccion * semanas_prior) / (exposicion + semanas_prior)
        prob = 1 - np.exp(-tasa * horizonte)
        calidad = "alta" if soporte >= 20 else "media" if soporte >= 5 else "baja"
        return round(float(np.clip(prob, 0, 1)), 6), round(float(tasa), 6), calidad

    def contar(tabla, columna, valor):
        if not valor or tabla.empty or columna not in tabla:
            return 0
        return int((tabla[columna] == valor).sum())

    def eventos_desde(tabla, inicio):
        """Limita los eventos al periodo medido por la exposicion."""
        return tabla if pd.isna(inicio) else tabla[tabla["fecha"] >= inicio]

    # Solo se reduce frente a una probabilidad de proyecto calculada, no frente al valor por defecto.
    def acotar(entidades):
        if probabilidad_proyecto is not None:
            acotar_al_proyecto(entidades, hazard_base, horizonte)

    trabajadores = []
    ids_trabajadores = sorted(asignaciones["id_trabajador"].dropna().astype(int).unique())
    for wid in ids_trabajadores:
        asign = asignaciones[asignaciones["id_trabajador"] == wid].iloc[0]
        en_proyecto = participantes[(participantes["id_trabajador"] == wid) &
                                    (participantes["id_proyecto"] == id_proyecto)]
        fecha_asig = pd.to_datetime(asign["asignacion_inicio"], errors="coerce")
        n = len(eventos_desde(en_proyecto, fecha_asig))
        n_historico_total = contar(participantes, "id_trabajador", wid)
        expos = max(1.0, (hoy - fecha_asig).days / 7) if pd.notna(fecha_asig) else semanas_proyecto
        prob, tasa, calidad = riesgo(n, expos, n, 1 / len(ids_trabajadores))
        trabajadores.append({"id_trabajador": int(wid), "nombre_trabajador": asign.get("nombre_trabajador"), "cargo": asign.get("cargo"),
            "prob_evento": prob, "tipo_objetivo": tipo_obj, "horizonte_semanas": horizonte,
            "historico_eventos": n, "historico_eventos_proyecto": len(en_proyecto),
            "historico_eventos_todos_proyectos": n_historico_total,
            "semanas_exposicion_estimadas": round(expos, 1),
            "tasa_semanal_suavizada": tasa, "evidencia": calidad,
            "id_cuadrilla": int(asign["id_cuadrilla"]) if pd.notna(asign["id_cuadrilla"]) else None,
            "id_actividad": int(asign["id_actividad"]) if pd.notna(asign["id_actividad"]) else None,
            "factores": {"probabilidad_base_proyecto": round(base, 6), "eventos_historicos_asociados": n,
                         "actividad_actual": asign.get("actividad"), "metodo": "tasa histórica suavizada hacia el riesgo del proyecto"}})

    aplicar_modelo(trabajadores, "id_trabajador", modelos.get("trabajador"), horizonte)
    acotar(trabajadores)

    # Una predicción por trabajador y actividad actualmente asignada.
    trabajador_actividad = []
    pares = asignaciones.dropna(subset=["id_trabajador", "id_actividad"]).drop_duplicates(
        ["id_trabajador", "id_actividad"])
    for _, asign in pares.iterrows():
        wid, aid = int(asign["id_trabajador"]), int(asign["id_actividad"])
        subset = eventos_obj[(eventos_obj["id_proyecto"] == id_proyecto) &
                             (eventos_obj["id_actividad"] == aid)]
        ids_eventos = set(subset["id_evento"].astype(int)) if not subset.empty else set()
        inicio_actividad = pd.to_datetime(asign["actividad_inicio"], errors="coerce")
        del_trabajador = participantes[(participantes["id_trabajador"] == wid) &
                                       participantes["id_evento"].isin(ids_eventos)]
        n = len(eventos_desde(del_trabajador, inicio_actividad))
        expos = max(1.0, (hoy - inicio_actividad).days / 7) if pd.notna(inicio_actividad) else semanas_proyecto
        prob, tasa, calidad = riesgo(n, expos, n, 1 / len(pares))
        trabajador_actividad.append({"id_trabajador": wid, "id_actividad": aid,
            "actividad": asign.get("actividad"), "prob_evento": prob, "tipo_objetivo": tipo_obj,
            "horizonte_semanas": horizonte, "historico_eventos": n,
            "semanas_exposicion_estimadas": round(expos, 1), "tasa_semanal_suavizada": tasa,
            "evidencia": calidad, "factores": {"eventos_del_trabajador_en_esta_actividad": n,
            "probabilidad_base_proyecto": round(base, 6), "metodo": "tasa histórica trabajador-actividad suavizada"}})
    acotar(trabajador_actividad)

    cuadrillas = []
    for squad, grupo in asignaciones.dropna(subset=["id_cuadrilla"]).groupby("id_cuadrilla"):
        miembros = sorted(grupo["id_trabajador"].dropna().astype(int).unique().tolist())
        # Recuento de eventos asociados a alguno de los miembros; etiqueta el conjunto actual.
        ev_ids = set(participantes[participantes["id_trabajador"].isin(miembros)]["id_evento"].astype(int))
        n = int(eventos_obj[events_obj_project(eventos_obj, id_proyecto)]["id_evento"].isin(ev_ids).sum()) if not eventos_obj.empty else 0
        suma_riesgos = sum(x["prob_evento"] for x in trabajadores if x["id_trabajador"] in miembros)
        prob = round(float(1 - np.prod([1 - min(max(x, 0), 1) for x in
                          [next((w["prob_evento"] for w in trabajadores if w["id_trabajador"] == m), base)
                           for m in miembros]])), 6)
        cuadrillas.append({"id_cuadrilla": int(squad), "nombre": grupo["cuadrilla"].dropna().iloc[0]
            if grupo["cuadrilla"].notna().any() else f"Cuadrilla {int(squad)}", "miembros": miembros,
            "prob_evento": prob, "tipo_objetivo": tipo_obj, "horizonte_semanas": horizonte,
            "historico_eventos_asociados": n, "evidencia": "media" if n >= 5 else "baja",
            "factores": {"integrantes": len(miembros), "probabilidades_individuales_combinadas": True,
                         "suma_probabilidades_individuales": round(float(suma_riesgos), 6),
                         "metodo": "combinación independiente aproximada de riesgos individuales"},
            "tasa_semanal_suavizada": round(float(tasa_desde_probabilidad(prob, horizonte)), 6)})
    aplicar_modelo(cuadrillas, "id_cuadrilla", modelos.get("cuadrilla"), horizonte)
    acotar(cuadrillas)

    actividades = []
    n_actividades = asignaciones["id_actividad"].nunique()
    for aid, grupo in asignaciones.dropna(subset=["id_actividad"]).groupby("id_actividad"):
        aid = int(aid)
        n = int(((eventos_obj["id_proyecto"] == id_proyecto) &
                 (eventos_obj["id_actividad"] == aid)).sum()) if not eventos_obj.empty else 0
        prob, tasa, calidad = riesgo(n, semanas_proyecto, n, 1 / n_actividades)
        actividades.append({"id_actividad": aid, "nombre": grupo["actividad"].dropna().iloc[0]
            if grupo["actividad"].notna().any() else f"Actividad {aid}", "prob_evento": prob,
            "tipo_objetivo": tipo_obj, "horizonte_semanas": horizonte, "historico_eventos": n,
            "tasa_semanal_suavizada": tasa, "evidencia": calidad,
            "factores": {"id_asignaciones_activas": sorted(grupo["id_asignacion"].astype(int).unique().tolist()),
                         "probabilidad_base_proyecto": round(base, 6)}})
    aplicar_modelo(actividades, "id_actividad", modelos.get("actividad"), horizonte)
    acotar(actividades)

    areas_df =pd.read_sql(text("""
        SELECT id_area, codigo_area, descripcion FROM public.areas WHERE id_faena = :faena
    """), engine, params={"faena": int(p["id_faena"])}) if pd.notna(p["id_faena"]) else pd.DataFrame()
    areas = []
    for _, area in areas_df.iterrows():
        aid = int(area["id_area"])
        n = int(((eventos_obj["id_proyecto"] == id_proyecto) & (eventos_obj["id_area"] == aid)).sum()) \
            if not eventos_obj.empty else 0
        prob, tasa, calidad = riesgo(n, semanas_proyecto, n, 1 / len(areas_df))
        areas.append({"id_area": aid, "nombre": area.get("descripcion") or area.get("codigo_area"),
            "prob_evento": prob, "tipo_objetivo": tipo_obj, "horizonte_semanas": horizonte,
            "historico_eventos": n, "tasa_semanal_suavizada": tasa, "evidencia": calidad,
            "factores": {"id_faena": int(p["id_faena"]), "probabilidad_base_proyecto": round(base, 6)}})
    aplicar_modelo(areas, "id_area", modelos.get("area"), horizonte)
    acotar(areas)

    dimensiones_operativas = []
    nombres_dimension = _nombres_dimensiones(engine)
    eventos_proyecto = eventos_obj[eventos_obj["id_proyecto"] == id_proyecto]
    for nombre, columna in [(f"dimension_{nombre}", f"dimension_{nombre}") for nombre in dimensiones_ids]:
        valores = eventos_proyecto[columna].dropna().value_counts() if not eventos_proyecto.empty else pd.Series(dtype=int)
        for valor, n in valores.items():
            prob, tasa, calidad = riesgo(int(n), semanas_proyecto, int(n), 1 / len(valores))
            dimensiones_operativas.append({
                "dimension": nombre.replace("dimension_", ""),
                "valor": int(valor),
                "nombre": nombres_dimension.get(nombre.replace("dimension_", ""), {}).get(int(valor), f"#{int(valor)}"),
                "prob_evento": prob, "tipo_objetivo": tipo_obj, "horizonte_semanas": horizonte,
                "historico_eventos": int(n), "tasa_semanal_suavizada": tasa, "evidencia": calidad,
                "factores": {"id_proyecto": int(id_proyecto), "probabilidad_base_proyecto": round(base, 6),
                             "metodo": "frecuencia histórica del factor operativo suavizada hacia el riesgo del proyecto"},
            })
    if not eventos_proyecto.empty:
        valores_severidad = eventos_proyecto["severidad"].dropna().astype(str).value_counts()
        for valor, n in valores_severidad.items():
            prob, tasa, calidad = riesgo(int(n), semanas_proyecto, int(n), 1 / len(valores_severidad))
            dimensiones_operativas.append({
                "dimension": "severidad", "valor": valor, "nombre": NOMBRES_NIVEL_SEVERIDAD.get(valor, valor), "prob_evento": prob,
                "tipo_objetivo": tipo_obj, "horizonte_semanas": horizonte,
                "historico_eventos": int(n), "tasa_semanal_suavizada": tasa, "evidencia": calidad,
                "factores": {"id_proyecto": int(id_proyecto), "probabilidad_base_proyecto": round(base, 6)},
            })

    todos_proyectos = pd.read_sql(text("""
        SELECT id_cliente, id_faena, fecha_inicio, fecha_termino FROM public.proyectos
    """), engine)
    for columna in ("fecha_inicio", "fecha_termino"):
        todos_proyectos[columna] = pd.to_datetime(todos_proyectos[columna])

    def exposicion_conjunta(columna, valor):
        """Suma la duracion real de cada proyecto del cliente o de la faena."""
        grupo = todos_proyectos[todos_proyectos[columna] == valor]
        return max(semanas_proyecto, sum(
            semanas_exposicion(f["fecha_inicio"], f["fecha_termino"], hoy) for _, f in grupo.iterrows()
        ))

    same_client = eventos_obj[eventos_obj["id_cliente"] == p["id_cliente"]] if pd.notna(p["id_cliente"]) else eventos_obj.iloc[0:0]
    client_n = len(same_client)
    client_exposure = exposicion_conjunta("id_cliente", p["id_cliente"])
    client_prob, client_rate, client_quality = riesgo(client_n, client_exposure, client_n)
    cliente = {"id_cliente": int(p["id_cliente"]) if pd.notna(p["id_cliente"]) else None,
        "nombre": p.get("cliente"), "prob_evento": client_prob, "tipo_objetivo": tipo_obj,
        "horizonte_semanas": horizonte, "historico_eventos": client_n,
        "proyectos_historicos": int(same_client["id_proyecto"].nunique()) if not same_client.empty else 0,
        "semanas_exposicion_estimadas": round(client_exposure, 1),
        "tasa_semanal_suavizada": client_rate, "evidencia": client_quality,
        "factores": {"probabilidad_base_proyecto": round(base, 6),
                     "eventos_en_proyectos_del_cliente": client_n,
                     "metodo": "historial de eventos del cliente suavizado hacia el riesgo del proyecto"}}

    same_faena = eventos_obj[eventos_obj["id_faena"] == p["id_faena"]] if pd.notna(p["id_faena"]) else eventos_obj.iloc[0:0]
    faena_n = len(same_faena)
    faena_projects = int(same_faena["id_proyecto"].nunique()) if not same_faena.empty else 0
    faena_exposure = exposicion_conjunta("id_faena", p["id_faena"])
    faena_prob, faena_rate, faena_quality = riesgo(faena_n, faena_exposure, faena_n)
    # Con el cliente enlazado a los logs, su riesgo sale del modelo entrenado con el historial real.
    prediccion_cliente = (modelos.get("cliente_historico") or {}).get(p.get("codigo_historico"))
    if prediccion_cliente:
        cliente.update({"prob_evento": prediccion_cliente["prob"], "metodo": prediccion_cliente["metodo"],
                        "modelo": prediccion_cliente["modelo"], "factores_principales": prediccion_cliente["factores"]})

    faena = {"id_faena": int(p["id_faena"]) if pd.notna(p["id_faena"]) else None,
        "nombre": p.get("faena"),
        "prob_evento": faena_prob, "tipo_objetivo": tipo_obj, "horizonte_semanas": horizonte,
        "historico_eventos": faena_n, "proyectos_historicos": faena_projects,
        "semanas_exposicion_estimadas": round(faena_exposure, 1),
        "tasa_semanal_suavizada": faena_rate, "evidencia": faena_quality,
        "factores": {"probabilidad_base_proyecto": round(base, 6),
                     "eventos_en_proyectos_de_la_faena": faena_n,
                     "metodo": "historial de la faena suavizado hacia el riesgo del proyecto"}}

    eventos_proyecto_todos = filtrar_objetivo(eventos[eventos["id_proyecto"] == id_proyecto], "todos")
    distribucion_tipos = eventos_proyecto_todos["tipo"].value_counts() if not eventos_proyecto_todos.empty else pd.Series(dtype=int)
    tipos_historicos = [
        {"tipo": str(nombre), "eventos": int(total)}
        for nombre, total in distribucion_tipos.head(5).items()
    ]
    if tipo_obj in OBJETIVOS_AGRUPADOS:
        distribucion_objetivo = filtrar_objetivo(eventos_proyecto_todos, tipo_obj)["tipo"].value_counts()
        tipo_predicho = str(distribucion_objetivo.index[0]) if not distribucion_objetivo.empty else None
        eventos_tipo_predicho = int(distribucion_objetivo.iloc[0]) if not distribucion_objetivo.empty else 0
    else:
        tipo_predicho = tipo_obj
        eventos_tipo_predicho = int((eventos_proyecto_todos["tipo"] == tipo_obj).sum()) if not eventos_proyecto_todos.empty else 0
    area_probable = mas_probable(areas)
    actividad_probable = mas_probable(actividades)
    trabajador_probable = mas_probable(trabajadores)
    cuadrilla_probable = mas_probable(cuadrillas, "historico_eventos_asociados")
    tasa_semanal = -np.log1p(-base) / max(horizonte, 1)
    espera_dias = max(1, int(np.ceil(7 / max(tasa_semanal, 1e-6))))
    fecha_evento = (hoy + pd.Timedelta(days=espera_dias)).date().isoformat()
    evento_estimado = {
        "id_proyecto": int(id_proyecto), "nombre_proyecto": p["nombre"],
        "id_cliente": int(p["id_cliente"]) if pd.notna(p["id_cliente"]) else None,
        "cliente": p.get("cliente"), "id_faena": int(p["id_faena"]) if pd.notna(p["id_faena"]) else None,
        "faena": p.get("faena"),
        "id_area_probable": area_probable["id_area"] if area_probable else None,
        "area_probable": area_probable["nombre"] if area_probable else None,
        "probabilidad_area": area_probable["prob_evento"] if area_probable else None,
        "actividad_probable": actividad_probable["nombre"] if actividad_probable else None,
        "probabilidad_actividad": actividad_probable["prob_evento"] if actividad_probable else None,
        "trabajador_probable": trabajador_probable.get("nombre_trabajador") if trabajador_probable else None,
        "id_trabajador_probable": trabajador_probable["id_trabajador"] if trabajador_probable else None,
        "cuadrilla_probable": cuadrilla_probable["nombre"] if cuadrilla_probable else None,
        "probabilidad_cuadrilla": cuadrilla_probable["prob_evento"] if cuadrilla_probable else None,
        "tipo_evento_probable": tipo_predicho,
        "tipos_historicos": tipos_historicos,
        "eventos_historicos_tipo": eventos_tipo_predicho,
        "eventos_historicos_proyecto": int(len(eventos_proyecto_todos)),
        "prob_evento_horizonte": round(base, 6),
        "horizonte_semanas": horizonte,
        "espera_estimada_dias": espera_dias,
        "espera_estimada_semanas": round(espera_dias / 7, 1),
        "fecha_estimada": fecha_evento,
        "probabilidad_30_dias": round(float(1 - np.exp(-tasa_semanal * 30 / 7)), 6),
        "probabilidad_90_dias": round(float(1 - np.exp(-tasa_semanal * 90 / 7)), 6),
        "evidencia": "alta" if len(eventos_proyecto_todos) >= 20 else "media" if len(eventos_proyecto_todos) >= 5 else "baja",
        "metodo_tiempo": "esperanza de espera calculada con una tasa semanal constante derivada de la probabilidad del horizonte",
        "advertencia": "Es una fecha esperada estadística, no una fecha cierta. El tipo y el área se infieren del historial registrado.",
    }

    # Resumen contextual, con información del proyecto que explica cada estimación.
    return {"entidades": {"trabajadores": sorted(trabajadores, key=lambda x: x["prob_evento"], reverse=True),
            "trabajador_actividad": sorted(trabajador_actividad, key=lambda x: x["prob_evento"], reverse=True),
            "cuadrillas": sorted(cuadrillas, key=lambda x: x["prob_evento"], reverse=True),
            "actividades": sorted(actividades, key=lambda x: x["prob_evento"], reverse=True),
            "areas": sorted(areas, key=lambda x: x["prob_evento"], reverse=True),
            "dimensiones_operativas": sorted(dimensiones_operativas,
                                               key=lambda x: x["prob_evento"], reverse=True),
            "faena": faena, "cliente": cliente},
        "contexto": {"id_proyecto": int(id_proyecto), "nombre_proyecto": p["nombre"],
            "id_cliente": int(p["id_cliente"]) if pd.notna(p["id_cliente"]) else None,
            "cliente": p.get("cliente"), "id_faena": int(p["id_faena"]) if pd.notna(p["id_faena"]) else None,
            "tipo_objetivo": tipo_obj, "horizonte_semanas": horizonte,
            "probabilidad_base_proyecto": round(base, 6), "semanas_historicas_proyecto_estimadas": round(semanas_proyecto, 1),
            "metodo": "estimaciones jerárquicas con suavizado bayesiano hacia la probabilidad del proyecto",
            "nota_evidencia": "Las semanas de exposición son aproximadas cuando no hay asistencia histórica por entidad.",
            "evento_estimado": evento_estimado}}


def generar_predicciones_historicas(engine, tipo_obj=OBJETIVO_INCIDENTES, horizonte=4):
    """Respaldo interpretable para proyectos cuando el clasificador no tiene datos suficientes."""
    proyectos = pd.read_sql("""
        SELECT id_proyecto, nombre, fecha_inicio,
               LEAST(COALESCE(fecha_termino, CURRENT_DATE), CURRENT_DATE) AS fecha_fin,
               fecha_inicio <= CURRENT_DATE
                   AND (fecha_termino IS NULL OR fecha_termino >= CURRENT_DATE) AS vigente
        FROM public.proyectos
        WHERE fecha_inicio IS NOT NULL
    """, engine)
    conteos = pd.read_sql("""
        SELECT id_proyecto, tipo, con_lesion, laboral, count(*) AS eventos
        FROM public.v_eventos_unificados
        WHERE id_proyecto IS NOT NULL
        GROUP BY id_proyecto, tipo, con_lesion, laboral
    """, engine)
    conteos = filtrar_objetivo(conteos, tipo_obj)
    por_proyecto = conteos.groupby("id_proyecto")["eventos"].sum() if not conteos.empty else pd.Series(dtype=float)
    hoy = pd.Timestamp.today().normalize()
    proyectos["exposicion_semanas"] = (
        (pd.to_datetime(proyectos["fecha_fin"]) - pd.to_datetime(proyectos["fecha_inicio"])).dt.days / 7
    ).clip(lower=1)
    total_exposicion = float(proyectos["exposicion_semanas"].sum()) if not proyectos.empty else 1.0
    hazard_prior = max(float(por_proyecto.sum()) / max(total_exposicion, 1), 0.0001)
    resultados = []
    # Los proyectos terminados aportan a la tasa global, pero no tienen riesgo futuro.
    for _, proyecto in proyectos[proyectos["vigente"]].iterrows():
        eventos_hist = int(por_proyecto.get(proyecto["id_proyecto"], 0))
        semanas = float(proyecto["exposicion_semanas"])
        hazard = (eventos_hist + hazard_prior * 8) / (semanas + 8)
        resultados.append({
            "id_proyecto": int(proyecto["id_proyecto"]), "nombre_proyecto": proyecto["nombre"],
            "semana": hoy.date().isoformat(),
            "prob_evento": round(float(1 - np.exp(-hazard * horizonte)), 6),
            "metodo": "tasa histórica de eventos por semana con suavizado global",
            "variables": {"eventos_historicos_proyecto": eventos_hist,
                          "exposicion_semanas_estimada": round(semanas, 1),
                          "tasa_global_semanal": round(hazard_prior, 6)},
        })
    return sorted(resultados, key=lambda item: item["prob_evento"], reverse=True)


def generar_predicciones_cuadrillas(engine, horizonte=4, tipo_obj=OBJETIVO_INCIDENTES,
                                    probabilidades_proyecto=None, id_proyecto=None, modelos=None):
    """Calcula riesgo para cada cuadrilla actualmente asignada a proyectos vigentes."""
    from sqlalchemy import text

    modelos = modelos or {}
    asignaciones = pd.read_sql(text("""
        SELECT p.id_proyecto, p.nombre AS proyecto,
               a.id_asignacion, c.id_cuadrilla, a.fecha_inicio AS asignacion_inicio,
               c.numero_cuadrilla,
               o.id_trabajador, t.cargo,
               trim(concat_ws(' ', pe.nombre_1, pe.nombre_2, pe.apellido_1, pe.apellido_2)) AS trabajador
        FROM public.cuadrillas c
        LEFT JOIN (
            SELECT a.id_asignacion, a.id_cuadrilla, a.id_proyecto, a.fecha_inicio
            FROM public.asignaciones a
            JOIN public.proyectos pa ON pa.id_proyecto = a.id_proyecto
            WHERE a.fecha_inicio <= CURRENT_DATE
              AND COALESCE(a.fecha_termino, 'infinity'::date) >= CURRENT_DATE
              AND (pa.fecha_termino IS NULL OR pa.fecha_termino >= CURRENT_DATE)
        ) a ON a.id_cuadrilla = c.id_cuadrilla
        LEFT JOIN public.proyectos p ON p.id_proyecto = a.id_proyecto
        LEFT JOIN public.obreros o ON o.id_cuadrilla = c.id_cuadrilla
        LEFT JOIN public.trabajadores t ON t.id_trabajador = o.id_trabajador
        LEFT JOIN public.personas pe ON pe.id_persona = t.id_persona
        WHERE (:id_proyecto IS NULL OR p.id_proyecto = :id_proyecto)
    """), engine, params={"id_proyecto": id_proyecto})
    if asignaciones.empty:
        return []

    eventos = pd.read_sql(text(f"""
        SELECT e.id_evento, e.id_proyecto,
               {SQL_TIPO} AS tipo, {SQL_CLASIFICACION},
               e.id_trabajador,
               COALESCE(e.fecha_ocurrencia, e.fecha_creacion)::date AS fecha
        FROM public.eventos e
        JOIN public.tipo_eventos te USING (id_tipo_evento)
        LEFT JOIN public.cat_clasificacion_incidente ci ON ci.id_clasificacion_incidente = e.id_clasificacion_incidente
        WHERE e.id_proyecto IS NOT NULL
    """), engine)
    participantes = eventos[["id_evento", "id_proyecto", "tipo", "con_lesion", "laboral", "id_trabajador", "fecha"]].dropna().copy()
    try:
        extras = pd.read_sql(text(f"""
            SELECT et.id_evento, e.id_proyecto,
                   {SQL_TIPO} AS tipo, {SQL_CLASIFICACION},
                   et.id_trabajador,
                   COALESCE(e.fecha_ocurrencia, e.fecha_creacion)::date AS fecha
            FROM public.evento_trabajador et
            JOIN public.eventos e USING (id_evento)
            JOIN public.tipo_eventos te USING (id_tipo_evento)
            LEFT JOIN public.cat_clasificacion_incidente ci ON ci.id_clasificacion_incidente = e.id_clasificacion_incidente
        """), engine)
        participantes = pd.concat([participantes, extras], ignore_index=True)
        participantes = participantes.drop_duplicates(["id_evento", "id_proyecto", "id_trabajador"])
    except Exception:
        pass
    participantes = filtrar_objetivo(participantes, tipo_obj).copy()
    participantes["fecha"] = pd.to_datetime(participantes["fecha"])

    bases = probabilidades_proyecto or {}
    base_global = float(np.mean(list(bases.values()))) if bases else 0.05
    hoy = pd.Timestamp.today().normalize()
    trabajadores_por_proyecto = asignaciones.groupby("id_proyecto")["id_trabajador"].nunique()
    salida = []
    for (proyecto_id, cuadrilla_id), grupo in asignaciones.groupby(["id_proyecto", "id_cuadrilla"], dropna=False):
        proyecto_id = int(proyecto_id) if pd.notna(proyecto_id) else None
        miembros = grupo.dropna(subset=["id_trabajador"]).drop_duplicates("id_trabajador")
        base = float(bases.get(proyecto_id, base_global)) if proyecto_id is not None else base_global
        total_trabajadores = int(trabajadores_por_proyecto.get(proyecto_id, len(miembros))) or 1
        hazard_prior = tasa_desde_probabilidad(base, horizonte) / total_trabajadores
        predicciones_miembros = []
        historico = 0
        for _, miembro in miembros.iterrows():
            wid = int(miembro["id_trabajador"])
            filtro_trabajador = participantes["id_trabajador"] == wid
            if proyecto_id is not None:
                filtro_trabajador &= participantes["id_proyecto"] == proyecto_id
            inicio = pd.to_datetime(miembro["asignacion_inicio"], errors="coerce")
            if pd.notna(inicio):
                filtro_trabajador &= participantes["fecha"] >= inicio
            n = int(filtro_trabajador.sum())
            exposicion =max(1.0, (hoy - inicio).days / 7) if pd.notna(inicio) else 52.0
            tasa = (n + hazard_prior * 8) / (exposicion + 8)
            prob = float(np.clip(1 - np.exp(-tasa * horizonte), 0, 1))
            historico += n
            predicciones_miembros.append({
                "id_trabajador": wid,
                "nombre": con_defecto(miembro["trabajador"], f"Trabajador {wid}"),
                "cargo": con_defecto(miembro["cargo"], None),
                "historico_eventos": n,
                "semanas_exposicion_estimadas": round(exposicion, 1),
                "tasa_semanal_suavizada": round(float(tasa), 6),
                "prob_evento": round(prob, 6),
            })
        aplicar_modelo(predicciones_miembros, "id_trabajador", modelos.get("trabajador"), horizonte)
        salida.append({
            "id_proyecto": proyecto_id, "proyecto": con_defecto(grupo.iloc[0]["proyecto"], "Sin proyecto activo"),
            "id_cuadrilla": int(cuadrilla_id),
            "cuadrilla": con_defecto(grupo.iloc[0]["numero_cuadrilla"], f"Cuadrilla {int(cuadrilla_id)}"),
            "prob_evento": round(base, 6), "tipo_objetivo": tipo_obj,
            "horizonte_semanas": horizonte, "integrantes": len(predicciones_miembros),
            "historico_eventos_asociados": historico,
            "evidencia": "alta" if historico >= 20 else "media" if historico >= 5 else "baja",
            "estado_asignacion": "activa" if proyecto_id is not None else "sin_proyecto_activo",
            "miembros": predicciones_miembros,
            "factores": {"probabilidad_base_proyecto": round(base, 6),
                         "combinacion_independiente_aproximada": True,
                         "metodo": "combina el riesgo suavizado de cada integrante; no supone que los riesgos sean independientes en la realidad"},
        })

    # Con todos los integrantes calculados, el conjunto de cada proyecto no supera su riesgo.
    for proyecto_id, probabilidad in bases.items():
        integrantes = [m for c in salida if c["id_proyecto"] == proyecto_id for m in c["miembros"]]
        acotar_al_proyecto(integrantes, tasa_desde_probabilidad(probabilidad, horizonte), horizonte)
    for cuadrilla in salida:
        if cuadrilla["miembros"]:
            cuadrilla["prob_evento"] = round(
                1 - float(np.prod([1 - m["prob_evento"] for m in cuadrilla["miembros"]])), 6
            )
        cuadrilla["tasa_semanal_suavizada"] = round(float(tasa_desde_probabilidad(cuadrilla["prob_evento"], horizonte)), 6)
    aplicar_modelo(salida, "id_cuadrilla", modelos.get("cuadrilla"), horizonte)
    for proyecto_id, probabilidad in bases.items():
        acotar_al_proyecto([c for c in salida if c["id_proyecto"] == proyecto_id],
                           tasa_desde_probabilidad(probabilidad, horizonte), horizonte)
    return sorted(salida, key=lambda item: item["prob_evento"], reverse=True)


def events_obj_project(events, project_id):
    """Máscara auxiliar para mantener legible el conteo por proyecto."""
    return events["id_proyecto"] == project_id
