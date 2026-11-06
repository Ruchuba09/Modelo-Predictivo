# Aplicación Laravel + React

## Requisitos

- PHP 8.3+ y extensiones PDO/PostgreSQL requeridas por Laravel.
- Composer.
- Node.js 22+ y npm.
- PostgreSQL con el esquema legacy documentado en [docs/database.md](docs/database.md).

## Desarrollo local

Desde este directorio:

```bash
composer install
cp .env.example .env
php artisan key:generate
npm ci
```

Configura `DB_CONNECTION=usuarios` y los valores `PG_*` en `.env`. Asegúrate de que PostgreSQL tenga instalado el esquema completo antes de ejecutar páginas que consultan datos. `php artisan migrate` aplica únicamente las migraciones parciales incluidas; no inicializa todas las tablas del producto.

Levanta la aplicación y Vite con:

```bash
composer run dev
```

## Calidad

```bash
composer validate --strict
composer run test:unit
composer run test:routes
npm run typecheck
npm run build
```

Las pruebas feature con acceso a modelos requieren una base PostgreSQL de pruebas con el esquema completo. Evita `migrate:fresh` en bases compartidas o con datos.

La arquitectura, rutas y autenticación de API se describen en [docs/api.md](docs/api.md).

## Datos sintéticos para el modelo predictivo

Para crear un lote grande en un entorno de desarrollo, ejecuta el comando manual (no forma parte de `DatabaseSeeder`):

```powershell
$env:APP_ENV = 'local'
php artisan model:seed-predictive --projects=60 --workers=360 --squads=40 --events=1800 --months=60 --seed=20261029
```

El comando crea proyectos activos con 60 meses de historial, clientes, faenas, áreas, trabajadores, supervisores, cuadrillas, asignaciones, actividades y eventos fechados; si está instalada la ampliación del esquema, también genera cientos de miles de filas de horas-hombre, asistencia, avance semanal y clima. Los registros quedan marcados con un prefijo `SINTETICO-*`. Para repetirlo, usa otro `--tag` y otro `--seed`; no borra registros previos. No se ejecuta en producción.

Los conteos se pueden ajustar, por ejemplo `--projects=100 --workers=600 --squads=60 --events=5000 --months=84`. Las vistas del modelo deben estar instaladas con los scripts en `../python/database` antes de consultar las predicciones.
