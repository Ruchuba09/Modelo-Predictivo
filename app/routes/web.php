<?php

use App\Http\Controllers\DepartamentoController;
use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RolController;
use App\Http\Controllers\PermisoController;
use App\Http\Controllers\CuadrillaController;
use App\Http\Controllers\SituacionCriticaController;
use App\Http\Controllers\EventoController;
use App\Http\Controllers\EventoEstadisticaController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Inertia\Inertia;

Route::get('/', function () {
    return Auth::check() ? redirect()->route('portal') : redirect()->route('login');
});

Route::get('/test-auth', function () {
    return response()->json([
        'authenticated' => Auth::check(),
        'user' => Auth::user(),
    ]);
})->middleware('auth');

Route::middleware('auth')->group(function () {
    Route::get('/portal', function () {
        return Inertia::render('portal');
    })->name('portal');

    Route::get('/reportes', function () {
        return Inertia::render('reportes');
    });

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
        Route::get('/eventos/estadisticas', function (\Illuminate\Http\Request $request) {
            return Inertia::render('Eventos/EventosEstadisticas', [
                'proyectos' => \App\Models\Proyecto::select('id_proyecto', 'nombre')->get(),
                'filtrosIniciales' => $request->all(),
            ]);
        })->name('eventos.estadisticas');

        Route::get('/api/eventos/estadisticas', [EventoEstadisticaController::class, 'index'])
            ->name('api.eventos.estadisticas');
        Route::get('/api/eventos/estadisticas/{seccion}', [EventoEstadisticaController::class, 'seccion'])
            ->whereIn('seccion', [
                'resumen', 'distribuciones', 'cruces', 'tendencias', 'tiempos', 'aging',
                'trabajadores', 'hallazgos', 'cierre', 'calidad_datos', 'destacados', 'actividad_reciente',
            ])
            ->name('api.eventos.estadisticas.seccion');

        Route::get('/dashboard', [EventoController::class, 'indexGrafico'])->name('dashboard');

        Route::get('/modelo-predictivo', function () {
            return Inertia::render('ModeloPredictivo/Index', [
                'proyectos' => \App\Models\Proyecto::select('id_proyecto', 'nombre')->get(),
            ]);
        })->name('modelo-predictivo.index');

        Route::get('/modelo-predictivo/proyectos/{proyecto}/evento-estimado', function (Request $request, \App\Models\Proyecto $proyecto) {
            $filtros = $request->validate([
                'tipo_objetivo' => ['sometimes', 'string', 'max:100'],
                'horizonte' => ['sometimes', 'integer', 'between:1,52'],
            ]);

            return Inertia::render('ModeloPredictivo/DetalleEventoEstimado', [
                'proyecto' => $proyecto->only(['id_proyecto', 'nombre']),
                'tipoObjetivo' => $filtros['tipo_objetivo'] ?? 'todos',
                'horizonte' => (int) ($filtros['horizonte'] ?? 4),
            ]);
        })->name('modelo-predictivo.evento-estimado');

        Route::get('/proyectos', function () {
            return Inertia::render('proyectos/Index');
        })->name('proyectos.index');
        Route::get('/proyectos/create', function () {
            return Inertia::render('proyectos/Create');
        })->name('proyectos.create');
        Route::get('/proyectos/{id}', function ($id) {
            return Inertia::render('proyectos/Show', [
                'id' => $id,
            ]);
        })->name('proyectos.show');

        Route::get('/cuadrillas', fn () => Inertia::render('Cuadrillas/Index'))
            ->name('cuadrillas.index');
        Route::get('/api/cuadrillas/supervisores', [CuadrillaController::class, 'supervisores']);
        Route::apiResource('/api/cuadrillas', CuadrillaController::class)
            ->parameters(['cuadrillas' => 'cuadrilla'])
            ->whereNumber('cuadrilla')
            ->names('api.cuadrillas');
    });

    // Eventos y reportes
    Route::get('/eventos/mis-reportes', [EventoController::class, 'MisReportes'])
        ->name('eventos.mis-reportes');

    Route::resource('eventos', EventoController::class)
        ->only(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy'])
        ->whereNumber('evento');

    Route::get('/eventos/archivo/{archivo}', [EventoController::class, 'verArchivo'])
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
