<?php

use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RolController;
use App\Http\Controllers\PermisoController;
use App\Http\Controllers\ModeloTarjetaPareController;
use App\Http\Controllers\EscalaRiesgoController;
use App\Http\Controllers\TarjetaPareController;
use Illuminate\Support\Facades\Route;
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


    Route::get('/escala-riesgo', [EscalaRiesgoController::class, 'index'])->name('escala-riesgo.index');
    Route::get('/escala-riesgo/crear', [EscalaRiesgoController::class, 'create'])->name('escala-riesgo.crear');
    Route::post('/escala-riesgo', [EscalaRiesgoController::class, 'store'])->name('escala-riesgo.store');
    Route::get('/escala-riesgo/{escala}', [EscalaRiesgoController::class, 'show'])->name('escala-riesgo.show');
    Route::get('/escala-riesgo/{escala}/editar', [EscalaRiesgoController::class, 'edit'])->name('escala-riesgo.editar');
    Route::put('/escala-riesgo/{escala}', [EscalaRiesgoController::class, 'update'])->name('escala-riesgo.update');
    Route::delete('/escala-riesgo/{escala}', [EscalaRiesgoController::class, 'destroy'])->name('escala-riesgo.destroy');

    Route::get('/modelo-tarjeta', [ModeloTarjetaPareController::class, 'index'])->name('modelo-tarjeta.index');
    Route::get('/modelo-tarjeta/crear', [ModeloTarjetaPareController::class, 'create'])->name('modelo-tarjeta.crear');
    Route::post('/modelo-tarjeta', [ModeloTarjetaPareController::class, 'store'])->name('modelo-tarjeta.store');
    Route::get('/modelo-tarjeta/{modelo}', [ModeloTarjetaPareController::class, 'show'])->name('modelo-tarjeta.show');
    Route::get('/modelo-tarjeta/{modelo}/editar', [ModeloTarjetaPareController::class, 'edit'])->name('modelo-tarjeta.editar');
    Route::put('/modelo-tarjeta/{modelo}', [ModeloTarjetaPareController::class, 'update'])->name('modelo-tarjeta.update');
    Route::delete('/modelo-tarjeta/{modelo}', [ModeloTarjetaPareController::class, 'destroy'])->name('modelo-tarjeta.destroy');

    Route::get('/tarjetas-pare', [TarjetaPareController::class, 'index'])->name('tarjetas-pare.index');
    Route::get('/tarjetas-pare/crear', [TarjetaPareController::class, 'create'])->name('tarjetas-pare.crear');
    Route::post('/tarjetas-pare', [TarjetaPareController::class, 'store'])->name('tarjetas-pare.store');
    Route::get('/tarjetas-pare/{tarjeta}', [TarjetaPareController::class, 'show'])->name('tarjetas-pare.show');
    Route::get('/tarjetas-pare/{tarjeta}/editar', [TarjetaPareController::class, 'edit'])->name('tarjetas-pare.editar');
    Route::put('/tarjetas-pare/{tarjeta}', [TarjetaPareController::class, 'update'])->name('tarjetas-pare.update');
    Route::delete('/tarjetas-pare/{tarjeta}', [TarjetaPareController::class, 'destroy'])->name('tarjetas-pare.destroy');
});



Route::resource('trabajadores', TrabajadorController::class)
    ->parameters(['trabajadores' => 'trabajador']);

Route::get('/portal', function () {
    return Inertia::render('portal');
});

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->name('dashboard');

Route::get('/reportes', function () {
    return Inertia::render('reportes');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';