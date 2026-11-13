"""Lanza un trabajo de AutoML (clasificacion) en Azure ML por cada dataset exportado.

Busca bajo data/automl las carpetas con resumen.json y sus tramos entrenamiento, validacion y prueba
(cada uno con su MLTable), las sube y crea un experimento por origen. El cluster de computo se crea
si no existe y se apaga solo cuando no hay trabajos.

Los datasets con datos reales de AVA (carpeta "reales") se saltan salvo que se pase --incluir-reales:
subirlos a la nube requiere la autorizacion de AVA.

Requisitos (fuera del contenedor):  pip install azure-ai-ml azure-identity
Autenticacion:                      az login   (o el navegador que abre DefaultAzureCredential)

Uso:
  python lanzar_automl.py --simular                     # muestra lo que haria, sin conectarse
  python lanzar_automl.py --config config.json          # config.json se descarga desde Azure ML Studio
  python lanzar_automl.py --config config.json --solo falsos --minutos 30
"""
import argparse
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent / "data" / "automl"
TRAMOS = ("entrenamiento", "validacion", "prueba")
CARPETA_REALES = "reales"


def buscar_datasets(raiz=RAIZ):
    """Cada dataset: su carpeta, la columna objetivo y un nombre corto para Azure."""
    datasets = []
    for resumen in sorted(raiz.rglob("resumen.json")):
        carpeta = resumen.parent
        if not all((carpeta / t / "MLTable").exists() for t in TRAMOS):
            continue
        datos = json.loads(resumen.read_text(encoding="utf-8"))
        relativa = carpeta.relative_to(raiz)
        partes = relativa.parts
        origen = partes[0] if len(partes) > 1 else "simulados"
        if origen == "externos":
            origen, partes = partes[1], partes[1:]
        nombre = re.sub(r"[^a-z0-9-]", "-", "-".join(partes).lower())
        datasets.append({
            "carpeta": carpeta, "origen": origen, "nombre": nombre if origen != "simulados" else f"simulados-{nombre}",
            "objetivo": datos["columna_objetivo"], "real": CARPETA_REALES in partes or origen == CARPETA_REALES,
            "filas": {t: datos["tramos"][t]["filas"] for t in TRAMOS},
            # Binario: positivos por tramo. Multiclase: el conteo de cada clase.
            "positivos": {t: datos["tramos"][t].get("eventos") for t in TRAMOS},
            "clases": {t: datos["tramos"][t].get("clases") for t in TRAMOS},
        })
    return datasets


def utilizable(d):
    """AutoML necesita ambas clases en entrenamiento y filas en validacion y prueba."""
    if d["filas"]["validacion"] == 0 or d["filas"]["prueba"] == 0:
        return "validación o prueba vacía"
    if d["clases"]["entrenamiento"]:
        return None if min(d["clases"]["entrenamiento"].values()) >= 10 else "una clase con menos de 10 ejemplos en entrenamiento"
    if d["positivos"]["entrenamiento"] < 10 or d["filas"]["entrenamiento"] - d["positivos"]["entrenamiento"] < 10:
        return "menos de 10 ejemplos de alguna clase en entrenamiento"
    return None


def crear_cluster(ml_client, nombre, tamano, maximo):
    from azure.ai.ml.entities import AmlCompute

    try:
        return ml_client.compute.get(nombre)
    except Exception:
        cluster = AmlCompute(name=nombre, size=tamano, min_instances=0, max_instances=maximo,
                             idle_time_before_scale_down=300, tier="dedicated")
        return ml_client.compute.begin_create_or_update(cluster).result()


def lanzar(ml_client, d, cluster, minutos):
    from azure.ai.ml import Input, automl
    from azure.ai.ml.constants import AssetTypes

    tramo = lambda t: Input(type=AssetTypes.MLTABLE, path=str(d["carpeta"] / t))
    trabajo = automl.classification(
        compute=cluster, experiment_name=f"ava-{d['origen']}".lower().replace("_", "-"),
        training_data=tramo("entrenamiento"), validation_data=tramo("validacion"), test_data=tramo("prueba"),
        target_column_name=d["objetivo"], primary_metric="AUC_weighted",
        enable_model_explainability=True, display_name=d["nombre"],
    )
    # Pocas filas: modelos simples bastan y evitan gastar computo en redes profundas.
    trabajo.set_limits(timeout_minutes=minutos, trial_timeout_minutes=10, max_trials=40,
                       max_concurrent_trials=2, enable_early_termination=True)
    trabajo.set_featurization(mode="auto")
    return ml_client.jobs.create_or_update(trabajo)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--config", default="config.json", help="config.json del espacio de trabajo")
    ap.add_argument("--simular", action="store_true", help="lista los trabajos sin conectarse a Azure")
    ap.add_argument("--solo", help="lanza solo los datasets cuyo nombre contenga este texto")
    ap.add_argument("--incluir-reales", action="store_true", help="sube tambien los datos reales de AVA")
    ap.add_argument("--cluster", default="cpu-automl")
    ap.add_argument("--tamano", default="Standard_DS3_v2", help="tamano de maquina del cluster")
    ap.add_argument("--maximo", type=int, default=2, help="maximo de nodos del cluster")
    ap.add_argument("--minutos", type=int, default=45, help="tiempo maximo por trabajo")
    a = ap.parse_args()

    planes = []
    for d in buscar_datasets():
        if a.solo and a.solo not in d["nombre"]:
            continue
        motivo = utilizable(d)
        if d["real"] and not a.incluir_reales:
            motivo = "datos reales de AVA: usa --incluir-reales cuando AVA lo autorice"
        planes.append((d, motivo))
        filas = "/".join(str(d["filas"][t]) for t in TRAMOS)
        print(f"{'OMITIDO' if motivo else 'LANZAR '}  {d['nombre']:<42} objetivo={d['objetivo']:<7} filas={filas:<18} {motivo or ''}")
    lanzables = [d for d, motivo in planes if not motivo]
    print(f"\n{len(lanzables)} trabajos por lanzar.")
    if a.simular or not lanzables:
        return

    from azure.ai.ml import MLClient
    from azure.identity import DefaultAzureCredential

    ml_client = MLClient.from_config(credential=DefaultAzureCredential(), path=a.config)
    crear_cluster(ml_client, a.cluster, a.tamano, a.maximo)
    for d in lanzables:
        trabajo = lanzar(ml_client, d, a.cluster, a.minutos)
        print(f"{d['nombre']}: {trabajo.studio_url}")


if __name__ == "__main__":
    main()
