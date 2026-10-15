<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProyectoController;
use App\Http\Controllers\AsignacionController;
use App\Http\Controllers\CuadrillaController;
use App\Http\Controllers\EventoController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::apiResource('proyectos', ProyectoController::class);
Route::apiResource('asignaciones', AsignacionController::class);

// Las rutas con texto fijo van ANTES del apiResource('eventos'),
// si no "sin-administrador" se interpreta como /eventos/{evento}.
Route::get('/eventos/sin-administrador', [
    EventoController::class,
    'apiSinAdministrador',
]);

// REVISAR: esta línea apuntaba a AsignacionController (parece un error de copia).
// Si querías EventoController, cambia la clase; si no la usas, bórrala.
Route::apiResource('eventos', AsignacionController::class)
    ->whereNumber('evento');

// Las estadísticas de eventos ya NO van aquí: están en routes/web.php
// (/api/eventos/estadisticas) para usar la sesión del usuario con Inertia.
