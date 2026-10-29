<?php

namespace App\Http\Controllers;

use App\Http\Requests\ActualizarEventoRequest;
use App\Http\Requests\CerrarEventoRequest;
use App\Http\Requests\CrearEventoRequest;
use App\Http\Requests\FiltroEventoRequest;
use App\Models\Evento;
use App\Services\EventoService;
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
        return Inertia::render('Eventos/Index', [
            'eventos' => $this->servicio->listar(
                $request->filtros()
            ),
            'proyectos' => $this->servicio->listarProyectos(),
            'filtros' => $request->filtros(),
        ]);
    }

    public function MisReportes(FiltroEventoRequest $request)
    {
        return Inertia::render('Eventos/MisReportes', [
            'eventos' => $this->servicio->listarMisReportes(
                $request->filtros()
            ),
            'proyectos' => $this->servicio->listarProyectos(),
            'filtros' => $request->filtros(),
        ]);
    }

    public function indexGrafico(FiltroEventoRequest $request)
    {
        return Inertia::render('dashboard', [
            'datosGrafico' => $this->servicio->listarGrafico(
                $request->filtrosGrafico()
            ),
            'proyectos' => $this->servicio->listarProyectos(),
            'filtros' => $request->filtrosGrafico(),
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

        return redirect()
            ->route('eventos.index')
            ->with('success', 'Reporte creado con éxito');
    }

    public function show(Evento $evento)
    {
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
        return response()->json(
            $this->servicio->obtenerEvidencias($evento)
        );
    }

    public function edit(Evento $evento)
    {
        return Inertia::render('Eventos/Edit', [
            'evento' => $this->servicio->obtenerParaEditar($evento),
        ]);
    }

    public function update(
        ActualizarEventoRequest $request,
        Evento $evento
    ) {
        $this->servicio->actualizar(
            $evento,
            $request->toData()
        );

        return redirect()->route(
            'eventos.show',
            $evento->id_evento
        );
    }

    public function tomarReporte(Evento $evento)
    {
        $this->servicio->tomarReporte($evento);

        return redirect()->route(
            'eventos.show',
            $evento->id_evento
        );
    }

    public function cerrar(
        CerrarEventoRequest $request,
        Evento $evento
    ) {
        $this->servicio->cerrar(
            $evento,
            $request->toData()
        );

        return redirect()
            ->route('eventos.show', $evento->id_evento)
            ->with('success', 'Evento cerrado con éxito');
    }

    public function destroy(Evento $evento)
    {
        $this->servicio->eliminar($evento);

        return redirect()->route('eventos.index');
    }

    public function apiSinAdministrador()
    {
        return response()->json(
            $this->servicio->listarSinAdministrador()
        );
    }
}
