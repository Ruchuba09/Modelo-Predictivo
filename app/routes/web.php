<?php

use App\Http\Controllers\TrabajadorController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/login2', function () {
    return Inertia::render('login2');
})->name('login2');

Route::resource('trabajadores', TrabajadorController::class)
    ->parameters(['trabajadores' => 'trabajador']);
    
    Route::get('/portal', function () {
        return Inertia::render('portal');
    });
    
Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->name('dashboard');

Route::get('/usuarios', function () {
    return Inertia::render('usuarios');
})->name('usuarios');

Route::get('/reportes', function () {
    return Inertia::render('reportes');
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';