# README del proyecto

Aplicacion Laravel 13 + React 19 con Vite y TypeScript.

## Comandos iniciales
Ejecútalos en una terminal dentro del contenedor (terminal de VSC o Docker).

Generar `APP_KEY` y luego asignarla en `.env` (Deben crearlo en base al `.env.example`):

```bash
php artisan key:generate --show
```

Corrección de permisos:

```bash
chown -R www-data:www-data /var/www/app
chmod -R 775 /var/www/app/storage
chmod -R 775 /var/www/app/bootstrap/cache/
```

Ejecutar migracion inicial:

```bash
php artisan tinker --execute="DB::statement(\"CREATE SCHEMA IF NOT EXISTS laravel\")"
php artisan migrate
```
# Librerias incluidas:

## Principales

- `laravel/framework`: framework backend principal.
- `inertiajs/inertia-laravel` + `@inertiajs/react`: puente Laravel-React sin API REST tradicional.
- `laravel/sanctum`: autenticacion para SPA/API.
- `laravel/telescope`: inspeccion de requests, jobs, logs y queries.
- `laravel/pulse`: metricas y monitoreo de rendimiento.
- `react`: libreria base de UI.
- `vite` + `laravel-vite-plugin`: bundling y desarrollo frontend.
- `typescript`: tipado estatico en frontend.
- `tailwindcss`: utilidades CSS.
- `@mui/material`: componentes UI listos para uso.
- `@radix-ui/*`: primitivas UI accesibles (avatar, dialog, select, tooltip, etc).

## Datos y tablas

- `@tanstack/react-query`: cache y sincronizacion de datos remotos.
- `@tanstack/react-table`: construccion de tablas complejas.
- `@tanstack/react-virtual`: virtualizacion para listas/tablas grandes.

## Visuales y UX

- `chart.js` + plugins: graficos y anotaciones.
- `lucide-react` + `@fortawesome/fontawesome-free` + `bootstrap-icons`: iconografia.
- `toastr`: notificaciones toast.
- `react-dropzone` + `dropzone`: carga de archivos drag and drop.
- `signature_pad`: captura de firmas en canvas.

## Backend

- `maatwebsite/excel`: importacion/exportacion Excel/CSV.
- `barryvdh/laravel-dompdf` + `iio/libmergepdf` + `spatie/pdf-to-image`: generacion, union y conversion de PDFs.
- `predis/predis`: cliente Redis para cache/colas/sesiones.
- `simplesoftwareio/simple-qrcode`: generacion de codigos QR.
- `tightenco/ziggy`: uso de rutas Laravel en JavaScript.

## Desarrollo y testing

- `phpunit/phpunit`: pruebas unitarias e integracion.
- `laravel/dusk`: pruebas end-to-end.
- `mockery/mockery`: mocks para pruebas.
- `fakerphp/faker`: datos fake para tests y seeders.
- `nunomaduro/collision`: mejor salida de errores en consola.
- `laravel/pail`: visor en tiempo real de logs.
- `laravel/breeze` + `laravel/ui`: scaffolding de autenticacion y UI base.


## Normas gráficas

La documentación visual y el catálogo de assets viven en:

- [Normas gráficas y assets](./docs/normas-graficas.md)