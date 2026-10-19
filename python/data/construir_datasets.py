import os
import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/postgres",
)
HORIZONTES = (7, 30)     # dias hacia adelante para las etiquetas
PASO_DIAS = 7            # un corte por semana
SIN_LIMITE = 20000       # "desde siempre" en dias
FIN_ABIERTO = pd.Timestamp("2100-01-01")

eng = create_engine(DB_URL)


def leer(sql, fechas=()):
    df = pd.read_sql(sql, eng)
    for c in fechas:
        df[c] = pd.to_datetime(df[c])
    return df


# ---------------------------------------------------------------- carga
ev = leer("""SELECT id_evento, id_trabajador, id_proyecto, id_tipo_evento, severidad,
                    fecha_creacion, fecha_cierre FROM eventos""",
          ["fecha_creacion", "fecha_cierre"])
ev["fecha"] = ev.fecha_creacion.dt.normalize()
ev["fecha_cierre"] = ev.fecha_cierre.dt.normalize()

mem = leer("""SELECT id_trabajador, id_cuadrilla, fecha_inicio, fecha_fin
              FROM trabajadores_cuadrillas""", ["fecha_inicio", "fecha_fin"])
mem["fecha_fin"] = mem.fecha_fin.fillna(FIN_ABIERTO)

asg = leer("""SELECT id_cuadrilla, id_proyecto, fecha_inicio, fecha_termino
              FROM asignaciones""", ["fecha_inicio", "fecha_termino"])

pro = leer("""SELECT id_proyecto, id_faena, id_cliente, fecha_inicio, fecha_termino
              FROM proyectos""", ["fecha_inicio", "fecha_termino"])
pro = pro.rename(columns={"fecha_inicio": "p_inicio", "fecha_termino": "p_termino"})

tra = leer("SELECT id_trabajador, cargo FROM trabajadores")

# Cortes semanales. El ultimo corte deja espacio para el horizonte mas largo,
# si no las etiquetas finales serian 0 solo porque el futuro aun no existe.
t_ini = asg.fecha_inicio.min()
t_fin = ev.fecha.max() - pd.Timedelta(days=max(HORIZONTES))
cortes = pd.DataFrame({"t": pd.date_range(t_ini, t_fin, freq=f"{PASO_DIAS}D")})


# ------------------------------------------------- utilidades de ventanas
def fechas_por(df, clave, col="fecha"):
    """{id: fechas ordenadas (datetime64)}"""
    return {k: np.sort(g[col].dropna().values) for k, g in df.groupby(clave)}


def contar(exp, fechas, clave, desde, hasta):
    """Eventos con t+desde <= fecha < t+hasta (en dias), por fila de exp."""
    out = np.zeros(len(exp), dtype=int)
    t_all = exp["t"].values
    for k, idx in exp.groupby(clave).indices.items():
        arr = fechas.get(k)
        if arr is None:
            continue
        t = t_all[idx]
        lo = np.searchsorted(arr, t + np.timedelta64(desde, "D"), side="left")
        hi = np.searchsorted(arr, t + np.timedelta64(hasta, "D"), side="left")
        out[idx] = hi - lo
    return out


def dias_desde_ultimo(exp, fechas, clave):
    out = np.full(len(exp), np.nan)
    t_all = exp["t"].values
    for k, idx in exp.groupby(clave).indices.items():
        arr = fechas.get(k)
        if arr is None:
            continue
        t = t_all[idx]
        pos = np.searchsorted(arr, t, side="left") - 1
        ok = pos >= 0
        res = np.full(len(idx), np.nan)
        res[ok] = (t[ok] - arr[pos[ok]]) / np.timedelta64(1, "D")
        out[idx] = res
    return out


def diccionarios(df, clave):
    return (
        fechas_por(df, clave),
        fechas_por(df[df.severidad == "Alta"], clave),
        fechas_por(df.dropna(subset=["fecha_cierre"]), clave, "fecha_cierre"),
    )


def agregar_historia(exp, clave, dicts):
    """Caracteristicas: SOLO eventos con fecha < t (sin fuga)."""
    fechas, alta, cierres = dicts
    for d in (7, 30, 90):
        exp[f"ev_{d}d"] = contar(exp, fechas, clave, -d, 0)
    exp["ev_total"] = contar(exp, fechas, clave, -SIN_LIMITE, 0)
    exp["dias_desde_ultimo"] = dias_desde_ultimo(exp, fechas, clave)
    exp["alta_90d"] = contar(exp, alta, clave, -90, 0)
    # abiertos en t = creados antes de t - cerrados antes de t
    exp["abiertos"] = exp["ev_total"] - contar(exp, cierres, clave, -SIN_LIMITE, 0)


def agregar_etiquetas(exp, clave, dicts):
    """Etiquetas: eventos con t <= fecha < t+H (miran al futuro)."""
    fechas = dicts[0]
    for h in HORIZONTES:
        n = contar(exp, fechas, clave, 0, h)
        exp[f"n_eventos_{h}d"] = n
        exp[f"y_{h}d"] = (n > 0).astype(int)


# ------------------------------------------------------ panel trabajador
def panel_trabajador():
    base = mem.merge(asg, on="id_cuadrilla", suffixes=("_m", "_a"))
    base["ini"] = base[["fecha_inicio_m", "fecha_inicio_a"]].max(axis=1)
    base["fin"] = base[["fecha_fin", "fecha_termino"]].min(axis=1)
    base = base[base.ini <= base.fin]

    exp = base.merge(cortes, how="cross")
    exp = exp[(exp.t >= exp.ini) & (exp.t <= exp.fin)]          # solo si esta expuesto
    exp = exp.drop_duplicates(["id_trabajador", "t"]).reset_index(drop=True)
    exp = exp.merge(pro, on="id_proyecto", how="left").merge(tra, on="id_trabajador", how="left")

    exp["dias_en_cuadrilla"] = (exp.t - exp.fecha_inicio_m).dt.days
    exp["dias_en_asignacion"] = (exp.t - exp.fecha_inicio_a).dt.days
    exp["dias_desde_inicio_proy"] = (exp.t - exp.p_inicio).dt.days
    dur = (exp.p_termino - exp.p_inicio).dt.days.clip(lower=1)
    exp["avance_proyecto"] = (exp.dias_desde_inicio_proy / dur).clip(0, 1)
    exp["mes"] = exp.t.dt.month
    exp["semana"] = exp.t.dt.isocalendar().week.astype(int)

    d = diccionarios(ev, "id_trabajador")
    agregar_historia(exp, "id_trabajador", d)
    agregar_etiquetas(exp, "id_trabajador", d)
    # Nota: trabajadores.fecha_creacion es la fecha del registro, no de contratacion,
    # por eso no se usa como "antiguedad".
    return exp


# -------------------------------------------------------- panel cuadrilla
def panel_cuadrilla(trab):
    exp = (trab.groupby(["id_cuadrilla", "id_proyecto", "t"])
           .agg(tamano=("id_trabajador", "size"),
                max_ev_trab_90d=("ev_90d", "max"),
                prom_ev_trab_90d=("ev_90d", "mean"),
                dias_en_asignacion=("dias_en_asignacion", "first"),
                avance_proyecto=("avance_proyecto", "first"))
           .reset_index())
    exp["mes"] = exp.t.dt.month
    exp["semana"] = exp.t.dt.isocalendar().week.astype(int)

    # Cuadrilla del evento = membresia del trabajador en la fecha del evento
    evc = ev.merge(mem, on="id_trabajador")
    evc = evc[(evc.fecha >= evc.fecha_inicio) & (evc.fecha <= evc.fecha_fin)]

    d = diccionarios(evc, "id_cuadrilla")
    agregar_historia(exp, "id_cuadrilla", d)
    agregar_etiquetas(exp, "id_cuadrilla", d)
    exp["ev_30d_por_miembro"] = exp.ev_30d / exp.tamano
    return exp


# --------------------------------------------------------- panel proyecto
def panel_proyecto(trab):
    exp = (trab.groupby(["id_proyecto", "t"])
           .agg(n_cuadrillas=("id_cuadrilla", "nunique"),
                n_trabajadores=("id_trabajador", "nunique"),
                id_faena=("id_faena", "first"),
                id_cliente=("id_cliente", "first"),
                avance_proyecto=("avance_proyecto", "first"),
                dias_desde_inicio_proy=("dias_desde_inicio_proy", "first"))
           .reset_index())
    exp["mes"] = exp.t.dt.month
    exp["semana"] = exp.t.dt.isocalendar().week.astype(int)

    d = diccionarios(ev, "id_proyecto")
    agregar_historia(exp, "id_proyecto", d)
    agregar_etiquetas(exp, "id_proyecto", d)
    exp["ev_30d_por_trabajador"] = exp.ev_30d / exp.n_trabajadores
    return exp


# --------------------------------------------------------------- modelado
def entrenar(df, features, y, nombre, purga):
    df = df.sort_values("t").reset_index(drop=True)
    X = pd.get_dummies(df[features], dtype=int)
    if "ev_total" in X:
        X["sin_eventos_previos"] = (X.ev_total == 0).astype(int)

    ts = np.sort(df.t.unique())
    t_corte = pd.Timestamp(ts[int(len(ts) * 0.7)])
    # Purga: el ultimo t de train mira `purga` dias adelante; debe terminar antes de validacion
    m_tr = df.t <= t_corte - pd.Timedelta(days=purga)
    m_va = df.t > t_corte

    Xtr, ytr, Xva, yva = X[m_tr], df.loc[m_tr, y], X[m_va], df.loc[m_va, y]
    print(f"\n=== {nombre} | {y} ===")
    print(f"train={len(Xtr)} (tasa {ytr.mean():.1%}) | valid={len(Xva)} (tasa {yva.mean():.1%})")
    if ytr.nunique() < 2 or yva.nunique() < 2:
        print("  sin ambas clases en train/valid: faltan datos")
        return

    modelos = {
        "logistica": make_pipeline(SimpleImputer(strategy="median"), StandardScaler(),
                                   LogisticRegression(max_iter=2000, class_weight="balanced")),
        "hist_gb": HistGradientBoostingClassifier(max_depth=4, learning_rate=0.05,
                                                  max_iter=200, class_weight="balanced",
                                                  random_state=0),
    }
    print(f"  referencia PR-AUC azar = {yva.mean():.3f}")
    for n, mod in modelos.items():
        mod.fit(Xtr, ytr)
        p = mod.predict_proba(Xva)[:, 1]
        print(f"  {n:10s} PR-AUC={average_precision_score(yva, p):.3f}  "
              f"ROC-AUC={roc_auc_score(yva, p):.3f}")


if __name__ == "__main__":
    trab = panel_trabajador()
    cuad = panel_cuadrilla(trab)
    proy = panel_proyecto(trab)

    trab.to_csv("dataset_trabajador.csv", index=False)
    cuad.to_csv("dataset_cuadrilla.csv", index=False)
    proy.to_csv("dataset_proyecto.csv", index=False)
    print(f"filas: trabajador={len(trab)}, cuadrilla={len(cuad)}, proyecto={len(proy)}")

    f_trab = ["ev_7d", "ev_30d", "ev_90d", "ev_total", "dias_desde_ultimo", "alta_90d",
              "abiertos", "dias_en_cuadrilla", "dias_en_asignacion", "avance_proyecto",
              "mes", "semana", "cargo"]
    f_cuad = ["tamano", "ev_7d", "ev_30d", "ev_90d", "ev_total", "dias_desde_ultimo",
              "alta_90d", "abiertos", "max_ev_trab_90d", "prom_ev_trab_90d",
              "ev_30d_por_miembro", "dias_en_asignacion", "avance_proyecto", "mes", "semana"]
    f_proy = ["n_cuadrillas", "n_trabajadores", "ev_7d", "ev_30d", "ev_90d", "ev_total",
              "dias_desde_ultimo", "alta_90d", "abiertos", "ev_30d_por_trabajador",
              "avance_proyecto", "dias_desde_inicio_proy", "mes", "semana"]

    for h in HORIZONTES:
        entrenar(trab, f_trab, f"y_{h}d", "TRABAJADOR", h)
        entrenar(cuad, f_cuad, f"y_{h}d", "CUADRILLA", h)
        entrenar(proy, f_proy, f"y_{h}d", "PROYECTO", h)