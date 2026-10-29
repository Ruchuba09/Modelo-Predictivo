<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProyectoController;
use App\Http\Controllers\AsignacionController;
use App\Http\Controllers\CuadrillaController;
use App\Http\Controllers\EventoController;
use App\Http\Controllers\ModeloPredictivoController;
use App\Http\Controllers\Api\V1 as V1;

Route::prefix('v1')->group(function () {
    Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
        Route::get('/user', fn (Request $r) => new UserResource($r->user()));

        // Rutas fijas antes de las dinámicas
        Route::get('eventos/sin-administrador', [EventoController::class, 'sinAdministrador']);
        Route::get('eventos/estadisticas', [EventoController::class, 'estadisticas']);
        Route::get('modelo-predictivo/tipos', [ModeloPredictivoController::class, 'tipos']);
        Route::get('modelo-predictivo/predicciones', [ModeloPredictivoController::class, 'index']);
        Route::get('proyectos/{proyecto}/predicciones', [ModeloPredictivoController::class, 'show']);

        Route::apiResources([
            'proyectos'    => ProyectoController::class,
            'asignaciones' => AsignacionController::class,
            'cuadrillas'   => CuadrillaController::class,
            'eventos'      => EventoController::class,
            'trabajadores' => TrabajadorController::class,
            'personas'     => \App\Http\Controllers\Api\V1\PersonaController::class,
            'faenas'       => \App\Http\Controllers\Api\V1\FaenaController::class,
            'clientes'     => \App\Http\Controllers\Api\V1\ClienteController::class,
            'areas'        => \App\Http\Controllers\Api\V1\AreaController::class,
            'tipos-obrero' => \App\Http\Controllers\Api\V1\TipoObreroController::class,
        ]);
        Route::apiResources([
            'personas'      => V1\PersonaController::class,
            'clientes'      => V1\ClienteController::class,
            'departamentos' => V1\DepartamentoController::class,
        ]);
        Route::apiResource('faenas', V1\FaenaController::class);
        Route::apiResource('tipos-obrero', V1\TipoObreroController::class)
            ->parameters(['tipos-obrero' => 'tipoObrero']);
        
    });
});
// Las estadísticas de eventos ya NO van aquí: están en routes/web.php
// (/api/eventos/estadisticas) para usar la sesión del usuario con Inertia.
