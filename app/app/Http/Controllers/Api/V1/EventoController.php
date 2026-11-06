<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActualizarEventoRequest;
use App\Http\Requests\CerrarEventoRequest;
use App\Http\Requests\CrearEventoRequest;
use App\Http\Requests\FiltroEventoRequest;
use App\Models\Evento;
use App\Services\EventoService;
use App\Services\EvidenciaEventoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class EventoController extends Controller
{
    public function __construct(
        private readonly EventoService $servicio,
        private readonly EvidenciaEventoService $evidencias,
    ) {}

    public function index(FiltroEventoRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Evento::class);

        return response()->json($this->servicio->paginar($request->filtros(), $request->porPagina()));
    }

    public function store(CrearEventoRequest $request): JsonResponse
    {
        $this->authorize('create', Evento::class);

        $evento = $this->servicio->crear($request->toData());

        return response()->json($this->servicio->obtener($evento), 201);
    }

    public function show(Evento $evento): JsonResponse
    {
        $this->authorize('view', $evento);

        return response()->json($this->servicio->obtener($evento));
    }

    public function update(ActualizarEventoRequest $request, Evento $evento): JsonResponse
    {
        $this->authorize('update', $evento);

        return response()->json(
            $this->servicio->actualizar($evento, $request->toData())->load([
                'tipoEvento', 'proyecto', 'area', 'administrador', 'trabajador',
            ])
        );
    }

    public function destroy(Evento $evento): Response
    {
        $this->authorize('delete', $evento);

        $this->servicio->eliminar($evento);

        return response()->noContent();
    }

    public function sinAdministrador(): JsonResponse
    {
        return response()->json($this->servicio->listarSinAdministrador());
    }

    public function misReportes(FiltroEventoRequest $request): JsonResponse
    {
        return response()->json($this->servicio->paginarMisReportes($request->filtros(), $request->porPagina()));
    }

    /**
     * Reportes del equipo a cargo: el supervisor ve los de sus cuadrillas y el
     * administrador todos, con la misma restricción que el listado general.
     */
    public function miCuadrilla(FiltroEventoRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Evento::class);

        return response()->json($this->servicio->paginar($request->filtros(), $request->porPagina()));
    }

    public function opciones(): JsonResponse
    {
        return response()->json($this->servicio->obtenerDatosFormularioCrear());
    }

    public function evidencias(Evento $evento): JsonResponse
    {
        $this->authorize('view', $evento);

        return response()->json($this->evidencias->listar($evento));
    }

    /** Evidencia privada para clientes con token, como la app móvil. */
    public function archivo(Evento $evento, string $archivo)
    {
        $this->authorize('view', $evento);

        return $this->evidencias->responder($evento, $archivo);
    }

    public function tomar(Evento $evento): JsonResponse
    {
        $this->authorize('tomar', $evento);

        $this->servicio->tomarReporte($evento);

        return response()->json($evento->fresh([
            'tipoEvento', 'proyecto', 'area', 'administrador', 'trabajador',
        ]));
    }

    public function cerrar(CerrarEventoRequest $request, Evento $evento): JsonResponse
    {
        $this->authorize('cerrar', $evento);

        $this->servicio->cerrar($evento, $request->toData());

        return response()->json($evento->fresh([
            'tipoEvento', 'proyecto', 'area', 'administrador', 'trabajador',
        ]));
    }
}
