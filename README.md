# Modelo Predictivo

Aplicación web para la gestión y análisis predictivo de incidentes, tarjetas de "pare" y prevención de riesgos laborales. Construida con **Laravel 13** (backend) y **React + Inertia.js** (frontend), usando **PostgreSQL** como base de datos y **Redis** para colas y caché.

## Índice

- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Opción A: Instalación con Docker (recomendada)](#opción-a-instalación-con-docker-recomendada)
- [Opción B: Instalación sin Docker (local)](#opción-b-instalación-sin-docker-local)
- [Servicio de modelo predictivo (Python)](#servicio-de-modelo-predictivo-python)
- [Comandos útiles](#comandos-útiles)
- [Solución de problemas](#solución-de-problemas)

## Estructura del proyecto

```
Modelo-Predictivo/
├── app/             # Aplicación Laravel + React (el código del proyecto)
├── docker/          # Configuración de Docker (Nginx, PHP, Redis, PostgreSQL, pgAdmin, servicio Python)
└── python/          # Servicio de modelo predictivo (FastAPI + scikit-learn)
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

#### Habilitar la virtualización en la BIOS (solo Windows)

Docker Desktop necesita que la virtualización de hardware esté activada. Si al instalar o abrir Docker Desktop aparece un error como `Virtualization support not detected` o `WSL 2 installation is incomplete`, debes habilitarla manualmente:

1. Reinicia el computador y entra a la **BIOS/UEFI** (normalmente presionando `F2`, `F10`, `F12`, `Del` o `Esc` justo al encender el equipo; la tecla depende de la marca del computador).
2. Busca una opción llamada **Virtualization Technology**, **Intel VT-x**, **AMD-V** o **SVM Mode** (suele estar en la pestaña `Advanced` o `CPU Configuration`).
3. Cámbiala a **Enabled**.
4. Guarda los cambios (`F10` en la mayoría de los equipos) y reinicia.

#### Instalar WSL (Windows Subsystem for Linux)

Docker Desktop en Windows requiere WSL 2 para funcionar. Para instalarlo:

1. Abre **PowerShell como administrador** (click derecho → `Ejecutar como administrador`).
2. Ejecuta el siguiente comando:

```powershell
wsl --install
```

3. Reinicia el computador cuando termine la instalación.
4. Si WSL ya estaba instalado pero desactualizado, actualízalo con:

```powershell
wsl --update
```

5. Abre Docker Desktop y confirma que en `Settings` → `General` esté marcada la opción `Use the WSL 2 based engine`.

### A.2 Clonar el repositorio

Clona el repositorio oficial desde la rama `main`:

```bash
git clone https://github.com/Ruchuba09/Modelo-Predictivo.git
cd Modelo-Predictivo
```

### A.3 Configurar variables de entorno de Docker

Dentro de la carpeta `docker/`, copia el archivo de ejemplo y complétalo:

```bash
cd docker
cp .env.example .env
```

#### Obtener tu token de GitHub

```env
GITHUB_TOKEN    = # Un Personal Access Token de GitHub, generado en https://github.com/settings/tokens
URL_REPOSITORIO = https://github.com/AVA-UCSC/Modelo-Predictivo-Nicolas
RAMA            = Nicolas
CORREO          = # Tu correo asociado a GitHub
NOMBRE          = # Tu nombre de usuario de GitHub
```
### A.4 Levantar los contenedores

Desde la carpeta `docker/`:

```# Modelo Predictivo

Aplicación web para la gestión y análisis predictivo de incidentes, tarjetas de "pare" y prevención de riesgos laborales. Construida con **Laravel 13** (backend) y **React + Inertia.js** (frontend), usando **PostgreSQL** como base de datos y **Redis** para colas y caché.

## Índice

- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Opción A: Instalación con Docker (recomendada)](#opción-a-instalación-con-docker-recomendada)
- [Opción B: Instalación sin Docker (local)](#opción-b-instalación-sin-docker-local)
- [Servicio de modelo predictivo (Python)](#servicio-de-modelo-predictivo-python)
- [Comandos útiles](#comandos-útiles)
- [Solución de problemas](#solución-de-problemas)

## Estructura del proyecto

```
Modelo-Predictivo/
├── app/             # Aplicación Laravel + React (el código del proyecto)
├── docker/          # Configuración de Docker (Nginx, PHP, Redis, PostgreSQL, pgAdmin, servicio Python)
└── python/          # Servicio de modelo predictivo (FastAPI + scikit-learn)
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

#### Habilitar la virtualización en la BIOS (solo Windows)

Docker Desktop necesita que la virtualización de hardware esté activada. Si al instalar o abrir Docker Desktop aparece un error como `Virtualization support not detected` o `WSL 2 installation is incomplete`, debes habilitarla manualmente:

1. Reinicia el computador y entra a la **BIOS/UEFI** (normalmente presionando `F2`, `F10`, `F12`, `Del` o `Esc` justo al encender el equipo; la tecla depende de la marca del computador).
2. Busca una opción llamada **Virtualization Technology**, **Intel VT-x**, **AMD-V** o **SVM Mode** (suele estar en la pestaña `Advanced` o `CPU Configuration`).
3. Cámbiala a **Enabled**.
4. Guarda los cambios (`F10` en la mayoría de los equipos) y reinicia.

#### Instalar WSL (Windows Subsystem for Linux)

Docker Desktop en Windows requiere WSL 2 para funcionar. Para instalarlo:

1. Abre **PowerShell como administrador** (click derecho → `Ejecutar como administrador`).
2. Ejecuta el siguiente comando:

```powershell
wsl --install
```

3. Reinicia el computador cuando termine la instalación.
4. Si WSL ya estaba instalado pero desactualizado, actualízalo con:

```powershell
wsl --update
```

5. Abre Docker Desktop y confirma que en `Settings` → `General` esté marcada la opción `Use the WSL 2 based engine`.

### A.2 Clonar el repositorio

Clona el repositorio oficial desde la rama `main`:

```bash
git clone https://github.com/Ruchuba09/Modelo-Predictivo.git
cd Modelo-Predictivo
```

### A.3 Configurar variables de entorno de Docker

Dentro de la carpeta `docker/`, copia el archivo de ejemplo y complétalo:

```bash
cd docker
cp .env.example .env
```

#### Obtener tu token de GitHub

```env
GITHUB_TOKEN    = # Un Personal Access Token de GitHub, generado en https://github.com/settings/tokens
URL_REPOSITORIO = https://github.com/AVA-UCSC/Modelo-Predictivo-Nicolas
RAMA            = Nicolas
CORREO          = # Tu correo asociado a GitHub
NOMBRE          = # Tu nombre de usuario de GitHub
```
### A.4 Levantar los contenedores

Desde la carpeta `docker/`:

```bash
docker compose up -d --build
```

Esto va a construir y levantar: Laravel, Nginx, Redis, PostgreSQL, workers de colas, pgAdmin y el servicio de modelo predictivo (Python/FastAPI). La primera vez puede tardar varios minutos.

> 💡 El servicio de modelo predictivo necesita que las vistas de PostgreSQL existan en la base de datos antes de poder responder predicciones; revisa la sección [Servicio de modelo predictivo (Python)](#servicio-de-modelo-predictivo-python) para prepararlas.

### A.5 Acceder a la aplicación

- **URL de la app:** `https://localhost/`
  - Nginx usa un certificado autofirmado de desarrollo. No uses esta configuración para publicar la aplicación.

### A.6 Configuración inicial de Laravel dentro del contenedor

1. Abre la barra lateral de **Docker** en VS Code.
2. Busca el contenedor `laravel-app-1`.
3. Click derecho → `Attach in New Window`.
4. Si te lo pide, abre la carpeta `/var/www/app/`.
5. Dentro de esa terminal del contenedor, ejecuta:

```bash
cp .env.example .env        # desde /var/www/app, si aún no existe
php artisan key:generate
```

6. Asegúrate de que PostgreSQL contiene el esquema completo del producto (consulta [docs/database.md](app/docs/database.md)); el repositorio no trae el DDL legacy.
7. Ejecuta `php artisan migrate` para aplicar las migraciones parciales pendientes y recarga `https://localhost/`.

### A.7 Acceder a pgAdmin (administrador de PostgreSQL)

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
  
### A.8 Credenciales demo de desarrollo

Si corriste `php artisan db:seed` (o el seeder completo incluye `UserSeeder`), quedan disponibles las siguientes cuentas de prueba, todas con la misma contraseña:

| Rol | Email | Contraseña |
|---|---|---|
| Usuario/trabajador | `trabajador@empresa.cl` | `12345678` |
| Supervisor | `supervisor@empresa.cl` | `87654321` |
| Admin | `admin@empresa.cl` | `12345678` |

⚠️ Estas cuentas y contraseña son solo para entornos locales de desarrollo. Cambia las credenciales antes de exponer una instancia y no ejecutes seeders demo en producción.

### A.9 Detener y limpiar el entorno

Para apagar los contenedores:

```bash
docker compose down
```

Para borrar todo lo generado por el proyecto (contenedores, volúmenes, imágenes y caché de build):

```bash
docker compose down --volumes --rmi all --remove-orphans
```

`--volumes` elimina también la base de datos local de este proyecto. No uses `docker volume prune` ni `docker system prune` como parte del flujo normal.

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

Clona el repositorio oficial desde la rama `main`:

```bash
git clone https://github.com/Ruchuba09/Modelo-Predictivo.git
cd Modelo-Predictivo/app
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
DB_CONNECTION=usuarios
PG_HOST=127.0.0.1
PG_PORT=5432
PG_DATABASE=modelo_predictivo
PG_USERNAME=postgres
PG_PASSWORD=tu_password
```

### B.5 Ejecutar las migraciones

```bash
php artisan migrate
```

**Importante:** `DB_CONNECTION` debe usar una conexión declarada en `config/database.php` (`usuarios` o `laravel`). Las migraciones incluidas no describen todo el esquema que usa la aplicación. Se necesita la base PostgreSQL legacy del proyecto; revisa [el contrato de base de datos](app/docs/database.md) antes de crear o reiniciar una base. No ejecutes `migrate:fresh` sobre una base con datos.

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

## Servicio de modelo predictivo (Python)

Además del backend Laravel, el proyecto incluye un servicio independiente en **Python (FastAPI + scikit-learn)**, ubicado en `python/`. Estima la probabilidad de que un proyecto registre uno o más eventos de cierto tipo en las próximas semanas, usando vistas de PostgreSQL y un clasificador `HistGradientBoosting`. No depende de ningún proveedor externo: todo el cálculo se hace con los datos ya presentes en la base.

Laravel consume este servicio de forma transparente a través de sus propias rutas (`/api/v1/modelo-predictivo/...`), por lo que normalmente no necesitas llamarlo directamente; esta sección es para levantarlo, prepararlo y, si lo necesitas, consultarlo o depurarlo de forma independiente.

### Preparar las vistas de PostgreSQL (obligatorio)

El modelo lee desde vistas que no vienen en las migraciones de Laravel. Ejecuta los siguientes scripts contra la misma base de datos que usa Laravel, **en este orden**:

1. `python/database/01_vistas_modelo_predictivo.sql` — debe ejecutarse después de tener cargado el esquema base del proyecto (ver [docs/database.md](app/docs/database.md)). Crea la serie semanal, los eventos unificados y las variables de contexto.
2. `python/database/03_ampliacion_modelo_datos.sql` — agrega tablas adicionales y la vista opcional `v_proyecto_semana_extra`.

Ambas deben quedar en el esquema `public`. Sin estos scripts, el servicio responde pero no puede generar predicciones.

### Con Docker (recomendado)

Si ya levantaste el proyecto con la [Opción A](#opción-a-instalación-con-docker-recomendada), el servicio `predictive-model` se construye y arranca automáticamente junto con Laravel — no requiere pasos extra.

- Laravel lo consulta internamente en `http://predictive-model:8000` (dentro de la red de Docker); se puede sobrescribir con `PREDICTIVE_MODEL_URL` en `app/.env`.
- Si tu PostgreSQL usa credenciales o nombre de base distintos a los predeterminados del `docker compose`, define `PREDICTIVE_DATABASE_URL` en `docker/.env`.
- El contenedor **no publica el puerto 8000 al host** por defecto, así que `http://localhost:8000` no estará disponible desde tu navegador. Para explorar la documentación interactiva de FastAPI (`/docs`) o llamar al servicio directamente desde tu máquina, agrega temporalmente en `docker/compose.yml`, dentro del servicio `predictive-model`:

  ```yaml
  ports:
    - "8000:8000"
  ```

  y vuelve a levantar los contenedores (`docker compose up -d --build`).

### Sin Docker (local)

```bash
cd python
pip install -r requirements.txt
```

Define `DATABASE_URL` apuntando a tu PostgreSQL y levanta el servicio con Uvicorn:

```powershell
$env:DATABASE_URL = "postgresql+psycopg2://usuario:clave@localhost:5432/postgres"
uvicorn servicio:app --host 127.0.0.1 --port 8000
```

En Linux/macOS, el equivalente es:

```bash
export DATABASE_URL="postgresql+psycopg2://usuario:clave@localhost:5432/postgres"
uvicorn servicio:app --host 127.0.0.1 --port 8000
```

### Endpoints principales

| Endpoint | Descripción |
|---|---|
| `GET /health` | Verifica la conexión con PostgreSQL |
| `GET /tipos` | Lista `todos` y los tipos de evento encontrados en los datos |
| `GET /predicciones?tipo_objetivo=todos&horizonte=4&id_proyecto=123` | Devuelve la probabilidad por proyecto, el ranking global y, si se indica `id_proyecto`, el detalle por trabajador, cuadrilla, actividad, área, faena y cliente. `horizonte` acepta de 1 a 52 semanas |
| `GET /docs` | Documentación interactiva de FastAPI (Swagger UI) |

El servicio reentrena el modelo en cada solicitud y necesita un mínimo de 100 filas proyecto-semana con ejemplos positivos y negativos para el objetivo elegido; si no hay datos suficientes, devuelve estimaciones históricas suavizadas en lugar de dejar el panel vacío, indicando el método de respaldo usado. Para el detalle completo del contrato HTTP (estructura de la respuesta, suavizado jerárquico, manejo de exposición histórica, etc.) revisa [`python/README.md`](python/README.md).

---

## Comandos útiles

| Comando | Descripción |
|---|---|
| `php artisan migrate` | Aplica las migraciones versionadas que sí están incluidas |
| `php artisan route:list` | Lista todas las rutas disponibles |
| `php artisan queue:listen` | Procesa trabajos en cola manualmente |
| `npm run build` | Compila los assets para producción |
| `php artisan test` | Ejecuta los tests |
| `composer run test:unit` | Ejecuta tests unitarios independientes de PostgreSQL |
| `composer run test:routes` | Verifica contratos de rutas sin base de datos |
| `npm run typecheck` | Comprueba los tipos TypeScript |

## Solución de problemas

- **Error 500 al iniciar:** consulta `storage/logs/laravel.log`, confirma que `APP_KEY` esté configurada y que el esquema PostgreSQL legacy esté instalado.
- **Error de conexión a la base de datos:** revisa que PostgreSQL esté corriendo y que `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USERNAME` y `PG_PASSWORD` correspondan a la conexión seleccionada.
- **`npm install` falla por dependencias nativas:** borra `node_modules` y `package-lock.json`, y vuelve a ejecutar `npm install`.
- **Cambios en `.env` no se reflejan:** ejecuta `php artisan config:clear`.
- **El modelo predictivo responde error o datos vacíos:** confirma que ejecutaste los scripts `python/database/01_vistas_modelo_predictivo.sql` y `python/database/03_ampliacion_modelo_datos.sql`, y revisa el estado del servicio en `GET /health` (vía `docker compose logs predictive-model` si corre en Docker).
