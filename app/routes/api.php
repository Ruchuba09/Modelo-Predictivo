<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProyectoController;
use App\Http\Controllers\AsignacionController;
use App\Http\Controllers\CuadrillaController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::apiResource('proyectos', ProyectoController::class);
Route::apiResource('asignaciones', AsignacionController::class);
Route::apiResource('cuadrillas', CuadrillaController::class);