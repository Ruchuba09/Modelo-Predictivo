# Modelo Predictivo

Aplicación web para la gestión y análisis predictivo de incidentes, tarjetas de "pare" y prevención de riesgos laborales. Construida con **Laravel 13** (backend) y **React + Inertia.js** (frontend), usando **PostgreSQL** como base de datos y **Redis** para colas y caché.

## Índice

- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Opción A: Instalación con Docker (recomendada)](#opción-a-instalación-con-docker-recomendada)
- [Opción B: Instalación sin Docker (local)](#opción-b-instalación-sin-docker-local)
- [Comandos útiles](#comandos-útiles)
- [Solución de problemas](#solución-de-problemas)

## Estructura del proyecto

```
Modelo-Predictivo-Nicolas/
├── app/             # Aplicación Laravel + React (el código del proyecto)
└── docker/          # Configuración de Docker (Nginx, PHP, Redis, PostgreSQL, pgAdmin)
```

## Requisitos previos

Antes de elegir una opción de instalación, revisa qué tienes instalado en tu equipo:

- **¿Tienes Docker Desktop instalado?** → Sigue la [Opción A](#opción-a-instalación-con-docker-recomendada). Es la forma más simple porque Docker se encarga de instalar PHP, Node, PostgreSQL y Redis por ti dentro de contenedores; **no necesitas tener Laravel, PHP ni PostgreSQL instalados en tu máquina**.
- **¿No tienes Docker y prefieres instalar todo localmente?** → Sigue la [Opción B](#opción-b-instalación-sin-docker-local). Ahí se detalla cómo instalar PHP, Composer, Node y PostgreSQL si aún no los tienes.

> 💡 Si no estás seguro de cuál elegir, se recomienda la **Opción A (Docker)**: es más rápida de levantar y evita conflictos de versiones con software que ya tengas instalado.

---

## Opción A: Instalación con Docker (recomendada)

### A.1 Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.
- Git.
- (Opcional pero recomendado) Visual Studio Code con las extensiones:
  - Dev Containers
  - Container Tools
  - Docker

No necesitas instalar PHP, Composer, Node ni PostgreSQL: todo corre dentro de los contenedores.

### A.2 Clonar el repositorio

```bash
git clone https://github.com/Ruchuba09/Modelo-Predictivo
cd Modelo-Predictivo-Nicolas
```

### A.3 Configurar variables de entorno de Docker

Dentro de la carpeta `docker/`, copia el archivo de ejemplo y complétalo:

```bash
cd docker
cp .env.example .env
```

Edita `docker/.env` con tus datos:

```env
GITHUB_TOKEN    = # Un Personal Access Token de GitHub, generado en https://github.com/settings/tokens
URL_REPOSITORIO = https://github.com/AVA-UCSC/Modelo-Predictivo-Nicolas
RAMA            = Nicolas
CORREO          = # Tu correo asociado a GitHub
NOMBRE          = # Tu nombre de usuario de GitHub
```
### A.4 Instalación de Biblioteca

Desde la powershell, un comando a la vez:

```bash
docker compose exec laravel-app npm install recharts
```
```bash
docker compose exec laravel-app npm install html2canvas
```
```bash
docker compose exce laravel-app npm install telescope 
```

### A.5 Levantar los contenedores

Desde la carpeta `docker/`:

```bash
docker compose up -d --build
```

Esto va a construir y levantar: Laravel, Nginx, Redis, PostgreSQL, workers de colas, pgAdmin y phpMyAdmin. La primera vez puede tardar varios minutos.

### A.6 Acceder a la aplicación

- **URL de la app:** `https://localhost/`
  - El navegador mostrará una advertencia de "La conexión no es privada" porque se usa un certificado local autofirmado. Entra en `Opciones avanzadas` → `Continuar a localhost (no seguro)`.
  - En el primer arranque es normal ver un error `500`. Continúa con el siguiente paso para completar la configuración inicial de Laravel.

### A.7 Configuración inicial de Laravel dentro del contenedor

1. Abre la barra lateral de **Docker** en VS Code.
2. Busca el contenedor `laravel-app-1`.
3. Click derecho → `Attach in New Window`.
4. Si te lo pide, abre la carpeta `/var/www/app/`.
5. Dentro de esa terminal del contenedor, ejecuta:

```bash
cp .env.example .env        # si no existe aún el .env de Laravel
php artisan key:generate
php artisan migrate
```

6. Recarga `https://localhost/` en el navegador.

### A.8 Acceder a pgAdmin (administrador de PostgreSQL)

- **URL:** `http://localhost:5050/`
- **Usuario:** `pg@ava.cl`
- **Contraseña:** `postgres`

Para registrar la base de datos dentro de pgAdmin:

1. En `Servers`, click derecho → `Register` → `Server`.
2. Pestaña `General` → `Name`: `postgres`.
3. Pestaña `Connection`:
   - `Host`: `postgres`
   - `Username`: `postgres`
   - `Password`: `postgres` (marca `Save password`)
  
### A.9 Credenciales para el Login (Copia y pega)

Usuario/RUT: 111111111 
Contraseña : 12345678 

### A.10 Detener y limpiar el entorno

Para apagar los contenedores:

```bash
docker compose down
```

Para borrar todo lo generado por el proyecto (contenedores, volúmenes, imágenes y caché de build):

```bash
docker compose down --volumes --rmi all --remove-orphans
docker builder prune -af
docker volume prune -f
docker network prune -f
```

---

## Opción B: Instalación sin Docker (local)

Esta opción es para quienes prefieren no usar Docker e instalar todo directamente en su máquina.

### B.1 Requisitos previos

Instala lo siguiente si no lo tienes ya:

| Herramienta | Versión mínima | Cómo verificar si ya la tienes |
|---|---|---|
| PHP | 8.3 | `php -v` |
| Composer | Última estable | `composer -V` |
| Node.js | 18+ | `node -v` |
| npm | Incluido con Node | `npm -v` |
| PostgreSQL | 16+ | `psql --version` |
| Git | Cualquiera reciente | `git -v` |

**Si no tienes PHP/Composer:**
- Windows: instala PHP con [Laragon](https://laragon.org/) o [XAMPP](https://www.apachefriends.org/), y Composer desde [getcomposer.org](https://getcomposer.org/download/).
- Mac: `brew install php composer`
- Linux (Debian/Ubuntu): `sudo apt install php8.3 php8.3-cli php8.3-pgsql php8.3-mbstring php8.3-xml php8.3-curl unzip` y luego instala Composer desde su web oficial.

**Si no tienes Node/npm:**
- Descarga el instalador desde [nodejs.org](https://nodejs.org/) (versión LTS).

**Si no tienes PostgreSQL:**
- Descarga el instalador desde [postgresql.org/download](https://www.postgresql.org/download/), o instálalo con tu gestor de paquetes (`brew install postgresql`, `sudo apt install postgresql`, etc.).
- Crea una base de datos vacía para el proyecto, por ejemplo:
  ```sql
  CREATE DATABASE modelo_predictivo;
  ```

### B.2 Clonar el repositorio

```bash
git clone https://github.com/AVA-UCSC/Modelo-Predictivo-Nicolas
cd Modelo-Predictivo-Nicolas/app
```

> A partir de aquí, todos los comandos se ejecutan dentro de la carpeta `app/`.

### B.3 Instalar dependencias de PHP

```bash
composer install
```

### B.4 Configurar el archivo de entorno

```bash
cp .env.example .env
php artisan key:generate
```

Edita el archivo `.env` y configura la conexión a tu PostgreSQL local:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=modelo_predictivo
DB_USERNAME=postgres
DB_PASSWORD=tu_password
```

### B.5 Ejecutar las migraciones

```bash
php artisan migrate
```

Si el proyecto tiene seeders y quieres datos de prueba:

```bash
php artisan db:seed
```

### B.6 Instalar dependencias de frontend

```bash
npm install
```

### B.7 Levantar el proyecto

Puedes levantar backend y frontend por separado, o usar el comando combinado que ya viene definido:

```bash
composer run dev
```

Esto levanta al mismo tiempo: el servidor de Laravel, el worker de colas, los logs (`pail`) y Vite (frontend).

Si prefieres levantarlos por separado, en dos terminales distintas:

```bash
php artisan serve
```

```bash
npm run dev
```

### B.8 Acceder a la aplicación

Por defecto: `http://localhost:8000`

---

## Comandos útiles

| Comando | Descripción |
|---|---|
| `php artisan migrate:fresh --seed` | Reinicia la base de datos desde cero con datos de prueba |
| `php artisan route:list` | Lista todas las rutas disponibles |
| `php artisan queue:listen` | Procesa trabajos en cola manualmente |
| `npm run build` | Compila los assets para producción |
| `php artisan test` | Ejecuta los tests |

## Solución de problemas

- **Error 500 al primer ingreso (Docker):** es normal, sigue el paso [A.6](#a6-configuración-inicial-de-laravel-dentro-del-contenedor) para generar la key y correr las migraciones.
- **Error de conexión a la base de datos (local):** revisa que PostgreSQL esté corriendo y que los datos en `.env` (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) sean correctos.
- **`npm install` falla por dependencias nativas:** borra `node_modules` y `package-lock.json`, y vuelve a ejecutar `npm install`.
- **Cambios en `.env` no se reflejan:** ejecuta `php artisan config:clear`.
