# Modelo predictivo de eventos

El servicio estima la probabilidad de que un proyecto, área, cuadrilla, trabajador o actividad registre al menos un evento en un plazo de 1 a 90 días. Usa tres modelos de tasa entrenados con scikit-learn y CatBoost sobre las vistas de PostgreSQL; no llama a un proveedor externo.

## Preparar PostgreSQL

Si la base ya tiene datos, ejecuta primero `php artisan migrate`: las vistas usan columnas de la migración `2026_11_05_000001`.

En una base nueva basta con `docker/postgres/AVA_BaseDatos_unificada.sql`, que ya incluye el esquema base, las vistas, la ampliación y datos de prueba (ver `docker/README.md`).

En una base existente, ejecuta los scripts en la base que usa Laravel, en este orden:

1. `database/01_vistas_modelo_predictivo.sql` después del esquema base. Crea la serie semanal, eventos unificados y variables de contexto, y agrega `eventos.severidad` si falta.
2. `database/03_ampliacion_modelo_datos.sql` para agregar las tablas y la vista opcional `v_proyecto_semana_extra`, que depende de `v_proyecto_semanas`.

Las vistas deben existir en el esquema `public`. La vista `v_proyecto_semana_extra` es opcional para el modelo, pero se crea con el script de ampliación.

## Ejecución con Docker Compose

`docker compose up --build` construye el servicio Python junto con Laravel. Configura `PREDICTIVE_DATABASE_URL` en `docker/.env` si PostgreSQL usa credenciales o base distintas a las predeterminadas. Laravel consulta el servicio interno en `http://predictive-model:8000`; puede sobrescribirse con `PREDICTIVE_MODEL_URL` en `app/.env`.

## Ejecución local con Laravel

Crea el entorno virtual una vez, desde `python/`. Las versiones fijadas se probaron con Python 3.13:

```powershell
py -3.13 -m venv venv
venv\Scripts\python -m pip install -r requirements.txt
```

Luego, `composer run dev` en `app/` levanta el servicio junto con Laravel. También se puede levantar solo:

```powershell
php artisan modelo:servir
```

El comando usa la conexión de Laravel, por lo que ambos leen la misma base, y toma el puerto de `PREDICTIVE_MODEL_URL`. Fuera de Docker, `DB_HOST` en `app/.env` debe ser `127.0.0.1`. Si `PREDICTIVE_MODEL_URL` apunta a otro host, como en Docker, el comando no levanta nada.

## Cómo funciona

En vez de un clasificador por cada objetivo, nivel y plazo, `modelos_tasa.py` entrena tres modelos:

| Modelo | Predice | Candidatos |
|---|---|---|
| A · `incidentes_reales` | Incidentes laborales esperados por semana en cada área de cada proyecto | Regresión de Poisson, gradient boosting de Poisson y CatBoost de Poisson |
| B · lesión | P(lesión \| incidente) | Regresión logística y CatBoost (log-loss) |
| C · `todos` | Eventos esperados por semana de cualquier tipo, sin Tarjetas PARE | Regresión de Poisson, gradient boosting de Poisson y CatBoost de Poisson |

- **Lesiones = A × B:** la tasa de lesiones nunca supera a la de incidentes.
- **Unidad:** proyecto-área-semana. Los eventos sin área van a un área "sin área" del proyecto, de modo que el proyecto es la suma de sus áreas. Clientes y faenas suman sus proyectos vigentes.
- **Plazos:** cualquier plazo sale de la misma tasa semanal: P = 1 − exp(−tasa × días / 7). Un plazo más largo nunca da menos riesgo, y no hace falta entrenar un modelo por plazo.
- **Datos:** une `eventos`, Reporte Previene, Reportes Flash y Hallazgos. Los informes de investigación no suman, porque documentan un incidente ya contado. Un incidente es laboral si su clasificación no es de trayecto ni común; tiene lesión si su clasificación lo indica o si registra lesiones en `evento_lesion`. Las Tarjetas PARE se usan como predictor, pero no como evento.
- **Variables:** incidentes, eventos y reportes preventivos del área y del proyecto en ventanas de 4, 13 y 26 semanas; severidad máxima; semanas desde el último incidente; tasa histórica del área; pendientes de cierre; turno noche; personas, cuadrillas y actividades asignadas; actividades de riesgo crítico; incidentes en toda la empresa; época del año; y los datos de la ampliación cuando existen (horas, clima, avance). Todas usan solo semanas anteriores a la que se predice.
- **Selección:** cada modelo compite en validación temporal (dos tramos: del 60 % al 80 % de las semanas y del 80 % al final) con una referencia: la tasa histórica de cada área, o la proporción histórica de lesiones, suavizada. Se elige por devianza de Poisson (log-loss en el modelo B) y solo se publica si mejora a la referencia en al menos 1 %; si no, se publica la referencia e informa el motivo. Se necesitan al menos 20 semanas con eventos. CatBoost es opcional: si el paquete no está instalado, sus candidatos no compiten y el resto funciona igual.
- **Cuadrillas, trabajadores y actividades** no tienen modelo propio: con pocos eventos por entidad solo aprenderían ruido. `reparto.py` les asigna una parte de la tasa del proyecto proporcional a sus eventos históricos de los últimos dos años, suavizada hacia una parte según su tamaño. Las partes nunca suman más que el proyecto.
- **Factores:** para cada proyecto y área, cuánto cambiaría la probabilidad del plazo si cada variable importante volviera a su valor típico.
- **Caché:** un solo entrenamiento sirve a los tres objetivos y a todos los plazos. Se reutiliza (en memoria y en `MODELOS_DIR`) mientras no cambien los datos ni la semana. Se entrena al arrancar el servicio; con la base de prueba tarda menos de un minuto.
- **Seguimiento:** `seguimiento.py` registra en `predicciones_registradas` la primera predicción de cada semana (plazos de 1, 2, 3, 4, 9 y 13 semanas) y la compara con lo ocurrido cuando su plazo termina.

Para ver la comparación de candidatos por consola:

```powershell
python modelos_tasa.py --db postgresql+psycopg2://usuario:clave@localhost:5432/postgres
```

Pruebas, con datos sintéticos (no necesitan base):

```powershell
python -m unittest test_modelos_tasa
```

### Comparar con Azure AutoML

`exportar_azure.py exportar` genera en `data/automl/tasa` los datasets de los tres modelos, separados por fecha en entrenamiento, validación y prueba, sin identificadores ni fechas. `exportar_azure.py evaluar` compara las predicciones de prueba de Azure con las del sistema. La configuración de Azure está en `data/automl/tasa/LEEME.md`.

```powershell
python exportar_azure.py exportar --db postgresql+psycopg2://usuario:clave@localhost:5432/postgres --salida data/automl/tasa
python exportar_azure.py evaluar --carpeta data/automl/tasa/incidentes --predicciones predictions.csv
```

## Historial real de AVA

`data/importar_logs.py` lee los logs Excel de incidentes (formatos 2021-2024, 2025 y 2026), une los archivos sin duplicar y crea `public.incidentes_historicos`. No guarda RUT, nombres ni descripciones: del texto solo extrae etiquetas de riesgo (`riesgos_texto.py`). Volver a ejecutarlo reemplaza la tabla. Los modelos actuales no usan esta tabla.

```powershell
python data\importar_logs.py log2024.xlsx log2025.xlsx log2026.xlsx --db postgresql+psycopg2://usuario:clave@localhost:5432/postgres
```

No versiones los Excel originales.

## Contrato HTTP

Los objetivos (`tipo_objetivo`) son `incidentes_reales` (predeterminado), `lesiones` y `todos`. El plazo (`horizonte_dias`) acepta 1, 2, 5, 7, 14, 21, 30 (predeterminado), 60 y 90.

- `GET /health`: comprueba la conexión con PostgreSQL.
- `GET /tipos`: los tres objetivos.
- `GET /predicciones?tipo_objetivo=incidentes_reales&horizonte_dias=30&id_proyecto=123`: probabilidad, tasa semanal y factores de cada proyecto vigente, y la calidad de cada nivel (`modelos`). Si se indica `id_proyecto`, `analisis_entidades` incluye el riesgo de sus trabajadores, trabajador por actividad, cuadrillas, actividades, áreas, factores operativos (turno, supervisor, causas, empresa, equipo), faena y cliente. `analisis_global.cuadrillas` trae las cuadrillas activas (todas, o las del proyecto indicado).
- `analisis_entidades.contexto.evento_estimado` (o `analisis_global.proximo_evento` sin `id_proyecto`) incluye el tipo, área, actividad, cuadrilla y trabajador más probables, la espera media (1 / tasa semanal), las probabilidades a 30 y 90 días y el nivel de evidencia. La fecha es una espera media, no un pronóstico exacto.
- `GET /predicciones/entidades?tipo_objetivo=lesiones&horizonte_dias=30`: todas las entidades vigentes por nivel (proyecto, área, cuadrilla, trabajador, actividad, cliente y faena), con nombre, ubicación, probabilidad, tasa semanal, factores e indicadores.
- `GET /modelo/evaluacion`: aciertos de las predicciones registradas cuyo plazo ya terminó.
- `POST /modelo/entrenar`: reentrena aunque los datos no hayan cambiado.
- `GET /docs`: documentación interactiva de FastAPI.

Laravel expone estas consultas en `/api/v1/modelo-predictivo/*` y `/api/v1/proyectos/{id}/predicciones`, y las muestra en `/modelo-predictivo` y en el detalle de cada proyecto.
