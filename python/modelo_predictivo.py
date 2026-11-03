"""
Modelo predictivo de eventos por proyecto (unidad: proyecto x semana).

Pregunta que responde: dado el estado del proyecto al inicio de la semana t,
cual es la probabilidad de que haya >= 1 evento del tipo objetivo en las
proximas H semanas (t .. t+H-1)?

Requisitos:  pip install pandas sqlalchemy psycopg2-binary scikit-learn
Antes:       ejecutar 01_vistas_modelo_predictivo.sql en la base.

Uso (PowerShell):
  $env:DATABASE_URL = "postgresql+psycopg2://USUARIO:CLAVE@localhost:5432/postgres"
  python 02_modelo_predictivo.py --tipo-objetivo tarjeta_pare --horizonte 4
  python 02_modelo_predictivo.py --tipo-objetivo todos
"""
import argparse
import os

import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

VENTANAS = (1, 4, 12)  # semanas hacia atras para features historicas


def cargar(engine):
    q = lambda sql: pd.read_sql(sql, engine)
    spine = q("SELECT id_proyecto, semana FROM public.v_proyecto_semanas")
    conteo = q("SELECT * FROM public.v_conteo_semanal_tipo")
    ctx = q("SELECT * FROM public.v_proyecto_semana_contexto")
    est = q("SELECT * FROM public.v_proyecto_estatico")
    try:  # opcional: existe solo si se ejecuto 03_ampliacion_modelo_datos.sql
        extra = q("SELECT * FROM public.v_proyecto_semana_extra")
    except Exception:
        extra = pd.DataFrame(columns=["id_proyecto", "semana"])
    for d in (spine, conteo, ctx, extra):
        d["semana"] = pd.to_datetime(d["semana"])
    est["fecha_inicio"] = pd.to_datetime(est["fecha_inicio"])
    est["fecha_termino"] = pd.to_datetime(est["fecha_termino"])
    return spine, conteo, ctx, est, extra


def armar_panel(spine, conteo, ctx, est, extra, tipo_obj, h):
    if h < 1 or h > 52:
        raise SystemExit("El horizonte debe estar entre 1 y 52 semanas.")
    if conteo.empty:
        raise SystemExit("No hay eventos con proyecto y fecha para entrenar el modelo.")
    tipos = sorted(conteo["tipo"].unique())
    if tipo_obj != "todos" and tipo_obj not in tipos:
        raise SystemExit(f"Tipo '{tipo_obj}' no existe. Disponibles: {tipos}")

    # Pivot dinamico: un tipo nuevo en la BD aparece solo como nuevas columnas
    n = conteo.pivot_table(index=["id_proyecto", "semana"], columns="tipo",
                           values="n", aggfunc="sum").add_prefix("n_")
    sev = conteo.pivot_table(index=["id_proyecto", "semana"], columns="tipo",
                             values="sev_max", aggfunc="max").add_prefix("sev_")
    sev = sev.dropna(axis=1, how="all")

    df = (spine.merge(n.reset_index(), how="left", on=["id_proyecto", "semana"])
               .merge(sev.reset_index(), how="left", on=["id_proyecto", "semana"])
               .merge(ctx, how="left", on=["id_proyecto", "semana"])
               .merge(est, how="left", on="id_proyecto")
               .merge(extra, how="left", on=["id_proyecto", "semana"])
               .sort_values(["id_proyecto", "semana"]).reset_index(drop=True))

    cols_n = [f"n_{t}" for t in tipos]
    df[cols_n] = df[cols_n].fillna(0)
    df["n_todos"] = df[cols_n].sum(axis=1)
    col_obj = "n_todos" if tipo_obj == "todos" else f"n_{tipo_obj}"

    g = df.groupby("id_proyecto")
    feats = []

    # Historial (solo semanas ANTERIORES a t: shift(1) evita fuga de datos)
    for c in cols_n + ["n_todos"]:
        for w in VENTANAS:
            f = f"{c}_u{w}s"
            df[f] = g[c].transform(lambda s, w=w: s.shift(1).rolling(w, min_periods=1).sum())
            feats.append(f)
    for c in [c for c in df.columns if c.startswith("sev_")]:
        f = f"{c}_u4s"
        df[f] = g[c].transform(lambda s: s.shift(1).rolling(4, min_periods=1).max())
        feats.append(f)

    # Semanas desde el ultimo evento objetivo
    df["_ult"] = df["semana"].where(df[col_obj] > 0)
    df["_ult"] = df.groupby("id_proyecto")["_ult"].transform(lambda s: s.shift(1).ffill())
    df["sem_desde_ultimo"] = (df["semana"] - df["_ult"]).dt.days / 7
    feats.append("sem_desde_ultimo")

    # Contexto y exposicion
    for c in ["n_cuadrillas", "n_supervisores", "n_obreros", "n_actividades", "n_areas_faena"]:
        df[c] = df[c].fillna(0)
        feats.append(c)
    df["edad_sem"] = g["semana"].transform(lambda s: (s - s.min()).dt.days / 7)
    df["mes"] = df["semana"].dt.month
    feats += ["edad_sem", "mes"]
    if (df["n_obreros"] > 0).any():
        df["eventos_u4s_por_obrero"] = df[f"{col_obj}_u4s"] / df["n_obreros"].replace(0, np.nan)
        feats.append("eventos_u4s_por_obrero")

    # Objetivo: >=1 evento objetivo en t .. t+h-1
    fut = g[col_obj].transform(lambda s: s[::-1].rolling(h, min_periods=1).sum()[::-1])
    df["y"] = (fut > 0).astype(int)
    df["sem_restantes"] = g.cumcount(ascending=False)  # semanas observadas despues de t

    # Features opcionales de la ampliacion del modelo de datos.
    # Valores de la semana REAL (horas, clima, ausentismo...) se usan de la semana
    # anterior; lo planificado (avance planificado) no necesita desfase.
    g = df.groupby("id_proyecto")
    for c in [c for c in extra.columns if c not in ("id_proyecto", "semana")]:
        if df[c].notna().sum() == 0:
            continue  # aun no hay datos cargados para esta columna
        # Avance planificado es conocido al inicio de semana; el resto son
        # observaciones de la semana y solo se pueden usar desde la semana siguiente.
        if c == "avance_planificado_pct":
            f = c
            df[f] = df[c]
        else:
            f = f"{c}_prev"
            df[f] = g[c].shift(1)
        feats.append(f)
    if "horas_hombre_prev" in df and df["horas_hombre_prev"].notna().any():
        hh4 = g["horas_hombre"].transform(lambda s: s.shift(1).rolling(4, min_periods=1).sum())
        df["eventos_por_1000h_u4s"] = df[f"{col_obj}_u4s"] / hh4.replace(0, np.nan) * 1000
        feats.append("eventos_por_1000h_u4s")

    cats = ["id_faena", "id_cliente"]
    for c in cats:
        df[c] = df[c].astype("category")
    return df, feats, cats


def evaluar(nombre, modelo, Xtr, ytr, Xte, yte):
    if Xtr.empty or Xte.empty or ytr.nunique() < 2:
        print(f"\n[{nombre}] Sin suficientes clases o filas para evaluar.")
        return None
    modelo.fit(Xtr, ytr)
    p = modelo.predict_proba(Xte)[:, 1]
    print(f"\n[{nombre}]")
    if yte.nunique() < 2:
        print("  El set de prueba tiene una sola clase; no se puede calcular AUC.")
        return modelo
    print(f"  AUC-ROC : {roc_auc_score(yte, p):.3f}")
    print(f"  AUC-PR  : {average_precision_score(yte, p):.3f}  (base = {yte.mean():.3f})")
    print(f"  Brier   : {brier_score_loss(yte, p):.3f}")
    return modelo


def tipos_disponibles(engine):
    filas = pd.read_sql(
        "SELECT DISTINCT tipo FROM public.v_conteo_semanal_tipo ORDER BY tipo", engine
    )
    return filas["tipo"].dropna().tolist()


def generar_predicciones(engine, tipo_obj="todos", horizonte=4, id_proyecto=None):
    """Entrena y devuelve probabilidades junto con los predictores de cada proyecto."""
    df, feats, cats = armar_panel(*cargar(engine), tipo_obj, horizonte)
    obs = df[df["sem_restantes"] >= horizonte - 1].copy()
    if obs["y"].nunique() < 2 or len(obs) < 100:
        raise ValueError(
            "Hay menos de 100 observaciones completas o el objetivo solo tiene una clase."
        )

    hoy = pd.Timestamp.today().normalize()
    ult = df.sort_values("semana").groupby("id_proyecto", as_index=False).tail(1)
    ult = ult[ult["fecha_termino"].isna() | (ult["fecha_termino"] >= hoy)].copy()
    if id_proyecto is not None:
        ult = ult[ult["id_proyecto"] == int(id_proyecto)]
    if ult.empty:
        return []

    columnas = feats + cats
    final = HistGradientBoostingClassifier(
        categorical_features="from_dtype", max_depth=4, learning_rate=0.05,
        max_iter=300, l2_regularization=1.0, random_state=0,
    )
    final.fit(obs[columnas], obs["y"])
    probabilidades = final.predict_proba(ult[columnas])[:, 1]
    salida = []
    for (_, fila), prob in zip(ult.iterrows(), probabilidades):
        variables = {}
        for nombre in columnas:
            valor = fila[nombre]
            if pd.isna(valor):
                valor = None
            elif isinstance(valor, (np.integer,)):
                valor = int(valor)
            elif isinstance(valor, (np.floating,)):
                valor = float(valor)
            elif isinstance(valor, pd.Timestamp):
                valor = valor.date().isoformat()
            else:
                # Convierte categorías/numpy scalars a tipos JSON nativos.
                valor = valor.item() if hasattr(valor, "item") else valor
            variables[nombre] = valor
        salida.append({
            "id_proyecto": int(fila["id_proyecto"]),
            "semana": fila["semana"].date().isoformat(),
            "prob_evento": round(float(prob), 6),
            "variables": variables,
        })
    return sorted(salida, key=lambda item: item["prob_evento"], reverse=True)


def generar_analisis_entidades(engine, id_proyecto, tipo_obj="todos", horizonte=4,
                               probabilidad_proyecto=None):
    """Estima riesgos por trabajador, actividad, cuadrilla, área y cliente.

    Usa tasas históricas suavizadas hacia la tasa del proyecto. Los vínculos de
    evento-trabajador y evento-actividad se aprovechan si están instalados.
    """
    from sqlalchemy import text

    proyecto = pd.read_sql(text("""
        SELECT p.id_proyecto, p.nombre, p.id_cliente, p.id_faena,
               p.fecha_inicio, p.fecha_termino,
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
    semanas_proyecto = max(1.0, (hoy - inicio).days / 7) if pd.notna(inicio) else 1.0
    semanas_prior = 8.0
    base = float(probabilidad_proyecto if probabilidad_proyecto is not None else 0.05)
    base = min(max(base, 0.0001), 0.9999)
    hazard_base = -np.log1p(-base) / max(horizonte, 1)

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
        SELECT e.id_evento, e.id_proyecto, {fecha_expr}::date AS fecha,
               lower(regexp_replace(trim(te.nombre), '[[:space:]]+', '_', 'g')) AS tipo,
               e.id_trabajador, {area_expr} AS id_area,
               {actividad_expr} AS id_actividad, {severidad_expr} AS severidad,
               {dimensiones_select},
               pr.id_cliente, pr.id_faena
        FROM public.eventos e
        JOIN public.tipo_eventos te USING (id_tipo_evento)
        JOIN public.proyectos pr USING (id_proyecto)
        WHERE e.id_proyecto IS NOT NULL AND {fecha_expr} IS NOT NULL
    """), engine)
    # Suma reportes e informes unificados al historial de proyecto/cliente/faena.
    # No se inventan asociaciones a personas cuando el origen no las registra.
    extras = pd.read_sql(text("""
        SELECT 'origen:' || u.origen || ':' || u.id_origen AS id_evento,
               u.id_proyecto, u.fecha, u.tipo, NULL::bigint AS id_trabajador,
               NULL::bigint AS id_area, NULL::bigint AS id_actividad,
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
    if tipo_obj != "todos":
        eventos_obj = eventos[eventos["tipo"] == tipo_obj]
    else:
        eventos_obj = eventos

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
    participantes = participantes.merge(eventos[["id_evento", "id_proyecto", "fecha", "tipo"]],
                                         on="id_evento", how="inner")
    if tipo_obj != "todos":
        participantes = participantes[participantes["tipo"] == tipo_obj]

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
        LEFT JOIN public.actividades ac ON ac.id_asignacion = a.id_asignacion
        WHERE a.id_proyecto = :id
          AND a.fecha_inicio <= CURRENT_DATE
          AND COALESCE(a.fecha_termino, 'infinity'::date) >= CURRENT_DATE
          AND (ac.id_actividad IS NULL OR
               (COALESCE(ac.fecha_inicio, a.fecha_inicio) <= CURRENT_DATE AND
                COALESCE(ac.fecha_termino, 'infinity'::date) >= CURRENT_DATE))
    """), engine, params={"id": id_proyecto})

    def riesgo(n_eventos, exposicion, soporte):
        exposicion = max(float(exposicion or 0), 0.0)
        tasa = (float(n_eventos) + hazard_base * semanas_prior) / (exposicion + semanas_prior)
        prob = 1 - np.exp(-tasa * horizonte)
        calidad = "alta" if soporte >= 20 else "media" if soporte >= 5 else "baja"
        return round(float(np.clip(prob, 0, 1)), 6), round(float(tasa), 6), calidad

    def contar(tabla, columna, valor):
        if not valor or tabla.empty or columna not in tabla:
            return 0
        return int((tabla[columna] == valor).sum())

    trabajadores = []
    for wid in sorted(asignaciones["id_trabajador"].dropna().astype(int).unique()):
        asign = asignaciones[asignaciones["id_trabajador"] == wid].iloc[0]
        n = int(((participantes["id_trabajador"] == wid) &
                 (participantes["id_proyecto"] == id_proyecto)).sum())
        n_historico_total = contar(participantes, "id_trabajador", wid)
        fecha_asig = pd.to_datetime(asign["asignacion_inicio"], errors="coerce")
        expos = max(1.0, (hoy - fecha_asig).days / 7) if pd.notna(fecha_asig) else semanas_proyecto
        prob, tasa, calidad = riesgo(n, expos, n)
        trabajadores.append({"id_trabajador": int(wid), "nombre_trabajador": asign.get("nombre_trabajador"), "cargo": asign.get("cargo"),
            "prob_evento": prob, "tipo_objetivo": tipo_obj, "horizonte_semanas": horizonte,
            "historico_eventos": n, "historico_eventos_todos_proyectos": n_historico_total,
            "semanas_exposicion_estimadas": round(expos, 1),
            "tasa_semanal_suavizada": tasa, "evidencia": calidad,
            "id_cuadrilla": int(asign["id_cuadrilla"]) if pd.notna(asign["id_cuadrilla"]) else None,
            "id_actividad": int(asign["id_actividad"]) if pd.notna(asign["id_actividad"]) else None,
            "factores": {"probabilidad_base_proyecto": round(base, 6), "eventos_historicos_asociados": n,
                         "actividad_actual": asign.get("actividad"), "metodo": "tasa histórica suavizada hacia el riesgo del proyecto"}})

    # Una predicción por trabajador y actividad actualmente asignada.
    trabajador_actividad = []
    for _, asign in asignaciones.dropna(subset=["id_trabajador", "id_actividad"]).drop_duplicates(
            ["id_trabajador", "id_actividad"]).iterrows():
        wid, aid = int(asign["id_trabajador"]), int(asign["id_actividad"])
        subset = eventos_obj[(eventos_obj["id_proyecto"] == id_proyecto) &
                             (eventos_obj["id_actividad"] == aid)]
        ids_eventos = set(subset["id_evento"].astype(int)) if not subset.empty else set()
        n = int(participantes[participantes["id_trabajador"] == wid]["id_evento"].isin(ids_eventos).sum())
        expos = max(1.0, (hoy - pd.to_datetime(asign["actividad_inicio"], errors="coerce")).days / 7) \
            if pd.notna(pd.to_datetime(asign["actividad_inicio"], errors="coerce")) else semanas_proyecto
        prob, tasa, calidad = riesgo(n, expos, n)
        trabajador_actividad.append({"id_trabajador": wid, "id_actividad": aid,
            "actividad": asign.get("actividad"), "prob_evento": prob, "tipo_objetivo": tipo_obj,
            "horizonte_semanas": horizonte, "historico_eventos": n,
            "semanas_exposicion_estimadas": round(expos, 1), "tasa_semanal_suavizada": tasa,
            "evidencia": calidad, "factores": {"eventos_del_trabajador_en_esta_actividad": n,
            "probabilidad_base_proyecto": round(base, 6), "metodo": "tasa histórica trabajador-actividad suavizada"}})

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
                         "metodo": "combinación independiente aproximada de riesgos individuales"}})

    actividades = []
    for aid, grupo in asignaciones.dropna(subset=["id_actividad"]).groupby("id_actividad"):
        aid = int(aid)
        n = int(((eventos_obj["id_proyecto"] == id_proyecto) &
                 (eventos_obj["id_actividad"] == aid)).sum()) if not eventos_obj.empty else 0
        prob, tasa, calidad = riesgo(n, semanas_proyecto, n)
        actividades.append({"id_actividad": aid, "nombre": grupo["actividad"].dropna().iloc[0]
            if grupo["actividad"].notna().any() else f"Actividad {aid}", "prob_evento": prob,
            "tipo_objetivo": tipo_obj, "horizonte_semanas": horizonte, "historico_eventos": n,
            "tasa_semanal_suavizada": tasa, "evidencia": calidad,
            "factores": {"id_asignaciones_activas": sorted(grupo["id_asignacion"].astype(int).unique().tolist()),
                         "probabilidad_base_proyecto": round(base, 6)}})

    areas_df = pd.read_sql(text("""
        SELECT id_area, codigo_area, descripcion FROM public.areas WHERE id_faena = :faena
    """), engine, params={"faena": int(p["id_faena"])}) if pd.notna(p["id_faena"]) else pd.DataFrame()
    areas = []
    for _, area in areas_df.iterrows():
        aid = int(area["id_area"])
        n = int(((eventos_obj["id_proyecto"] == id_proyecto) & (eventos_obj["id_area"] == aid)).sum()) \
            if not eventos_obj.empty else 0
        prob, tasa, calidad = riesgo(n, semanas_proyecto, n)
        areas.append({"id_area": aid, "nombre": area.get("descripcion") or area.get("codigo_area"),
            "prob_evento": prob, "tipo_objetivo": tipo_obj, "horizonte_semanas": horizonte,
            "historico_eventos": n, "tasa_semanal_suavizada": tasa, "evidencia": calidad,
            "factores": {"id_faena": int(p["id_faena"]), "probabilidad_base_proyecto": round(base, 6)}})

    dimensiones_operativas = []
    eventos_proyecto = eventos_obj[eventos_obj["id_proyecto"] == id_proyecto]
    for nombre, columna in [(f"dimension_{nombre}", f"dimension_{nombre}") for nombre in dimensiones_ids]:
        valores = eventos_proyecto[columna].dropna().value_counts() if not eventos_proyecto.empty else pd.Series(dtype=int)
        for valor, n in valores.items():
            prob, tasa, calidad = riesgo(int(n), semanas_proyecto, int(n))
            dimensiones_operativas.append({
                "dimension": nombre.replace("dimension_", ""),
                "valor": int(valor) if isinstance(valor, (int, np.integer)) else str(valor),
                "prob_evento": prob, "tipo_objetivo": tipo_obj, "horizonte_semanas": horizonte,
                "historico_eventos": int(n), "tasa_semanal_suavizada": tasa, "evidencia": calidad,
                "factores": {"id_proyecto": int(id_proyecto), "probabilidad_base_proyecto": round(base, 6),
                             "metodo": "frecuencia histórica del factor operativo suavizada hacia el riesgo del proyecto"},
            })
    if not eventos_proyecto.empty:
        valores_severidad = eventos_proyecto["severidad"].dropna().astype(str).value_counts()
        for valor, n in valores_severidad.items():
            prob, tasa, calidad = riesgo(int(n), semanas_proyecto, int(n))
            dimensiones_operativas.append({
                "dimension": "severidad", "valor": valor, "prob_evento": prob,
                "tipo_objetivo": tipo_obj, "horizonte_semanas": horizonte,
                "historico_eventos": int(n), "tasa_semanal_suavizada": tasa, "evidencia": calidad,
                "factores": {"id_proyecto": int(id_proyecto), "probabilidad_base_proyecto": round(base, 6)},
            })

    same_client = eventos[eventos["id_cliente"] == p["id_cliente"]] if pd.notna(p["id_cliente"]) else eventos.iloc[0:0]
    if tipo_obj != "todos" and not same_client.empty:
        same_client = same_client[same_client["tipo"] == tipo_obj]
    client_n = len(same_client)
    client_exposure = max(semanas_proyecto, semanas_proyecto * max(1, same_client["id_proyecto"].nunique()))
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

    same_faena = eventos[eventos["id_faena"] == p["id_faena"]] if pd.notna(p["id_faena"]) else eventos.iloc[0:0]
    if tipo_obj != "todos" and not same_faena.empty:
        same_faena = same_faena[same_faena["tipo"] == tipo_obj]
    faena_n = len(same_faena)
    faena_projects = int(same_faena["id_proyecto"].nunique()) if not same_faena.empty else 0
    faena_exposure = max(semanas_proyecto, semanas_proyecto * max(1, faena_projects))
    faena_prob, faena_rate, faena_quality = riesgo(faena_n, faena_exposure, faena_n)
    faena = {"id_faena": int(p["id_faena"]) if pd.notna(p["id_faena"]) else None,
        "nombre": p.get("faena"),
        "prob_evento": faena_prob, "tipo_objetivo": tipo_obj, "horizonte_semanas": horizonte,
        "historico_eventos": faena_n, "proyectos_historicos": faena_projects,
        "semanas_exposicion_estimadas": round(faena_exposure, 1),
        "tasa_semanal_suavizada": faena_rate, "evidencia": faena_quality,
        "factores": {"probabilidad_base_proyecto": round(base, 6),
                     "eventos_en_proyectos_de_la_faena": faena_n,
                     "metodo": "historial de la faena suavizado hacia el riesgo del proyecto"}}

    eventos_proyecto_todos = eventos[eventos["id_proyecto"] == id_proyecto]
    distribucion_tipos = eventos_proyecto_todos["tipo"].value_counts() if not eventos_proyecto_todos.empty else pd.Series(dtype=int)
    tipos_historicos = [
        {"tipo": str(nombre), "eventos": int(total)}
        for nombre, total in distribucion_tipos.head(5).items()
    ]
    if tipo_obj == "todos":
        tipo_predicho = str(distribucion_tipos.index[0]) if not distribucion_tipos.empty else None
        eventos_tipo_predicho = int(distribucion_tipos.iloc[0]) if not distribucion_tipos.empty else 0
    else:
        tipo_predicho = tipo_obj
        eventos_tipo_predicho = int((eventos_proyecto_todos["tipo"] == tipo_obj).sum()) if not eventos_proyecto_todos.empty else 0
    area_probable = areas[0] if areas else None
    actividad_probable = actividades[0] if actividades else None
    trabajador_probable = trabajadores[0] if trabajadores else None
    cuadrilla_probable = cuadrillas[0] if cuadrillas else None
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


def generar_predicciones_historicas(engine, tipo_obj="todos", horizonte=4):
    """Respaldo interpretable para proyectos cuando el clasificador no tiene datos suficientes."""
    proyectos = pd.read_sql("""
        SELECT id_proyecto, nombre, fecha_inicio,
               LEAST(COALESCE(fecha_termino, CURRENT_DATE), CURRENT_DATE) AS fecha_fin
        FROM public.proyectos
        WHERE fecha_inicio IS NOT NULL
    """, engine)
    conteos = pd.read_sql("""
        SELECT id_proyecto, tipo, count(*) AS eventos
        FROM public.v_eventos_unificados
        WHERE id_proyecto IS NOT NULL
        GROUP BY id_proyecto, tipo
    """, engine)
    if tipo_obj != "todos":
        conteos = conteos[conteos["tipo"] == tipo_obj]
    por_proyecto = conteos.groupby("id_proyecto")["eventos"].sum() if not conteos.empty else pd.Series(dtype=float)
    hoy = pd.Timestamp.today().normalize()
    proyectos["exposicion_semanas"] = (
        (pd.to_datetime(proyectos["fecha_fin"]) - pd.to_datetime(proyectos["fecha_inicio"])).dt.days / 7
    ).clip(lower=1)
    total_exposicion = float(proyectos["exposicion_semanas"].sum()) if not proyectos.empty else 1.0
    hazard_prior = max(float(por_proyecto.sum()) / max(total_exposicion, 1), 0.0001)
    resultados = []
    for _, proyecto in proyectos.iterrows():
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


def generar_predicciones_cuadrillas(engine, horizonte=4, tipo_obj="todos",
                                    probabilidades_proyecto=None, id_proyecto=None):
    """Calcula riesgo para cada cuadrilla actualmente asignada a proyectos vigentes."""
    from sqlalchemy import text

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

    eventos = pd.read_sql(text("""
        SELECT e.id_evento, e.id_proyecto,
               lower(regexp_replace(trim(te.nombre), '[[:space:]]+', '_', 'g')) AS tipo,
               e.id_trabajador
        FROM public.eventos e
        JOIN public.tipo_eventos te USING (id_tipo_evento)
        WHERE e.id_proyecto IS NOT NULL
    """), engine)
    participantes = eventos[["id_evento", "id_proyecto", "tipo", "id_trabajador"]].dropna().copy()
    try:
        extras = pd.read_sql(text("""
            SELECT et.id_evento, e.id_proyecto,
                   lower(regexp_replace(trim(te.nombre), '[[:space:]]+', '_', 'g')) AS tipo,
                   et.id_trabajador
            FROM public.evento_trabajador et
            JOIN public.eventos e USING (id_evento)
            JOIN public.tipo_eventos te USING (id_tipo_evento)
        """), engine)
        participantes = pd.concat([participantes, extras], ignore_index=True)
        participantes = participantes.drop_duplicates(["id_evento", "id_proyecto", "id_trabajador"])
    except Exception:
        pass
    if tipo_obj != "todos":
        participantes = participantes[participantes["tipo"] == tipo_obj]

    bases = probabilidades_proyecto or {}
    base_global = float(np.mean(list(bases.values()))) if bases else 0.05
    hoy = pd.Timestamp.today().normalize()
    salida = []
    for (proyecto_id, cuadrilla_id), grupo in asignaciones.groupby(["id_proyecto", "id_cuadrilla"], dropna=False):
        proyecto_id = int(proyecto_id) if pd.notna(proyecto_id) else None
        miembros = grupo.dropna(subset=["id_trabajador"]).drop_duplicates("id_trabajador")
        base = float(bases.get(proyecto_id, base_global)) if proyecto_id is not None else base_global
        hazard_prior = -np.log1p(-min(max(base, 0.0001), 0.9999)) / max(horizonte, 1)
        predicciones_miembros = []
        historico = 0
        for _, miembro in miembros.iterrows():
            wid = int(miembro["id_trabajador"])
            filtro_trabajador = participantes["id_trabajador"] == wid
            if proyecto_id is not None:
                filtro_trabajador &= participantes["id_proyecto"] == proyecto_id
            n = int(filtro_trabajador.sum())
            inicio = pd.to_datetime(miembro["asignacion_inicio"], errors="coerce")
            exposicion = max(1.0, (hoy - inicio).days / 7) if pd.notna(inicio) else 52.0
            tasa = (n + hazard_prior * 8) / (exposicion + 8)
            prob = float(np.clip(1 - np.exp(-tasa * horizonte), 0, 1))
            historico += n
            predicciones_miembros.append({
                "id_trabajador": wid,
                "nombre": miembro["trabajador"] or f"Trabajador {wid}",
                "cargo": miembro["cargo"],
                "historico_eventos": n,
                "semanas_exposicion_estimadas": round(exposicion, 1),
                "prob_evento": round(prob, 6),
            })
        prob_cuadrilla = 1 - float(np.prod([1 - x["prob_evento"] for x in predicciones_miembros])) \
            if predicciones_miembros else base
        salida.append({
            "id_proyecto": proyecto_id, "proyecto": grupo.iloc[0]["proyecto"] or "Sin proyecto activo",
            "id_cuadrilla": int(cuadrilla_id),
            "cuadrilla": grupo.iloc[0]["numero_cuadrilla"] or f"Cuadrilla {int(cuadrilla_id)}",
            "prob_evento": round(float(prob_cuadrilla), 6), "tipo_objetivo": tipo_obj,
            "horizonte_semanas": horizonte, "integrantes": len(predicciones_miembros),
            "historico_eventos_asociados": historico,
            "evidencia": "alta" if historico >= 20 else "media" if historico >= 5 else "baja",
            "estado_asignacion": "activa" if proyecto_id is not None else "sin_proyecto_activo",
            "miembros": predicciones_miembros,
            "factores": {"probabilidad_base_proyecto": round(base, 6),
                         "combinacion_independiente_aproximada": True,
                         "metodo": "combina el riesgo suavizado de cada integrante; no supone que los riesgos sean independientes en la realidad"},
        })
    return sorted(salida, key=lambda item: item["prob_evento"], reverse=True)


def events_obj_project(events, project_id):
    """Máscara auxiliar para mantener legible el conteo por proyecto."""
    return events["id_proyecto"] == project_id


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tipo-objetivo", default="tarjeta_pare",
                    help="nombre normalizado del tipo (o 'todos')")
    ap.add_argument("--horizonte", type=int, default=4, help="semanas a predecir")
    ap.add_argument("--db", default=os.getenv("DATABASE_URL"))
    ap.add_argument("--salida", default="predicciones_proyectos.csv")
    ap.add_argument("--solo-prediccion", action="store_true",
                    help="omite la evaluacion temporal para integraciones")
    a = ap.parse_args()
    if not a.db:
        raise SystemExit("Define DATABASE_URL o usa --db")

    engine = create_engine(a.db)
    if a.solo_prediccion:
        import json
        print(json.dumps({
            "tipo_objetivo": a.tipo_objetivo,
            "horizonte": a.horizonte,
            "unidad_analisis": "proyecto-semana",
            "evento": "al menos un evento del tipo objetivo dentro del horizonte",
            "predicciones": generar_predicciones(
                engine, a.tipo_objetivo, a.horizonte
            ),
        }))
        return

    df, feats, cats = armar_panel(*cargar(engine), a.tipo_objetivo, a.horizonte)

    # Solo filas cuyo horizonte completo ya fue observado
    obs = df[df["sem_restantes"] >= a.horizonte - 1].copy()
    print(f"Filas proyecto-semana: {len(obs)} | proyectos: {obs['id_proyecto'].nunique()}"
          f" | prevalencia de y=1: {obs['y'].mean():.3f}")
    if obs["y"].nunique() < 2 or len(obs) < 100:
        raise SystemExit("Muy pocos datos o una sola clase: revisa tipo objetivo y datos cargados.")

    # Validacion TEMPORAL: entrena con el pasado, prueba con el futuro
    corte = obs["semana"].quantile(0.8)
    # Se deja una brecha de h semanas para que el objetivo del train no solape el test
    tr = obs[obs["semana"] < corte - pd.Timedelta(weeks=a.horizonte)]
    te = obs[obs["semana"] >= corte]
    print(f"Train hasta {corte.date()} ({len(tr)} filas) | Test desde {corte.date()} ({len(te)} filas)")

    num = [f for f in feats if f not in cats]
    evaluar("Regresion logistica (base)",
            make_pipeline(SimpleImputer(strategy="median"), StandardScaler(),
                          LogisticRegression(max_iter=1000, class_weight="balanced")),
            tr[num], tr["y"], te[num], te["y"])

    gb = HistGradientBoostingClassifier(categorical_features="from_dtype", max_depth=4,
                                        learning_rate=0.05, max_iter=300,
                                        l2_regularization=1.0, random_state=0)
    gb = evaluar("Gradient boosting", gb, tr[num + cats], tr["y"], te[num + cats], te["y"])

    # Prediccion actual: semana mas reciente de cada proyecto vigente
    hoy = pd.Timestamp.today().normalize()
    ult = df.sort_values("semana").groupby("id_proyecto").tail(1)
    ult = ult[ult["fecha_termino"].isna() | (ult["fecha_termino"] >= hoy)].copy()
    final = HistGradientBoostingClassifier(categorical_features="from_dtype", max_depth=4,
                                           learning_rate=0.05, max_iter=300,
                                           l2_regularization=1.0, random_state=0)
    final.fit(obs[num + cats], obs["y"])
    ult["prob_evento"] = final.predict_proba(ult[num + cats])[:, 1]
    ult[["id_proyecto", "semana", "prob_evento"]].sort_values("prob_evento", ascending=False) \
        .to_csv(a.salida, index=False)
    print(f"\nPredicciones ({a.horizonte} semanas) guardadas en {a.salida}")


if __name__ == "__main__":
    main()
