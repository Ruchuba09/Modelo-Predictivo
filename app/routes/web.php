<?php

use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RolController;
use App\Http\Controllers\PermisoController;

use App\Http\Controllers\SituacionCriticaController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EventoController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/test-auth', function () {
    return response()->json([
        'authenticated' => Auth::check(),
        'user' => Auth::user(),
    ]);
})->middleware('auth');

Route::middleware('auth')->group(function () {
    Route::get('/usuarios', [UserController::class, 'index'])->name('usuarios.index');
    Route::get('/usuarios/crear', [UserController::class, 'create'])->name('usuarios.crear');
    Route::post('/usuarios', [UserController::class, 'store'])->name('usuarios.store');
    Route::get('/usuarios/{usuario}', [UserController::class, 'show'])->name('usuarios.show');
    Route::get('/usuarios/{usuario}/editar', [UserController::class, 'edit'])->name('usuarios.editar');
    Route::put('/usuarios/{usuario}', [UserController::class, 'update'])->name('usuarios.update');
    Route::delete('/usuarios/{usuario}', [UserController::class, 'destroy'])->name('usuarios.destroy');
    
    Route::get('/roles', [RolController::class, 'index'])->name('roles.index');
    Route::get('/roles/crear', [RolController::class, 'create'])->name('roles.crear');
    Route::post('/roles', [RolController::class, 'store'])->name('roles.store');
    Route::get('/roles/{rol}', [RolController::class, 'show'])->name('roles.show');
    Route::get('/roles/{rol}/editar', [RolController::class, 'edit'])->name('roles.editar');
    Route::put('/roles/{rol}', [RolController::class, 'update'])->name('roles.update');
    Route::delete('/roles/{rol}', [RolController::class, 'destroy'])->name('roles.destroy');

    Route::get('/permisos', [PermisoController::class, 'index'])->name('permisos.index');
    Route::get('/permisos/crear', [PermisoController::class, 'create'])->name('permisos.crear');
    Route::post('/permisos', [PermisoController::class, 'store'])->name('permisos.store');
    Route::get('/permisos/{permiso}', [PermisoController::class, 'show'])->name('permisos.show');
    Route::get('/permisos/{permiso}/editar', [PermisoController::class, 'edit'])->name('permisos.editar');
    Route::put('/permisos/{permiso}', [PermisoController::class, 'update'])->name('permisos.update');
    Route::delete('/permisos/{permiso}', [PermisoController::class, 'destroy'])->name('permisos.destroy');

    Route::get('/dashboard', [EventoController::class, 'indexGrafico'])->name('dashboard');

    Route::resource('/trabajadores', TrabajadorController::class)
    ->parameters(['trabajadores' => 'trabajador']);

    Route::resource('eventos', EventoController::class)->only(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy']);
    Route::patch('/eventos/{evento}/tomar', [EventoController::class, 'tomarReporte'])->name('eventos.tomar');
    Route::patch('/eventos/{evento}/cerrar', [EventoController::class, 'cerrar'])->name('eventos.cerrar');
    
    Route::get('/situacion-criticas', [SituacionCriticaController::class, 'index'])->name('situacion-criticas.index');
    Route::get('/situacion-criticas/crear', [SituacionCriticaController::class, 'create'])->name('situacion-criticas.crear');
    Route::post('/situacion-criticas', [SituacionCriticaController::class, 'store'])->name('situacion-criticas.store');
    Route::get('/situacion-criticas/{situacionCritica}', [SituacionCriticaController::class, 'show'])->name('situacion-criticas.show');
    Route::get('/situacion-criticas/{situacionCritica}/editar', [SituacionCriticaController::class, 'edit'])->name('situacion-criticas.editar');
    Route::put('/situacion-criticas/{situacionCritica}', [SituacionCriticaController::class, 'update'])->name('situacion-criticas.update');
    Route::delete('/situacion-criticas/{situacionCritica}', [SituacionCriticaController::class, 'destroy'])->name('situacion-criticas.destroy');
});

Route::get('/portal', function () {
    return Inertia::render('portal');
});



Route::get('/reportes', function () {
    return Inertia::render('reportes');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';