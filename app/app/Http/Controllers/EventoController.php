<?php

namespace App\Http\Controllers;

use App\Http\Requests\ActualizarEventoRequest;
use App\Http\Requests\CerrarEventoRequest;
use App\Http\Requests\CrearEventoRequest;
use App\Http\Requests\FiltroEventoRequest;
use App\Models\Evento;
use App\Services\EventoService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EventoController extends Controller
{
    public function __construct(
        private readonly EventoService $servicio
    ) {}

    public function dashboard()
    {
        return Inertia::render('dashboard', [
            'datosGrafico' => $this->servicio->obtenerDashboard(),
        ]);
    }

    public function index(FiltroEventoRequest $request)
    {
        $user = Auth::user();

        if (! $user) {
            return redirect()->route('login');
        }

        if (! $user->tieneRol('Administrador', 'Supervisor')) {
            return redirect()->route('eventos.mis-reportes');
        }

        return Inertia::render('Eventos/Index', [
            'eventos' => $this->servicio->listar($request->filtros()),
            'proyectos' => $this->servicio->listarProyectos(),
            'filtros' => $request->filtros(),
        ]);
    }

    public function MisReportes(FiltroEventoRequest $request)
    {
        return Inertia::render('Eventos/MisReportes', [
            'eventos' => $this->servicio->listarMisReportes($request->filtros()),
            'proyectos' => $this->servicio->listarProyectos(),
            'filtros' => $request->filtros(),
        ]);
    }

    public function indexGrafico(FiltroEventoRequest $request)
    {
        $filtros = $request->filtrosGrafico();

        return Inertia::render('dashboard', [
            'datosGrafico' => $this->servicio->listarGrafico($filtros),
            'proyectos' => $this->servicio->listarProyectos(),
            'filtros' => $filtros,
        ]);
    }

    public function create()
    {
        return Inertia::render(
            'Eventos/Create',
            $this->servicio->obtenerDatosFormularioCrear()
        );
    }

    public function store(CrearEventoRequest $request)
    {
        $this->servicio->crear($request->toData());

        $destino = Auth::user()?->tieneRol('Administrador', 'Supervisor')
            ? 'eventos.index'
            : 'eventos.mis-reportes';

        return redirect()->route($destino)->with(
            'success',
            'Reporte creado con éxito'
        );
    }

    public function show(Evento $evento)
    {
        $user = Auth::user();
        abort_unless($user, 401);

        $trabajadorId = $user->trabajador?->id_trabajador;

        if (! $user->tieneRol('Administrador')) {
            $tieneAcceso = $trabajadorId
                && ((int) $evento->id_trabajador === (int) $trabajadorId
                    || ($user->tieneRol('Supervisor')
                        && (int) $evento->id_supervisor === (int) $trabajadorId));

            if (! $tieneAcceso && $user->tieneRol('Supervisor')) {
                $tieneAcceso = $this->servicio->supervisorPuedeVer($evento, (int) $trabajadorId);
            }

            abort_unless($tieneAcceso, 403, 'No tienes permisos para ver este reporte.');
        }

        return Inertia::render('Eventos/Show', [
            'evento' => $this->servicio->obtener($evento),
        ]);
    }

    public function verArchivo(string $archivo)
    {
        return $this->servicio->responderArchivo($archivo);
    }

    public function obtenerEvidencias(Evento $evento)
    {
        return response()->json($this->servicio->obtenerEvidencias($evento));
    }

    public function edit(Evento $evento)
    {
        $user = Auth::user();
        $trabajadorId = $user?->trabajador?->id_trabajador;
        $puedeEditar = $user && ($user->tieneRol('Administrador')
            || ($trabajadorId
                && (int) $evento->id_trabajador === (int) $trabajadorId
                && in_array($evento->estado, ['abierto', 'abierta'], true)));

        abort_unless($puedeEditar, 403, 'No tienes permiso para editar este reporte.');

        return Inertia::render('Eventos/Edit', [
            'evento' => $this->servicio->obtenerParaEditar($evento),
        ]);
    }

    public function update(ActualizarEventoRequest $request, Evento $evento)
    {
        $user = Auth::user();
        $trabajadorId = $user?->trabajador?->id_trabajador;
        $puedeEditar = $user && ($user->tieneRol('Administrador')
            || ($trabajadorId
                && (int) $evento->id_trabajador === (int) $trabajadorId
                && in_array($evento->estado, ['abierto', 'abierta'], true)));

        abort_unless($puedeEditar, 403, 'No tienes permiso para editar este reporte.');

        $this->servicio->actualizar($evento, $request->toData());

        return redirect()->route('eventos.show', $evento->id_evento)
            ->with('success', 'Reporte actualizado con éxito');
    }

    public function tomarReporte(Evento $evento)
    {
        $this->servicio->tomarReporte($evento);

        return redirect()->route('eventos.show', $evento->id_evento);
    }

    public function cerrar(CerrarEventoRequest $request, Evento $evento)
    {
        abort_unless(
            Auth::user()?->tieneRol('Administrador'),
            403,
            'Solo un administrador puede cerrar un reporte.'
        );

        $this->servicio->cerrar($evento, $request->toData());

        return redirect()->route('eventos.show', $evento->id_evento)
            ->with('success', 'Evento cerrado con éxito');
    }

    public function destroy(Evento $evento)
    {
        abort_unless(
            Auth::user()?->tieneRol('Administrador'),
            403,
            'Solo un administrador puede eliminar reportes.'
        );

        $this->servicio->eliminar($evento);

        return redirect()->route('eventos.index');
    }

    public function apiSinAdministrador()
    {
        return response()->json($this->servicio->listarSinAdministrador());
    }
}
