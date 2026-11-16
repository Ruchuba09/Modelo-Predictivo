<?php

namespace App\Http\Controllers;

use App\Http\Requests\ActualizarEventoRequest;
use App\Http\Requests\CerrarEventoRequest;
use App\Http\Requests\CrearEventoRequest;
use App\Http\Requests\CrearTarjetaPareRequest;
use App\Http\Requests\FiltroEventoRequest;
use App\Http\Requests\RegistrarEventoRequest;
use App\Models\Evento;
use App\Services\EventoService;
use App\Services\EvidenciaEventoService;
use Illuminate\Http\RedirectResponse;
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

    /**
     * RF-10: registro de eventos de tipo distinto a Tarjeta PARE. Si llega
     * una Tarjeta PARE (envío directo), se procesa según RF-9 (RF-10.3.3.4).
     */
    public function store(Request $request)
    {
        $this->authorize('create', Evento::class);

        $esPare = $request->filled('id_tipo_evento')
            && $request->integer('id_tipo_evento') === $this->servicio->idTipoPare();

        if ($esPare) {
            return $this->storeTarjetaPare(app(CrearTarjetaPareRequest::class));
        }

        // Resolver el FormRequest lo valida.
        $registro = app(CrearEventoRequest::class);

        if ($error = $this->registrar($registro)) {
            return $error;
        }

        $destino = $registro->user()->can('viewAny', Evento::class)
            ? 'eventos.index'
            : 'eventos.mis-reportes';

        return redirect()->route($destino)->with('success', 'Evento registrado exitosamente');
    }

    /** RF-9: formulario de registro de Tarjeta PARE. */
    public function createTarjetaPare()
    {
        $this->authorize('create', Evento::class);

        return Inertia::render(
            'TarjetasPare/Create',
            $this->servicio->obtenerDatosFormularioCrear()
        );
    }

    /** RF-9: registro de Tarjeta PARE. */
    public function storeTarjetaPare(CrearTarjetaPareRequest $request)
    {
        $this->authorize('create', Evento::class);

        if ($error = $this->registrar($request)) {
            return $error;
        }

        return redirect()->route('eventos.mis-reportes')
            ->with('success', 'Tarjeta PARE registrada exitosamente');
    }

    /**
     * Crea el evento. La creación es transaccional (incluida la Situación
     * Crítica de una PARE), así que ante un fallo no queda nada a medias y se
     * vuelve al formulario con los datos ingresados.
     */
    private function registrar(RegistrarEventoRequest $request): ?RedirectResponse
    {
        try {
            $this->servicio->crear($request->toData());

            return null;
        } catch (\Throwable $e) {
            report($e);

            return back()->withInput()->withErrors([
                'general' => EventoService::MENSAJE_ERROR_REGISTRO,
            ]);
        }
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
