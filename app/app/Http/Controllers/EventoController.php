<?php

namespace App\Http\Controllers;

use App\Http\Requests\ActualizarEventoRequest;
use App\Http\Requests\CerrarEventoRequest;
use App\Http\Requests\CrearEventoRequest;
use App\Http\Requests\FiltroEventoRequest;
use App\Models\Evento;
use App\Services\EventoService;
use App\Services\EvidenciaEventoService;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Pantallas Inertia de eventos. La autorización de cada evento está en
 * App\Policies\EventoPolicy (compartida con Api\V1\EventoController).
 */
class EventoController extends Controller
{
    public function __construct(
        private readonly EventoService $servicio,
        private readonly EvidenciaEventoService $evidencias,
    ) {}

    public function index(FiltroEventoRequest $request)
    {
        // Quien no puede ver el listado general va a sus propios reportes.
        if ($request->user()->cannot('viewAny', Evento::class)) {
            return redirect()->route('eventos.mis-reportes');
        }

        return Inertia::render('Eventos/Index', [
            'eventos' => $this->servicio->paginarParaPantalla($request->filtros(), $request->porPagina()),
            'proyectos' => $this->servicio->listarProyectos(),
            'filtros' => $request->filtros(),
        ]);
    }

    public function misReportes(FiltroEventoRequest $request)
    {
        return Inertia::render('Eventos/MisReportes', [
            'eventos' => $this->servicio->paginarMisReportesParaPantalla($request->filtros(), $request->porPagina()),
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
        $this->authorize('create', Evento::class);

        return Inertia::render(
            'Eventos/Create',
            $this->servicio->obtenerDatosFormularioCrear()
        );
    }

    public function store(CrearEventoRequest $request)
    {
        $this->authorize('create', Evento::class);

        $this->servicio->crear($request->toData());

        $destino = $request->user()->can('viewAny', Evento::class)
            ? 'eventos.index'
            : 'eventos.mis-reportes';

        return redirect()->route($destino)->with(
            'success',
            'Reporte creado con éxito'
        );
    }

    public function show(Evento $evento)
    {
        $this->authorize('view', $evento);

        return Inertia::render('Eventos/Show', [
            'evento' => $this->servicio->obtener($evento),
            'puedeEditar' => request()->user()->can('update', $evento),
            'catalogos' => $this->servicio->catalogos(),
        ]);
    }

    public function verArchivo(Evento $evento, string $archivo)
    {
        $this->authorize('view', $evento);

        return $this->evidencias->responder($evento, $archivo);
    }

    public function obtenerEvidencias(Evento $evento)
    {
        $this->authorize('view', $evento);

        return response()->json($this->evidencias->listar($evento));
    }

    public function edit(Evento $evento)
    {
        $this->authorize('update', $evento);

        return Inertia::render('Eventos/Edit', [
            'evento' => $this->servicio->obtenerParaEditar($evento),
        ]);
    }

    public function update(ActualizarEventoRequest $request, Evento $evento)
    {
        $this->authorize('update', $evento);

        $this->servicio->actualizar($evento, $request->toData());

        return redirect()->route('eventos.show', $evento->id_evento)
            ->with('success', 'Reporte actualizado con éxito');
    }

    public function tomarReporte(Evento $evento)
    {
        $this->authorize('tomar', $evento);

        $this->servicio->tomarReporte($evento);

        return redirect()->route('eventos.show', $evento->id_evento);
    }

    public function cerrar(CerrarEventoRequest $request, Evento $evento)
    {
        $this->authorize('cerrar', $evento);

        $this->servicio->cerrar($evento, $request->toData());

        return redirect()->route('eventos.show', $evento->id_evento)
            ->with('success', 'Evento cerrado con éxito');
    }

    public function destroy(Request $request, Evento $evento)
    {
        $this->authorize('delete', $evento);

        $this->servicio->eliminar($evento);

        return redirect()->route('eventos.index');
    }
}
