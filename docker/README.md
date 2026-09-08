# Docker Base (Laravel + Nginx + Redis + PostgreSQL)

## Requisitos
- [Docker Desktop](https://www.docker.com/)
- Archivo `.env` configurado en la raiz del proyecto
- Extensiones de VS Code:
  - Dev Containers
  - Container Tools
  - Docker

## Levantar el entorno
```bash
docker compose up -d --build
```

## Acceso a Laravel
- URL: `https://localhost/`
- El navegador mostrara una advertencia de seguridad (`La conexion no es privada`) porque se usa un certificado local.
- Continuar desde `Opciones avanzadas` -> `Continuar a localhost (no seguro)`.
- En el primer arranque va a aparecer un error `500`; abrir el contenedor por VSC y seguir el README del proyecto Laravel para completar la configuracion inicial.

## Abrir contenedor
1. Abrir la barra lateral de Docker en VS Code.
2. Ubicar el contenedor `laravel-app-1`.
3. Hacer click derecho y seleccionar `Attach in New Window`.
4. Es probable que tengan que seleccionar la carpeta de laravel: `/var/www/app/`

## pgAdmin
- URL: `http://localhost:5050/`
- Credenciales por defecto:
  - Usuario: `pg@ava.cl`
  - Contrasena: `postgres`

### Registrar PostgreSQL en pgAdmin
1. En `Servers`, hacer click derecho -> `Register` -> `Server`.
2. En la pestana `General`:
   - `Name`: `postgres`
3. En la pestana `Connection`:
   - `Host`: `postgres`
   - `Username`: `postgres`
   - `Password`: `postgres` (activar `Save password`)

## Limpiar contenedores, cache y builds
Para borrar todo lo generado por este proyecto (contenedores, volumenes, imagenes y cache de build):

```bash
docker compose down --volumes --rmi all --remove-orphans
docker builder prune -af
docker volume prune -f
docker network prune -f
```

Opcional (global): borrar todos los recursos sin uso de Docker en la maquina:

```bash
docker system prune -a --volumes -f
```