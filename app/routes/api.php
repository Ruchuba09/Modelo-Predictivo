<?php

use App\Http\Controllers\Api\V1\ActividadController;
use App\Http\Controllers\Api\V1\ActividadTrabajadorController;
use App\Http\Controllers\Api\V1\CatalogoSeguridadController;
use App\Http\Controllers\Api\V1\ExposicionController;
use App\Http\Controllers\Api\V1\AreaController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ClienteController;
use App\Http\Controllers\Api\V1\DatosPruebaController;
use App\Http\Controllers\Api\V1\DepartamentoController;
use App\Http\Controllers\Api\V1\EventoController;
use App\Http\Controllers\Api\V1\FaenaController;
use App\Http\Controllers\Api\V1\IntravaReportController;
use App\Http\Controllers\Api\V1\PermisoController;
use App\Http\Controllers\Api\V1\PersonaController;
use App\Http\Controllers\Api\V1\RolController;
use App\Http\Controllers\Api\V1\SituacionCriticaController;
use App\Http\Controllers\Api\V1\TipoEventoController;
use App\Http\Controllers\Api\V1\TipoObreroController;
use App\Http\Controllers\Api\V1\TrabajadorController;
use App\Http\Controllers\Api\V1\UsuarioController;
use App\Http\Controllers\AsignacionController;
use App\Http\Controllers\CuadrillaController;
use App\Http\Controllers\ModeloPredictivoController;
use App\Http\Controllers\ProyectoController;
use App\Http\Resources\UsuarioResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1
|--------------------------------------------------------------------------
| Niveles de acceso:
|  - Autenticado: cualquier usuario con sesión o token (reportar eventos y
|    ver los propios; la EventoPolicy decide el acceso a cada evento).
|  - Gestión (Administrador, Supervisor): las mismas pantallas que en web.php.
|  - Administración (Administrador): catálogos, usuarios, roles y permisos.
|
| Las lecturas de catálogos están abiertas a Gestión porque los formularios
| de proyectos y cuadrillas las necesitan; las escrituras son solo de Admin.
*/

$gestion = 'role:Administrador,Supervisor';
$admin = 'role:Administrador';
$lectura = ['index', 'show'];
$escritura = ['store', 'update', 'destroy'];

Route::prefix('v1')->name('api.v1.')->group(function () use ($gestion, $admin, $lectura, $escritura) {
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:login')
        ->name('auth.login');

    Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () use ($gestion, $admin, $lectura, $escritura) {
        Route::post('logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('user', fn (Request $request) => new UsuarioResource($request->user()->load('roles')))
            ->name('user');

        /* ----------------------------- Eventos ----------------------------- */
        // Rutas fijas antes del recurso para que no se interpreten como {evento}.
        Route::get('eventos/mis-reportes', [EventoController::class, 'misReportes'])->name('eventos.mis-reportes');
        Route::get('eventos/opciones', [EventoController::class, 'opciones'])->name('eventos.opciones');
        Route::get('eventos/sin-administrador', [EventoController::class, 'sinAdministrador'])
            ->middleware($admin)->name('eventos.sin-administrador');
        Route::get('eventos/{evento}/evidencias', [EventoController::class, 'evidencias'])
            ->whereNumber('evento')->name('eventos.evidencias');
        Route::patch('eventos/{evento}/tomar', [EventoController::class, 'tomar'])
            ->whereNumber('evento')->middleware('role:Supervisor')->name('eventos.tomar');
        Route::patch('eventos/{evento}/cerrar', [EventoController::class, 'cerrar'])
            ->whereNumber('evento')->middleware($admin)->name('eventos.cerrar');
        // index exige Gestión; show/update/destroy se autorizan con EventoPolicy.
        Route::apiResource('eventos', EventoController::class)
            ->whereNumber('evento')
            ->middlewareFor('index', $gestion);

        /* ------------------------ Gestión operativa ------------------------ */
        Route::middleware($gestion)->group(function () {
            Route::get('modelo-predictivo/tipos', [ModeloPredictivoController::class, 'tipos'])
                ->name('modelo-predictivo.tipos');
            Route::get('modelo-predictivo/predicciones', [ModeloPredictivoController::class, 'index'])
                ->name('modelo-predictivo.index');
            Route::get('proyectos/{proyecto}/predicciones', [ModeloPredictivoController::class, 'show'])
                ->name('proyectos.predicciones');

            Route::get('intrava/reportes-previene', [IntravaReportController::class, 'previene'])->name('intrava.previene');
            Route::get('intrava/reportes-flash', [IntravaReportController::class, 'flash'])->name('intrava.flash');
            Route::get('intrava/informes-investigacion', [IntravaReportController::class, 'investigaciones'])->name('intrava.investigaciones');
            Route::get('intrava/hallazgos', [IntravaReportController::class, 'hallazgos'])->name('intrava.hallazgos');

            Route::get('cuadrillas/supervisores', [CuadrillaController::class, 'supervisores'])
                ->name('cuadrillas.supervisores');
            Route::get('cuadrillas/jefes-zona', [CuadrillaController::class, 'jefesZona'])->name('cuadrillas.jefes-zona');
            Route::get('cuadrillas/{cuadrilla}/miembros', [CuadrillaController::class, 'miembros'])->whereNumber('cuadrilla')->name('cuadrillas.miembros');
            Route::put('cuadrillas/{cuadrilla}/miembros', [CuadrillaController::class, 'actualizarMiembros'])->whereNumber('cuadrilla')->name('cuadrillas.miembros.actualizar');
            Route::get('catalogos-seguridad', CatalogoSeguridadController::class)->name('catalogos-seguridad');
            Route::get('actividades/{actividad}/trabajadores', [ActividadTrabajadorController::class, 'index'])->whereNumber('actividad')->name('actividades.trabajadores');
            Route::post('actividades/{actividad}/trabajadores', [ActividadTrabajadorController::class, 'store'])->whereNumber('actividad')->name('actividades.trabajadores.asignar');
            Route::delete('actividades/{actividad}/trabajadores/{trabajador}', [ActividadTrabajadorController::class, 'destroy'])->whereNumber('actividad')->name('actividades.trabajadores.desasignar');
            Route::get('exposicion/horas', [ExposicionController::class, 'horas'])->name('exposicion.horas');
            Route::post('exposicion/horas', [ExposicionController::class, 'guardarHoras'])->name('exposicion.horas.guardar');
            Route::get('exposicion/asistencia', [ExposicionController::class, 'asistencia'])->name('exposicion.asistencia');
            Route::post('exposicion/asistencia', [ExposicionController::class, 'guardarAsistencia'])->name('exposicion.asistencia.guardar');
            Route::get('modelo-predictivo/entidades', [ModeloPredictivoController::class, 'entidades'])->name('modelo-predictivo.entidades');
            Route::get('modelo-predictivo/evaluacion', [ModeloPredictivoController::class, 'evaluacion'])->name('modelo-predictivo.evaluacion');
            Route::apiResource('cuadrillas', CuadrillaController::class)->whereNumber('cuadrilla');
            Route::apiResource('proyectos', ProyectoController::class);
            Route::apiResource('actividades', ActividadController::class)
                ->parameters(['actividades' => 'actividad']);
            Route::apiResource('asignaciones', AsignacionController::class)
                ->parameters(['asignaciones' => 'asignacion']);
        });

        /* ---------- Catálogos: lectura para Gestión, escritura para Admin ---------- */
        $catalogos = [
            'personas' => [PersonaController::class, 'persona'],
            'clientes' => [ClienteController::class, 'cliente'],
            'faenas' => [FaenaController::class, 'faena'],
            'areas' => [AreaController::class, 'area'],
            'departamentos' => [DepartamentoController::class, 'departamento'],
            'trabajadores' => [TrabajadorController::class, 'trabajador'],
            'tipos-obrero' => [TipoObreroController::class, 'tipoObrero'],
            'tipos-evento' => [TipoEventoController::class, 'tipoEvento'],
            'situacion-criticas' => [SituacionCriticaController::class, 'situacionCritica'],
        ];

        foreach ($catalogos as $recurso => [$controlador, $parametro]) {
            Route::apiResource($recurso, $controlador)
                ->parameters([$recurso => $parametro])
                ->middlewareFor($lectura, $gestion)
                ->middlewareFor($escritura, $admin);
        }

        /* -------------------------- Administración -------------------------- */
        Route::middleware($admin)->group(function () {
            Route::apiResource('usuarios', UsuarioController::class)->parameters(['usuarios' => 'usuario']);
            Route::apiResource('roles', RolController::class)->parameters(['roles' => 'rol']);
            Route::apiResource('permisos', PermisoController::class)->parameters(['permisos' => 'permiso']);
            Route::get('datos-prueba', [DatosPruebaController::class, 'index'])->name('datos-prueba.index');
            Route::post('datos-prueba/poblar', [DatosPruebaController::class, 'poblar'])->name('datos-prueba.poblar');
            Route::post('datos-prueba/limpiar', [DatosPruebaController::class, 'limpiar'])->name('datos-prueba.limpiar');
        });
    });
});

// Las estadísticas de eventos están en routes/web.php (/api/eventos/estadisticas)
// porque la pantalla de Inertia las consume con la sesión del usuario.
