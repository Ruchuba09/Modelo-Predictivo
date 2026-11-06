<?php

use App\Http\Controllers\DepartamentoController;
use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RolController;
use App\Http\Controllers\PermisoController;
use App\Http\Controllers\SituacionCriticaController;
use App\Http\Controllers\EventoController;
use App\Http\Controllers\EventoEstadisticaController;
use App\Http\Controllers\InicioController;
use App\Http\Controllers\ModeloPredictivoPaginaController;
use App\Http\Controllers\ProyectoPaginaController;
use Illuminate\Support\Facades\Route;

Route::get('/', InicioController::class)->name('inicio');

Route::middleware('auth')->group(function () {
    Route::inertia('/portal', 'portal')->name('portal');
    Route::redirect('/reportes', '/eventos/create')->name('reportes');

    // Rutas exclusivas para Administradores
    Route::middleware('role:Administrador')->group(function () {
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

        Route::resource('/trabajadores', TrabajadorController::class)
            ->parameters(['trabajadores' => 'trabajador']);

        Route::resource('/departamentos', DepartamentoController::class);

        // El CRUD de faenas y áreas lo consume el frontend desde /api/v1.
        Route::inertia('/faenas', 'Faenas/Index')->name('faenas.index');

        Route::inertia('/sistema/datos-prueba', 'Sistema/DatosPrueba')->name('sistema.datos-prueba');

        Route::get('/situacion-criticas', [SituacionCriticaController::class, 'index'])->name('situacion-criticas.index');
        Route::get('/situacion-criticas/crear', [SituacionCriticaController::class, 'create'])->name('situacion-criticas.crear');
        Route::post('/situacion-criticas', [SituacionCriticaController::class, 'store'])->name('situacion-criticas.store');
        Route::get('/situacion-criticas/{situacionCritica}', [SituacionCriticaController::class, 'show'])->name('situacion-criticas.show');
        Route::get('/situacion-criticas/{situacionCritica}/editar', [SituacionCriticaController::class, 'edit'])->name('situacion-criticas.editar');
        Route::put('/situacion-criticas/{situacionCritica}', [SituacionCriticaController::class, 'update'])->name('situacion-criticas.update');
        Route::delete('/situacion-criticas/{situacionCritica}', [SituacionCriticaController::class, 'destroy'])->name('situacion-criticas.destroy');

    });

    // Rutas para Administradores y Supervisores
    Route::middleware('role:Administrador,Supervisor')->group(function () {
        // Estadísticas
        Route::get('/eventos/estadisticas', [EventoEstadisticaController::class, 'pagina'])
            ->name('eventos.estadisticas');

        Route::get('/api/eventos/estadisticas', [EventoEstadisticaController::class, 'index'])
            ->name('api.eventos.estadisticas');
        Route::get('/api/eventos/estadisticas/{seccion}', [EventoEstadisticaController::class, 'seccion'])
            ->whereIn('seccion', [
                'resumen', 'distribuciones', 'cruces', 'tendencias', 'tiempos', 'aging',
                'trabajadores', 'hallazgos', 'cierre', 'calidad_datos', 'destacados', 'actividad_reciente',
            ])
            ->name('api.eventos.estadisticas.seccion');

        Route::get('/dashboard', [EventoController::class, 'indexGrafico'])->name('dashboard');

        Route::get('/modelo-predictivo', [ModeloPredictivoPaginaController::class, 'index'])
            ->name('modelo-predictivo.index');
        Route::inertia('/modelo-predictivo/entidades', 'ModeloPredictivo/Entidades')->name('modelo-predictivo.entidades');
        Route::inertia('/modelo-predictivo/calidad', 'ModeloPredictivo/Calidad')->name('modelo-predictivo.calidad');
        Route::inertia('/modelo-predictivo/red-neuronal', 'ModeloPredictivo/RedNeuronal')->name('modelo-predictivo.red-neuronal');
        Route::inertia('/modelo-predictivo/red-neuronal/entrenamiento', 'ModeloPredictivo/EntrenamientoRed')->name('modelo-predictivo.red-neuronal.entrenamiento');
        Route::inertia('/modelo-predictivo/historial', 'ModeloPredictivo/Historial')->name('modelo-predictivo.historial');
        Route::get('/modelo-predictivo/proyectos/{proyecto}/evento-estimado', [ModeloPredictivoPaginaController::class, 'eventoEstimado'])
            ->name('modelo-predictivo.evento-estimado');

        Route::inertia('/proyectos', 'proyectos/Index')->name('proyectos.index');
        Route::inertia('/proyectos/create', 'proyectos/Create')->name('proyectos.create');
        Route::get('/proyectos/{id}', [ProyectoPaginaController::class, 'show'])
            ->whereNumber('id')
            ->name('proyectos.show');

        // El CRUD de cuadrillas lo consume el frontend desde /api/v1/cuadrillas.
        Route::inertia('/cuadrillas', 'Cuadrillas/Index')->name('cuadrillas.index');
        Route::inertia('/fuentes-intrava', 'Intrava/Index')->name('intrava.index');
        Route::inertia('/actividades', 'Actividades/Index')->name('actividades.index');
        Route::inertia('/exposicion', 'Exposicion/Index')->name('exposicion.index');
    });

    // Eventos y reportes
    Route::get('/eventos/mis-reportes', [EventoController::class, 'misReportes'])
        ->name('eventos.mis-reportes');

    Route::resource('eventos', EventoController::class)
        ->only(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy'])
        ->whereNumber('evento');

    Route::get('/eventos/{evento}/archivos/{archivo}', [EventoController::class, 'verArchivo'])
        ->whereNumber('evento')
        ->name('eventos.archivo');
    Route::get('/eventos/{evento}/evidencias', [EventoController::class, 'obtenerEvidencias'])
        ->whereNumber('evento')
        ->name('eventos.evidencias');

    Route::patch('/eventos/{evento}/tomar', [EventoController::class, 'tomarReporte'])
        ->whereNumber('evento')
        ->name('eventos.tomar');
    Route::patch('/eventos/{evento}/cerrar', [EventoController::class, 'cerrar'])
        ->whereNumber('evento')
        ->name('eventos.cerrar');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
