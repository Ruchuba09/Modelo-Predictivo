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
    
Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';