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
