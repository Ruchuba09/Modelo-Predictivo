# Contrato de base de datos

La aplicación se conecta a PostgreSQL con dos conexiones (`usuarios` y `laravel`) y usa tablas que ya existían en la base del proyecto. El repositorio no incluye un dump SQL ni migraciones completas para esas tablas. Las migraciones presentes solo cubren cambios parciales, por lo que `php artisan migrate:fresh` no puede reconstruir una instalación completa.

## Tablas del esquema actual

Entre otras, el código actual depende de:

- Identidad y acceso: `personas`, `trabajadores`, `obreros`, `supervisores`, `administrativos`, `users`, `roles`, `permisos`, `usuario_rol`, `rol_permiso`.
- Operación: `proyectos`, `cuadrillas`, `obreros`, `asignaciones`, `actividades`, `eventos`, `tipo_eventos`, `tipo_obreros`, `areas`, `departamentos`, `faenas`, `clientes`.
- Evidencia y seguimiento: `evidencias`, `evento_trabajador`, `situacion_criticas` y las tablas de reportes e INTRAVA.

Los nombres de tablas, claves primarias, esquemas y columnas deben coincidir con los modelos de `app/Models`, servicios y seeders. En el esquema actual, la cuadrilla de un obrero se guarda directamente en `obreros.id_cuadrilla`; no existe una tabla de membresías históricas `trabajadores_cuadrillas`.

## Preparar una base desde cero

El esquema completo de referencia es el SQL PostgreSQL compartido por el equipo. Ese script debe ejecutarse solo sobre una base vacía. No correr `migrate:fresh` sobre datos existentes. Las migraciones Laravel agregan servicios de aplicación que no aparecen en el DDL, como `personal_access_tokens` y `situacion_criticas`.

## Pruebas

La suite unitaria no requiere conexión a PostgreSQL. Las pruebas feature que acceden a modelos necesitan una base de prueba con el esquema completo. SQLite no sustituye el entorno soportado porque el proyecto usa dos conexiones, esquemas PostgreSQL y tipos/relaciones propios de esa base.
