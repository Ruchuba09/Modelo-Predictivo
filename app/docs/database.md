# Contrato de base de datos

La aplicación se conecta a PostgreSQL con dos conexiones (`usuarios` y `laravel`) y usa tablas que ya existían en la base del proyecto. El repositorio no incluye un dump SQL ni migraciones completas para esas tablas. Las migraciones presentes solo cubren cambios parciales, por lo que `php artisan migrate:fresh` no puede reconstruir una instalación completa.

## Tablas que consumen los modelos y servicios

Entre otras, el código actual depende de:

- Identidad y acceso: `personas`, `trabajadores`, `obreros`, `supervisores`, `administrativos`, `users`, `roles`, `permisos`, `usuario_rol`, `rol_permiso`.
- Operación: `proyectos`, `cuadrillas`, `trabajadores_cuadrillas`, `asignaciones`, `eventos`, `tipos_evento`, `tipos_obrero`, `areas`, `departamentos`, `faenas`, `clientes`.
- Evidencia y seguimiento: `evidencias`, `situacion_criticas` y las relaciones de eventos configuradas en los modelos.

Los nombres de tablas, claves primarias, esquemas y columnas deben coincidir con los modelos de `app/Models`, servicios y seeders. En particular, la membresía de trabajadores con cuadrillas vive en `trabajadores_cuadrillas`, con `id_trabajador`, `id_cuadrilla`, `fecha_inicio`, `fecha_fin` y `fecha_creacion`; no es una columna `id_cuadrilla` en `obreros`.

## Preparar una base desde cero

Se requiere obtener del mantenedor de la base la definición SQL versionada que se usa en el entorno compartido. No se debe reconstruir el esquema faltante a partir de suposiciones del código ni correr `migrate:fresh` sobre datos existentes. Antes de habilitar una base vacía, el DDL completo debe incorporarse como migraciones revisadas y probarse en PostgreSQL.

## Pruebas

La suite unitaria no requiere conexión a PostgreSQL. Las pruebas feature que acceden a modelos necesitan una base de prueba con el esquema completo. SQLite no sustituye el entorno soportado porque el proyecto usa dos conexiones, esquemas PostgreSQL y tipos/relaciones propios de esa base.
