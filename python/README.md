# Modelo predictivo semanal por proyecto

El servicio estima la probabilidad de que un proyecto registre uno o más eventos de un tipo dentro de las próximas semanas. Usa las vistas PostgreSQL y el clasificador HistGradientBoosting; no llama a un proveedor externo.

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

`motor_riesgo.py` entrena un modelo por cada tipo de entidad: proyecto, área, cuadrilla, trabajador y actividad. Con el historial real también entrena uno por cliente.

- **Objetivos:** `incidentes_reales` excluye clasificaciones no laborales (trayecto, común) y `lesiones` predice solo incidentes con lesión. Los tipos de incidente se toman de `tipo_eventos.es_incidente`.
- **Datos:** une `eventos`, Reporte Previene, Reportes Flash y Hallazgos. Los informes de investigación no suman porque documentan un incidente ya contado.
- **Variables (más de 50 por entidad):** incidentes y reportes en ventanas de 1 a 26 semanas, tendencia, semanas desde el último incidente, tasa histórica, pendientes de cierre, razón preventivo/reactivo, severidad, condiciones PARE y su repetición, turno noche, riesgos detectados en el texto, personas expuestas, época del año, incidentes del proyecto y de la empresa, y los datos de la ampliación cuando existen (horas, clima, avance). Todas usan solo semanas anteriores a la predicción.
- **Selección:** compara regresión logística, gradient boosting y bosque aleatorio con validación temporal en tres tramos, y elige el de menor log-loss. Si ninguno supera a la tasa histórica de cada entidad, publica esa tasa.
- **Requisitos:** al menos 20 filas positivas, 20 negativas y 3 entidades. Sin ellos, el nivel usa el estimador suavizado de `modelo_predictivo.py` e informa el motivo.
- **Calibración y explicación:** calibra las probabilidades con predicciones fuera de muestra y entrega los factores que más mueven cada predicción.
- **Caché:** reutiliza lo entrenado mientras no cambien los datos ni la semana. El objetivo y horizonte predeterminados se entrenan al arrancar. El primer entrenamiento de otra combinación puede tardar varios minutos.

Para ver la comparación por consola o exportar los datasets en CSV:

```powershell
python motor_riesgo.py --db postgresql+psycopg2://usuario:clave@localhost:5432/postgres --horizonte 4
python motor_riesgo.py --db postgresql+psycopg2://usuario:clave@localhost:5432/postgres --exportar datasets
```

## Historial real de AVA

`data/importar_logs.py` lee los logs Excel de incidentes (formatos 2021-2024, 2025 y 2026), une los archivos sin duplicar y crea `public.incidentes_historicos`. No guarda RUT, nombres ni descripciones: del texto solo extrae etiquetas de riesgo. Volver a ejecutarlo reemplaza la tabla.

```powershell
python data\importar_logs.py log2024.xlsx log2025.xlsx log2026.xlsx --db postgresql+psycopg2://usuario:clave@localhost:5432/postgres
```

No versiones los Excel originales.

## Contrato HTTP

- `POST /modelo/entrenar`: reentrena aunque los datos no hayan cambiado.
- `GET /predicciones/entidades?tipo_objetivo=incidentes_reales&horizonte=4`: todas las entidades vigentes por nivel (proyecto, área, cuadrilla, trabajador, actividad, cliente y faena) con nombre, ubicación, riesgo, factores e indicadores, más la calidad de cada modelo.
- `GET /modelo/evaluacion`: compara las predicciones registradas con lo ocurrido, cuando su plazo ya terminó.

- `GET /health`: comprueba conexión con PostgreSQL.
- `GET /tipos`: devuelve `incidentes_reales`, `todos` y los tipos encontrados en los datos.
  `incidentes_reales` (predeterminado) agrupa accidentes, incidentes y Reportes Flash; los hallazgos, Previene y Tarjetas PARE quedan solo como predictores. Ningún total cuenta `informe_investigacion`, porque documenta un incidente ya contado por su Reporte Flash.
- `GET /predicciones?tipo_objetivo=incidentes_reales&horizonte=4&id_proyecto=123`: devuelve la probabilidad y la semana base del proyecto, las variables usadas por el clasificador y, al indicar un proyecto, el análisis predictivo por trabajador, trabajador-actividad, configuración de cuadrilla, actividad, área, faena y cliente. El horizonte acepta de 1 a 52 semanas.

La misma respuesta incluye `analisis_global.cuadrillas` con la probabilidad de cada cuadrilla activa; omitir `id_proyecto` devuelve todas las cuadrillas de todos los proyectos vigentes, y enviarlo filtra ese listado al proyecto indicado. El bloque `predicciones` conserva el ranking de todos los proyectos para la vista comparativa.

`analisis_entidades.contexto.evento_estimado` (o `analisis_global.proximo_evento` al consultar todos los proyectos) incluye el tipo y ubicación más probables, tiempo/fecha esperados, probabilidades a 30/90 días, historial y nivel de evidencia. El tiempo se deriva de una tasa semanal constante calculada desde la probabilidad del horizonte; es una esperanza estadística, no una fecha cierta.
- `GET /docs`: documentación interactiva de FastAPI.

Laravel expone las rutas autenticadas `GET /api/v1/modelo-predictivo/tipos`, `GET /api/v1/modelo-predictivo/predicciones` para todos los proyectos y `GET /api/v1/proyectos/{id}/predicciones` para un proyecto. La página `/modelo-predictivo` genera una tabla ordenada; el detalle de cada proyecto también muestra su probabilidad. Ambas vistas permiten elegir el tipo de evento y el horizonte.

La respuesta de `/predicciones` incluye `modelos`, con la calidad de cada nivel (candidatos, métricas, referencia y variables importantes), y `historial`, con los patrones y el riesgo por cliente si se importaron los logs.

Cuando un nivel no tiene modelo, sus probabilidades usan suavizado jerárquico hacia la probabilidad del proyecto. En todos los casos, la suma de las entidades no supera el riesgo de su proyecto. La respuesta detalla el método, recuentos históricos, horizonte, exposición estimada, variables asociadas y nivel de evidencia. La configuración de cuadrilla combina los riesgos de sus miembros bajo una aproximación de independencia. Cuando no se registra asistencia/exposición histórica por entidad, se aproxima a partir de la duración de asignación/proyecto y se indica en `analisis_entidades.contexto.nota_evidencia`; estas estimaciones requieren más cautela que la probabilidad del modelo por proyecto.

Si el clasificador no cumple esos mínimos, la API devuelve estimaciones históricas suavizadas para los proyectos vigentes en vez de dejar el panel vacío, e informa el método de respaldo en `modelo` y `advertencia_modelo`, con `validacion` en `null`.
