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
use App\Support\Permisos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1
|--------------------------------------------------------------------------
| Cada función exige un Permiso del catálogo App\Support\Permisos (CA-1);
| "permission:a,b" deja pasar a quien tenga cualquiera de ellos. El rol
| Administrador los tiene todos. Sin middleware: cualquier usuario autenticado
| (reportar eventos y ver los propios; la EventoPolicy decide cada evento).
*/

$permiso = fn (string ...$permisos) => 'permission:'.implode(',', $permisos);
$lectura = ['index', 'show'];
$escritura = ['store', 'update', 'destroy'];

Route::prefix('v1')->name('api.v1.')->group(function () use ($permiso, $lectura, $escritura) {
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:login')
        ->name('auth.login');

    Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () use ($permiso, $lectura, $escritura) {
        Route::post('logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('user', fn (Request $request) => new UsuarioResource($request->user()->load('roles')))
            ->name('user');

        /* ----------------------------- Eventos ----------------------------- */
        // Rutas fijas antes del recurso para que no se interpreten como {evento}.
        Route::get('eventos/mis-reportes', [EventoController::class, 'misReportes'])->name('eventos.mis-reportes');
        Route::get('eventos/opciones', [EventoController::class, 'opciones'])->name('eventos.opciones');
        Route::get('eventos/mi-cuadrilla', [EventoController::class, 'miCuadrilla'])
            ->middleware($permiso(Permisos::EVENTOS_VER))->name('eventos.mi-cuadrilla');
        Route::get('eventos/sin-administrador', [EventoController::class, 'sinAdministrador'])
            ->middleware($permiso(Permisos::EVENTOS_VER_TODOS))->name('eventos.sin-administrador');
        Route::get('eventos/{evento}/evidencias', [EventoController::class, 'evidencias'])
            ->whereNumber('evento')->name('eventos.evidencias');
        Route::get('eventos/{evento}/archivos/{archivo}', [EventoController::class, 'archivo'])
            ->whereNumber('evento')->name('eventos.archivo');
        Route::patch('eventos/{evento}/tomar', [EventoController::class, 'tomar'])
            ->whereNumber('evento')->middleware($permiso(Permisos::EVENTOS_TOMAR))->name('eventos.tomar');
        Route::patch('eventos/{evento}/cerrar', [EventoController::class, 'cerrar'])
            ->whereNumber('evento')->middleware($permiso(Permisos::EVENTOS_CERRAR))->name('eventos.cerrar');
        // index exige eventos.ver; show/update/destroy se autorizan con EventoPolicy.
        Route::apiResource('eventos', EventoController::class)
            ->whereNumber('evento')
            ->middlewareFor('index', $permiso(Permisos::EVENTOS_VER));

        /* -------------------------- Modelo predictivo -------------------------- */
        Route::middleware($permiso(Permisos::MODELO_VER))->group(function () {
            Route::get('modelo-predictivo/tipos', [ModeloPredictivoController::class, 'tipos'])->name('modelo-predictivo.tipos');
            Route::get('modelo-predictivo/predicciones', [ModeloPredictivoController::class, 'index'])->name('modelo-predictivo.index');
            Route::get('proyectos/{proyecto}/predicciones', [ModeloPredictivoController::class, 'show'])->name('proyectos.predicciones');
            Route::get('modelo-predictivo/entidades', [ModeloPredictivoController::class, 'entidades'])->name('modelo-predictivo.entidades');
            Route::get('modelo-predictivo/evaluacion', [ModeloPredictivoController::class, 'evaluacion'])->name('modelo-predictivo.evaluacion');
            Route::get('modelo-predictivo/red-neuronal', [ModeloPredictivoController::class, 'redNeuronal'])->name('modelo-predictivo.red-neuronal');
            Route::get('modelo-predictivo/red-neuronal/prueba', [ModeloPredictivoController::class, 'pruebaRedNeuronal'])->name('modelo-predictivo.red-neuronal.prueba');
            Route::get('modelo-predictivo/red-neuronal/traza', [ModeloPredictivoController::class, 'trazaRedNeuronal'])->name('modelo-predictivo.red-neuronal.traza');
            Route::get('proyectos/{proyecto}/red-neuronal', [ModeloPredictivoController::class, 'prediccionRedNeuronal'])->whereNumber('proyecto')->name('proyectos.red-neuronal');
        });
        Route::post('modelo-predictivo/red-neuronal/entrenar', [ModeloPredictivoController::class, 'entrenarRedNeuronal'])
            ->middleware($permiso(Permisos::MODELO_ENTRENAR))->name('modelo-predictivo.red-neuronal.entrenar');

        /* ------------------------------ Intrava ------------------------------ */
        Route::middleware($permiso(Permisos::INTRAVA_VER))->group(function () {
            Route::get('intrava/reportes-previene', [IntravaReportController::class, 'previene'])->name('intrava.previene');
            Route::get('intrava/reportes-flash', [IntravaReportController::class, 'flash'])->name('intrava.flash');
            Route::get('intrava/informes-investigacion', [IntravaReportController::class, 'investigaciones'])->name('intrava.investigaciones');
            Route::get('intrava/hallazgos', [IntravaReportController::class, 'hallazgos'])->name('intrava.hallazgos');
        });

        /* ------------------------ Gestión operativa ------------------------ */
        $verOperaciones = $permiso(Permisos::OPERACIONES_VER, Permisos::OPERACIONES_GESTIONAR);
        $gestionarOperaciones = $permiso(Permisos::OPERACIONES_GESTIONAR);

        Route::middleware($verOperaciones)->group(function () {
            Route::get('cuadrillas/supervisores', [CuadrillaController::class, 'supervisores'])->name('cuadrillas.supervisores');
            Route::get('cuadrillas/jefes-zona', [CuadrillaController::class, 'jefesZona'])->name('cuadrillas.jefes-zona');
            Route::get('cuadrillas/{cuadrilla}/miembros', [CuadrillaController::class, 'miembros'])->whereNumber('cuadrilla')->name('cuadrillas.miembros');
            Route::get('catalogos-seguridad', CatalogoSeguridadController::class)->name('catalogos-seguridad');
            Route::get('actividades/{actividad}/trabajadores', [ActividadTrabajadorController::class, 'index'])->whereNumber('actividad')->name('actividades.trabajadores');
            Route::get('exposicion/horas', [ExposicionController::class, 'horas'])->name('exposicion.horas');
            Route::get('exposicion/asistencia', [ExposicionController::class, 'asistencia'])->name('exposicion.asistencia');
        });

        Route::middleware($gestionarOperaciones)->group(function () {
            Route::put('cuadrillas/{cuadrilla}/miembros', [CuadrillaController::class, 'actualizarMiembros'])->whereNumber('cuadrilla')->name('cuadrillas.miembros.actualizar');
            Route::post('actividades/{actividad}/trabajadores', [ActividadTrabajadorController::class, 'store'])->whereNumber('actividad')->name('actividades.trabajadores.asignar');
            Route::delete('actividades/{actividad}/trabajadores/{trabajador}', [ActividadTrabajadorController::class, 'destroy'])->whereNumber('actividad')->name('actividades.trabajadores.desasignar');
            Route::post('exposicion/horas', [ExposicionController::class, 'guardarHoras'])->name('exposicion.horas.guardar');
            Route::post('exposicion/asistencia', [ExposicionController::class, 'guardarAsistencia'])->name('exposicion.asistencia.guardar');
        });

        Route::apiResource('cuadrillas', CuadrillaController::class)->whereNumber('cuadrilla')
            ->middlewareFor($lectura, $verOperaciones)->middlewareFor($escritura, $gestionarOperaciones);
        // El modelo predictivo también lista los proyectos.
        Route::apiResource('proyectos', ProyectoController::class)
            ->middlewareFor($lectura, $permiso(Permisos::OPERACIONES_VER, Permisos::OPERACIONES_GESTIONAR, Permisos::MODELO_VER))
            ->middlewareFor($escritura, $gestionarOperaciones);
        Route::apiResource('actividades', ActividadController::class)->parameters(['actividades' => 'actividad'])
            ->middlewareFor($lectura, $verOperaciones)->middlewareFor($escritura, $gestionarOperaciones);
        Route::apiResource('asignaciones', AsignacionController::class)->parameters(['asignaciones' => 'asignacion'])
            ->middlewareFor($lectura, $verOperaciones)->middlewareFor($escritura, $gestionarOperaciones);

        /* ---------- Catálogos: los formularios de operaciones también los leen ---------- */
        $catalogos = [
            'personas' => [PersonaController::class, 'persona'],
            'clientes' => [ClienteController::class, 'cliente'],
            'faenas' => [FaenaController::class, 'faena'],
            'areas' => [AreaController::class, 'area'],
            'departamentos' => [DepartamentoController::class, 'departamento'],
            'trabajadores' => [TrabajadorController::class, 'trabajador'],
            'tipos-obrero' => [TipoObreroController::class, 'tipoObrero'],
            'tipos-evento' => [TipoEventoController::class, 'tipoEvento'],
        ];
        $leerCatalogos = $permiso(Permisos::CATALOGOS_VER, Permisos::CATALOGOS_GESTIONAR, Permisos::OPERACIONES_VER, Permisos::OPERACIONES_GESTIONAR);

        foreach ($catalogos as $recurso => [$controlador, $parametro]) {
            Route::apiResource($recurso, $controlador)
                ->parameters([$recurso => $parametro])
                ->middlewareFor($lectura, $leerCatalogos)
                ->middlewareFor($escritura, $permiso(Permisos::CATALOGOS_GESTIONAR));
        }

        // RF-14 a RF-16: sin eliminación manual; la Situación Crítica se borra con su Tarjeta PARE.
        // La consulta la autoriza SituacionCriticaPolicy, que entrega el mensaje de RF-16.1.1.
        Route::apiResource('situacion-criticas', SituacionCriticaController::class)
            ->only(['index', 'show', 'store', 'update'])
            ->parameters(['situacion-criticas' => 'situacionCritica'])
            ->middlewareFor(['store', 'update'], $permiso(Permisos::SITUACIONES_GESTIONAR));

        /* -------------------------- Administración -------------------------- */
        Route::apiResource('usuarios', UsuarioController::class)->parameters(['usuarios' => 'usuario'])
            ->middleware($permiso(Permisos::USUARIOS_GESTIONAR));
        // Solo consulta: Roles y Permisos se administran en el portal web (RF-19 a RF-26).
        Route::apiResource('roles', RolController::class)->only(['index', 'show'])->parameters(['roles' => 'rol'])
            ->middleware($permiso(Permisos::ROLES_GESTIONAR));
        Route::apiResource('permisos', PermisoController::class)->only(['index', 'show'])->parameters(['permisos' => 'permiso'])
            ->middleware($permiso(Permisos::PERMISOS_GESTIONAR));

        Route::middleware($permiso(Permisos::DATOS_PRUEBA))->group(function () {
            Route::get('datos-prueba', [DatosPruebaController::class, 'index'])->name('datos-prueba.index');
            Route::post('datos-prueba/poblar', [DatosPruebaController::class, 'poblar'])->name('datos-prueba.poblar');
            Route::post('datos-prueba/limpiar', [DatosPruebaController::class, 'limpiar'])->name('datos-prueba.limpiar');
        });
    });
});

// Las estadísticas de eventos están en routes/web.php (/api/eventos/estadisticas)
// porque la pantalla de Inertia las consume con la sesión del usuario.
