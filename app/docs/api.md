# API REST v1

La API vive bajo `/api/v1` y devuelve JSON. Las rutas de negocio requieren un token personal de Sanctum enviado como `Authorization: Bearer <token>`.

## Autenticación

Obtener un token con RUT o correo y contraseña:

```http
POST /api/v1/login
Accept: application/json
Content-Type: application/json
```

```json
{
  "rut": "11111111-1",
  "password": "tu contraseña",
  "device_name": "integracion"
}
```

La respuesta contiene `access_token`, `token_type` y `user`. Enviar el token recibido en las llamadas posteriores. Para invalidar el token actual, llamar `POST /api/v1/logout`. El endpoint `GET /api/v1/user` devuelve el usuario autenticado.

## Recursos

Los endpoints CRUD están protegidos y usan los métodos HTTP habituales (`GET` colección, `POST`, `GET /{id}`, `PUT/PATCH /{id}` y `DELETE /{id}`).

| Recurso | Ruta |
|---|---|
| Proyectos | `/api/v1/proyectos` |
| Asignaciones | `/api/v1/asignaciones` |
| Cuadrillas | `/api/v1/cuadrillas` |
| Eventos | `/api/v1/eventos` |
| Trabajadores | `/api/v1/trabajadores` |
| Personas | `/api/v1/personas` |
| Faenas | `/api/v1/faenas` |
| Clientes | `/api/v1/clientes` |
| Áreas | `/api/v1/areas` |
| Departamentos | `/api/v1/departamentos` |
| Tipos de obrero | `/api/v1/tipos-obrero` |
| Tipos de evento | `/api/v1/tipos-evento` |
| Evidencias | `/api/v1/evidencias` |
| Usuarios | `/api/v1/usuarios` |
| Roles | `/api/v1/roles` |
| Permisos | `/api/v1/permisos` |
| Situaciones críticas | `/api/v1/situacion-criticas` |

Las colecciones paginadas aceptan `per_page` (máximo 100). Las que sirven para selectores aceptan `todos=1` (máximo 1000). Trabajadores, personas, faenas, clientes, áreas, departamentos, usuarios y roles aceptan `buscar`. Áreas también acepta `id_faena`; clientes y departamentos aceptan `estado`.

Rutas específicas de eventos: `GET /api/v1/eventos/sin-administrador`, `GET /api/v1/eventos/mis-reportes`, `GET /api/v1/eventos/opciones`, `GET /api/v1/eventos/{id}/evidencias`, `GET /api/v1/eventos/estadisticas`, `GET /api/v1/eventos/estadisticas/{seccion}`, `PATCH /api/v1/eventos/{id}/tomar` y `PATCH /api/v1/eventos/{id}/cerrar`. La API también expone `GET /api/v1/cuadrillas/supervisores`.

## Respuestas

- `201`: recurso creado.
- `200`: consulta o actualización correcta.
- `204`: eliminación correcta.
- `401`: falta un token válido.
- `409`: no se puede borrar un registro referenciado por otros datos.
- `422`: datos inválidos; el cuerpo incluye `message` y errores por campo.

La documentación OpenAPI interactiva de Scramble está disponible en `/docs/api` cuando las dependencias PHP del proyecto están instaladas.

Los subtipos obrero, supervisor y administrativo se crean y mantienen mediante `/trabajadores`; no se exponen como CRUD independientes para evitar registros sin su persona y trabajador asociado. `medidas` y el módulo legado `TarjetaPare` quedan pendientes de definir: el modelo de medidas está vacío y las clases de modelo que usa el controlador legado de tarjetas no existen todavía.
