<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActualizarEventoRequest;
use App\Http\Requests\CerrarEventoRequest;
use App\Http\Requests\CrearEventoRequest;
use App\Http\Requests\FiltroEventoRequest;
use App\Models\Evento;
use App\Services\EventoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class EventoController extends Controller
{
    public function __construct(private readonly EventoService $servicio) {}

    public function index(FiltroEventoRequest $request): JsonResponse
    {
        return response()->json($this->servicio->listar($request->filtros()));
    }

    public function store(CrearEventoRequest $request): JsonResponse
    {
        $evento = $this->servicio->crear($request->toData());

        return response()->json($this->servicio->obtener($evento), 201);
    }

    public function show(Evento $evento): JsonResponse
    {
        return response()->json($this->servicio->obtener($evento));
    }

    public function update(ActualizarEventoRequest $request, Evento $evento): JsonResponse
    {
        return response()->json(
            $this->servicio->actualizar($evento, $request->toData())->load([
                'tipoEvento', 'proyecto', 'area', 'administrador', 'trabajador',
            ])
        );
    }

    public function destroy(Evento $evento): Response
    {
        $this->servicio->eliminar($evento);

        return response()->noContent();
    }

    public function sinAdministrador(): JsonResponse
    {
        return response()->json($this->servicio->listarSinAdministrador());
    }

    public function misReportes(FiltroEventoRequest $request): JsonResponse
    {
        return response()->json($this->servicio->listarMisReportes($request->filtros()));
    }

    public function opciones(): JsonResponse
    {
        return response()->json($this->servicio->obtenerDatosFormularioCrear());
    }

    public function evidencias(Evento $evento): JsonResponse
    {
        return response()->json($this->servicio->obtenerEvidencias($evento));
    }

    public function tomar(Evento $evento): JsonResponse
    {
        $this->servicio->tomarReporte($evento);

        return response()->json($evento->fresh([
            'tipoEvento', 'proyecto', 'area', 'administrador', 'trabajador',
        ]));
    }

    public function cerrar(CerrarEventoRequest $request, Evento $evento): JsonResponse
    {
        $this->servicio->cerrar($evento, $request->toData());

        return response()->json($evento->fresh([
            'tipoEvento', 'proyecto', 'area', 'administrador', 'trabajador',
        ]));
    }
}
