<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProyectoController;
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::apiResource('proyectos', ProyectoController::class);
Route::apiResource('asignaciones', AsignacionController::class);
Route::apiResource('eventos', AsignacionController::class);

Route::get('/eventos/sin-administrador', [
    EventoController::class,
    'apiSinAdministrador'
]);
