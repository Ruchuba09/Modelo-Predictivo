<?php

use App\Http\Controllers\Api\V1\AreaController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ClienteController;
use App\Http\Controllers\Api\V1\DepartamentoController;
use App\Http\Controllers\Api\V1\EventoController as ApiEventoController;
use App\Http\Controllers\Api\V1\FaenaController;
use App\Http\Controllers\Api\V1\PermisoController as ApiPermisoController;
use App\Http\Controllers\Api\V1\PersonaController;
use App\Http\Controllers\Api\V1\RolController as ApiRolController;
use App\Http\Controllers\Api\V1\SituacionCriticaController as ApiSituacionCriticaController;
use App\Http\Controllers\Api\V1\TipoEventoController as ApiTipoEventoController;
use App\Http\Controllers\Api\V1\TipoObreroController;
use App\Http\Controllers\Api\V1\TrabajadorController as ApiTrabajadorController;
use App\Http\Controllers\Api\V1\UsuarioController as ApiUsuarioController;
use App\Http\Controllers\AsignacionController;
use App\Http\Controllers\CuadrillaController;
use App\Http\Controllers\EvidenciaController;
use App\Http\Controllers\EventoEstadisticaController;
use App\Http\Controllers\ProyectoController;
use App\Http\Resources\UsuarioResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:api')->name('auth.login');

    Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('/user', fn (Request $request) => new UsuarioResource($request->user()->load('roles')))->name('user');

        // Las rutas fijas deben declararse antes que los recursos con {evento}.
        Route::get('eventos/sin-administrador', [ApiEventoController::class, 'sinAdministrador'])->middleware('permission:eventos.ver')->name('eventos.sin-administrador');
        Route::get('eventos/mis-reportes', [ApiEventoController::class, 'misReportes'])->middleware('permission:eventos.mis-reportes')->name('eventos.mis-reportes');
        Route::get('eventos/opciones', [ApiEventoController::class, 'opciones'])->middleware('permission:eventos.crear')->name('eventos.opciones');
        Route::get('eventos/{evento}/evidencias', [ApiEventoController::class, 'evidencias'])
            ->whereNumber('evento')->middleware('permission:eventos.ver')->name('eventos.evidencias');
        Route::get('eventos/estadisticas', [EventoEstadisticaController::class, 'index'])->middleware('permission:eventos.estadisticas')->name('eventos.estadisticas');
        Route::get('eventos/estadisticas/{seccion}', [EventoEstadisticaController::class, 'seccion'])
            ->whereIn('seccion', [
                'resumen', 'distribuciones', 'cruces', 'tendencias', 'tiempos', 'aging',
                'trabajadores', 'hallazgos', 'cierre', 'calidad_datos', 'destacados', 'actividad_reciente',
            ])->middleware('permission:eventos.estadisticas')->name('eventos.estadisticas.seccion');
        Route::patch('eventos/{evento}/tomar', [ApiEventoController::class, 'tomar'])
            ->whereNumber('evento')->middleware('permission:eventos.tomar')->name('eventos.tomar');
        Route::patch('eventos/{evento}/cerrar', [ApiEventoController::class, 'cerrar'])
            ->whereNumber('evento')->middleware('permission:eventos.cerrar')->name('eventos.cerrar');
        Route::get('cuadrillas/supervisores', [CuadrillaController::class, 'supervisores'])->middleware('permission:cuadrillas.ver')->name('cuadrillas.supervisores');

        Route::apiResources([
            'personas' => PersonaController::class,
            'faenas' => FaenaController::class,
            'clientes' => ClienteController::class,
            'areas' => AreaController::class,
            'departamentos' => DepartamentoController::class,
        ]);

        Route::apiResource('proyectos', ProyectoController::class)
            ->middlewareFor(['index', 'show'], 'permission:proyectos.ver')
            ->middlewareFor('store', 'permission:proyectos.crear')
            ->middlewareFor('update', 'permission:proyectos.editar')
            ->middlewareFor('destroy', 'permission:proyectos.eliminar');
        Route::apiResource('cuadrillas', CuadrillaController::class)
            ->middlewareFor(['index', 'show'], 'permission:cuadrillas.ver')
            ->middlewareFor('store', 'permission:cuadrillas.crear')
            ->middlewareFor('update', 'permission:cuadrillas.editar')
            ->middlewareFor('destroy', 'permission:cuadrillas.eliminar');
        Route::apiResource('eventos', ApiEventoController::class)
            ->middlewareFor(['index', 'show'], 'permission:eventos.ver')
            ->middlewareFor('store', 'permission:eventos.crear')
            ->middlewareFor('update', 'permission:eventos.editar')
            ->middlewareFor('destroy', 'permission:eventos.eliminar');
        Route::apiResource('trabajadores', ApiTrabajadorController::class)
            ->parameters(['trabajadores' => 'trabajador'])
            ->middlewareFor(['index', 'show'], 'permission:trabajadores.ver')
            ->middlewareFor('store', 'permission:trabajadores.crear')
            ->middlewareFor('update', 'permission:trabajadores.editar')
            ->middlewareFor('destroy', 'permission:trabajadores.eliminar');

        Route::apiResource('asignaciones', AsignacionController::class)
            ->parameters(['asignaciones' => 'asignacion']);
        Route::apiResource('tipos-obrero', TipoObreroController::class)
            ->parameters(['tipos-obrero' => 'tipoObrero']);

        Route::apiResource('tipos-evento', ApiTipoEventoController::class)
            ->parameters(['tipos-evento' => 'tipoEvento']);
        Route::apiResource('usuarios', ApiUsuarioController::class)
            ->parameters(['usuarios' => 'usuario'])
            ->middlewareFor(['index', 'show'], 'permission:usuarios.ver')
            ->middlewareFor('store', 'permission:usuarios.crear')
            ->middlewareFor('update', 'permission:usuarios.editar')
            ->middlewareFor('destroy', 'permission:usuarios.eliminar');
        Route::apiResource('roles', ApiRolController::class)
            ->parameters(['roles' => 'rol'])
            ->middleware('permission:roles.gestionar');
        Route::apiResource('permisos', ApiPermisoController::class)
            ->parameters(['permisos' => 'permiso'])
            ->middleware('permission:roles.gestionar');
        Route::apiResource('situacion-criticas', ApiSituacionCriticaController::class)
            ->parameters(['situacion-criticas' => 'situacionCritica']);
        Route::apiResource('evidencias', EvidenciaController::class);
    });
});
