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
use App\Support\Permisos;
use Illuminate\Support\Facades\Route;

/*
| Cada sección exige un Permiso del catálogo App\Support\Permisos (CA-1).
| Quien no lo tiene vuelve al portal con "No tienes permiso para acceder a
| esta sección." El rol Administrador tiene todos los permisos.
*/
$permiso = fn (string ...$permisos) => 'permission:'.implode(',', $permisos);
$registroNoValido = fn (string $listado) => fn () => redirect()->route($listado)
    ->with('error', 'El registro seleccionado no es válido.');

Route::get('/', InicioController::class)->name('inicio');

Route::middleware('auth')->group(function () use ($permiso, $registroNoValido) {
    Route::inertia('/portal', 'portal')->name('portal');
    Route::redirect('/reportes', '/tarjetas-pare/create')->name('reportes');

    /* ----------------------------- Usuarios ----------------------------- */
    Route::middleware($permiso(Permisos::USUARIOS_GESTIONAR))->group(function () {
        Route::get('/usuarios', [UserController::class, 'index'])->name('usuarios.index');
        Route::get('/usuarios/crear', [UserController::class, 'create'])->name('usuarios.crear');
        Route::post('/usuarios', [UserController::class, 'store'])->name('usuarios.store');
        Route::get('/usuarios/{usuario}', [UserController::class, 'show'])->name('usuarios.show');
        Route::get('/usuarios/{usuario}/editar', [UserController::class, 'edit'])->name('usuarios.editar');
        Route::put('/usuarios/{usuario}', [UserController::class, 'update'])->name('usuarios.update');
        Route::delete('/usuarios/{usuario}', [UserController::class, 'destroy'])->name('usuarios.destroy');
    });

    /* -------- Roles (RF-19 a RF-22). Un rol inexistente vuelve al listado (RF-21.3.2). -------- */
    Route::middleware($permiso(Permisos::ROLES_GESTIONAR))->group(function () use ($registroNoValido) {
        Route::get('/roles', [RolController::class, 'index'])->name('roles.index');
        Route::get('/roles/crear', [RolController::class, 'create'])->name('roles.crear');
        Route::post('/roles', [RolController::class, 'store'])->name('roles.store');
        Route::controller(RolController::class)->whereNumber('rol')->group(function () use ($registroNoValido) {
            $noValido = $registroNoValido('roles.index');

            Route::get('/roles/{rol}', 'show')->name('roles.show')->missing($noValido);
            Route::get('/roles/{rol}/editar', 'edit')->name('roles.editar')->missing($noValido);
            Route::put('/roles/{rol}', 'update')->name('roles.update')->missing($noValido);
            Route::delete('/roles/{rol}', 'destroy')->name('roles.destroy')->missing($noValido);
        });
    });

    /* ---- Permisos (RF-23 a RF-26). Un permiso inexistente vuelve al listado (RF-25.3.2). ---- */
    Route::middleware($permiso(Permisos::PERMISOS_GESTIONAR))->group(function () use ($registroNoValido) {
        Route::get('/permisos', [PermisoController::class, 'index'])->name('permisos.index');
        Route::get('/permisos/crear', [PermisoController::class, 'create'])->name('permisos.crear');
        Route::post('/permisos', [PermisoController::class, 'store'])->name('permisos.store');
        Route::controller(PermisoController::class)->whereNumber('permiso')->group(function () use ($registroNoValido) {
            $noValido = $registroNoValido('permisos.index');

            Route::get('/permisos/{permiso}', 'show')->name('permisos.show')->missing($noValido);
            Route::get('/permisos/{permiso}/editar', 'edit')->name('permisos.editar')->missing($noValido);
            Route::put('/permisos/{permiso}', 'update')->name('permisos.update')->missing($noValido);
            Route::delete('/permisos/{permiso}', 'destroy')->name('permisos.destroy')->missing($noValido);
        });
    });

    /* ----------------------------- Catálogos ----------------------------- */
    Route::middleware($permiso(Permisos::CATALOGOS_GESTIONAR))->group(function () {
        Route::resource('/trabajadores', TrabajadorController::class)
            ->parameters(['trabajadores' => 'trabajador']);

        Route::resource('/departamentos', DepartamentoController::class);

        // El CRUD de faenas y áreas lo consume el frontend desde /api/v1.
        Route::inertia('/faenas', 'Faenas/Index')->name('faenas.index');
    });

    Route::inertia('/sistema/datos-prueba', 'Sistema/DatosPrueba')
        ->middleware($permiso(Permisos::DATOS_PRUEBA))->name('sistema.datos-prueba');

    /* ------------------------ Situaciones Críticas ------------------------ */
    // Registro y edición manual (RF-14.2, RF-15.2). Sin eliminación (RF-15.6).
    // Se registran antes que la consulta para que '/crear' no la capture '{situacionCritica}'.
    Route::middleware($permiso(Permisos::SITUACIONES_GESTIONAR))->group(function () {
        Route::get('/situacion-criticas/crear', [SituacionCriticaController::class, 'create'])->name('situacion-criticas.crear');
        Route::post('/situacion-criticas', [SituacionCriticaController::class, 'store'])->name('situacion-criticas.store');
        Route::get('/situacion-criticas/{situacionCritica}/editar', [SituacionCriticaController::class, 'edit'])->name('situacion-criticas.editar');
        Route::put('/situacion-criticas/{situacionCritica}', [SituacionCriticaController::class, 'update'])->name('situacion-criticas.update');
    });

    // Consulta (RF-16). La autoriza SituacionCriticaPolicy, que entrega el mensaje de RF-16.1.1:
    // situaciones.ver-todas ve todas y situaciones.ver solo las suyas.
    Route::get('/situacion-criticas', [SituacionCriticaController::class, 'index'])->name('situacion-criticas.index');
    Route::get('/situacion-criticas/{situacionCritica}', [SituacionCriticaController::class, 'show'])
        ->whereNumber('situacionCritica')->name('situacion-criticas.show');

    /* ---------------------------- Estadísticas ---------------------------- */
    Route::middleware($permiso(Permisos::ESTADISTICAS_VER))->group(function () {
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
    });

    Route::get('/dashboard', [EventoController::class, 'indexGrafico'])
        ->middleware($permiso(Permisos::DASHBOARD_VER))->name('dashboard');

    /* -------------------------- Modelo predictivo -------------------------- */
    Route::middleware($permiso(Permisos::MODELO_VER))->group(function () {
        Route::get('/modelo-predictivo', [ModeloPredictivoPaginaController::class, 'index'])
            ->name('modelo-predictivo.index');
        Route::inertia('/modelo-predictivo/entidades', 'ModeloPredictivo/Entidades')->name('modelo-predictivo.entidades');
        Route::inertia('/modelo-predictivo/calidad', 'ModeloPredictivo/Calidad')->name('modelo-predictivo.calidad');
        Route::inertia('/modelo-predictivo/red-neuronal', 'ModeloPredictivo/RedNeuronal')->name('modelo-predictivo.red-neuronal');
        Route::inertia('/modelo-predictivo/red-neuronal/pruebas', 'ModeloPredictivo/PruebaRed')->name('modelo-predictivo.red-neuronal.pruebas');
        Route::inertia('/modelo-predictivo/historial', 'ModeloPredictivo/Historial')->name('modelo-predictivo.historial');
        Route::get('/modelo-predictivo/proyectos/{proyecto}/evento-estimado', [ModeloPredictivoPaginaController::class, 'eventoEstimado'])
            ->name('modelo-predictivo.evento-estimado');
    });
    Route::inertia('/modelo-predictivo/red-neuronal/entrenamiento', 'ModeloPredictivo/EntrenamientoRed')
        ->middleware($permiso(Permisos::MODELO_ENTRENAR))->name('modelo-predictivo.red-neuronal.entrenamiento');

    /* ------------------------ Gestión operativa ------------------------ */
    // Los CRUD los consume el frontend desde /api/v1, que exige operaciones.gestionar para escribir.
    Route::middleware($permiso(Permisos::OPERACIONES_VER, Permisos::OPERACIONES_GESTIONAR))->group(function () {
        Route::inertia('/proyectos', 'proyectos/Index')->name('proyectos.index');
        Route::get('/proyectos/{id}', [ProyectoPaginaController::class, 'show'])
            ->whereNumber('id')
            ->name('proyectos.show');
        Route::inertia('/cuadrillas', 'Cuadrillas/Index')->name('cuadrillas.index');
        Route::inertia('/actividades', 'Actividades/Index')->name('actividades.index');
        Route::inertia('/exposicion', 'Exposicion/Index')->name('exposicion.index');
    });
    Route::inertia('/proyectos/create', 'proyectos/Create')
        ->middleware($permiso(Permisos::OPERACIONES_GESTIONAR))->name('proyectos.create');

    Route::inertia('/fuentes-intrava', 'Intrava/Index')
        ->middleware($permiso(Permisos::INTRAVA_VER))->name('intrava.index');

    /* ------------------------- Eventos y reportes ------------------------- */
    // Cualquier usuario reporta y ve los suyos; EventoPolicy autoriza el resto.
    Route::get('/eventos/mis-reportes', [EventoController::class, 'misReportes'])
        ->name('eventos.mis-reportes');

    // Registro de Tarjeta PARE (RF-9); los demás tipos usan eventos.create (RF-10).
    Route::get('/tarjetas-pare/create', [EventoController::class, 'createTarjetaPare'])
        ->name('tarjetas-pare.create');
    Route::post('/tarjetas-pare', [EventoController::class, 'storeTarjetaPare'])
        ->name('tarjetas-pare.store');

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
