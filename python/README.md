# Modelo predictivo semanal por proyecto

El servicio estima la probabilidad de que un proyecto registre uno o más eventos de un tipo dentro de las próximas semanas. Usa las vistas PostgreSQL y el clasificador HistGradientBoosting; no llama a un proveedor externo.

## Preparar PostgreSQL

Ejecuta los scripts en la base que usa Laravel, en este orden:

1. `database/01_vistas_modelo_predictivo.sql` después del esquema base `bd_proyecto_completa_intrava.sql`. Crea la serie semanal, eventos unificados y variables de contexto.
2. `database/03_ampliacion_modelo_datos.sql` para agregar las tablas y la vista opcional `v_proyecto_semana_extra`, que depende de `v_proyecto_semanas`.

Las vistas deben existir en el esquema `public`. La vista `v_proyecto_semana_extra` es opcional para el modelo, pero se crea con el script de ampliación.

## Ejecución con Docker Compose

`docker compose up --build` construye el servicio Python junto con Laravel. Configura `PREDICTIVE_DATABASE_URL` en `docker/.env` si PostgreSQL usa credenciales o base distintas a las predeterminadas. Laravel consulta el servicio interno en `http://predictive-model:8000`; puede sobrescribirse con `PREDICTIVE_MODEL_URL` en `app/.env`.

En local, instala `requirements.txt` y define `DATABASE_URL`, por ejemplo:

```powershell
$env:DATABASE_URL = "postgresql+psycopg2://usuario:clave@localhost:5432/postgres"
uvicorn servicio:app --host 127.0.0.1 --port 8000
```

## Contrato HTTP

- `GET /health`: comprueba conexión con PostgreSQL.
- `GET /tipos`: devuelve `todos` y los tipos encontrados en los datos.
- `GET /predicciones?tipo_objetivo=todos&horizonte=4&id_proyecto=123`: devuelve la probabilidad y la semana base del proyecto, las variables usadas por el clasificador y, al indicar un proyecto, el análisis predictivo por trabajador, trabajador-actividad, configuración de cuadrilla, actividad, área, faena y cliente. El horizonte acepta de 1 a 52 semanas.

La misma respuesta incluye `analisis_global.cuadrillas` con la probabilidad de cada cuadrilla activa; omitir `id_proyecto` devuelve todas las cuadrillas de todos los proyectos vigentes, y enviarlo filtra ese listado al proyecto indicado. El bloque `predicciones` conserva el ranking de todos los proyectos para la vista comparativa.

`analisis_entidades.contexto.evento_estimado` (o `analisis_global.proximo_evento` al consultar todos los proyectos) incluye el tipo y ubicación más probables, tiempo/fecha esperados, probabilidades a 30/90 días, historial y nivel de evidencia. El tiempo se deriva de una tasa semanal constante calculada desde la probabilidad del horizonte; es una esperanza estadística, no una fecha cierta.
- `GET /docs`: documentación interactiva de FastAPI.

Laravel expone las rutas autenticadas `GET /api/v1/modelo-predictivo/tipos`, `GET /api/v1/modelo-predictivo/predicciones` para todos los proyectos y `GET /api/v1/proyectos/{id}/predicciones` para un proyecto. La página `/modelo-predictivo` genera una tabla ordenada; el detalle de cada proyecto también muestra su probabilidad. Ambas vistas permiten elegir el tipo de evento y el horizonte.

El servicio vuelve a entrenar al calcular una solicitud. Se necesita un mínimo de 100 filas proyecto-semana completas y ejemplos positivos y negativos para el objetivo seleccionado; si los datos no alcanzan, la API devuelve un error explicativo en lugar de inventar una probabilidad.

Las probabilidades por entidad usan suavizado jerárquico hacia la probabilidad del proyecto. La respuesta detalla el método, recuentos históricos, horizonte, exposición estimada, variables asociadas y nivel de evidencia. La configuración de cuadrilla combina los riesgos de sus miembros bajo una aproximación de independencia. Cuando no se registra asistencia/exposición histórica por entidad, se aproxima a partir de la duración de asignación/proyecto y se indica en `analisis_entidades.contexto.nota_evidencia`; estas estimaciones requieren más cautela que la probabilidad del modelo por proyecto.

Si el clasificador no cumple el mínimo de datos de entrenamiento, la API devuelve estimaciones históricas suavizadas para los proyectos en vez de dejar el panel vacío, e informa el método de respaldo en `modelo` y `advertencia_modelo`.
