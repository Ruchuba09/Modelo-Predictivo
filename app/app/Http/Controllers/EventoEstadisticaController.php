<?php

namespace App\Http\Controllers;

use App\Http\Requests\EstadisticaEventoRequest;
use App\Models\Proyecto;
use App\Services\EventoEstadisticaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /eventos/estadisticas                     -> pantalla Inertia
 * GET /api/eventos/estadisticas                 -> todas las secciones
 * GET /api/eventos/estadisticas?secciones=resumen,tiempos
 * GET /api/eventos/estadisticas/{seccion}       -> una sola sección
 *
 * El cálculo está en App\Services\EventoEstadisticaService.
 */
class EventoEstadisticaController extends Controller
{
    public function __construct(
        private readonly EventoEstadisticaService $servicio
    ) {}

    public function pagina(Request $request): Response
    {
        return Inertia::render('Eventos/EventosEstadisticas', [
            'proyectos' => Proyecto::select('id_proyecto', 'nombre')->get(),
            'filtrosIniciales' => $request->all(),
        ]);
    }

    public function index(EstadisticaEventoRequest $request): JsonResponse
    {
        return response()->json(
            $this->servicio->generar($request->filtros(), $request->secciones())
        );
    }

    public function seccion(EstadisticaEventoRequest $request, string $seccion): JsonResponse
    {
        abort_unless(in_array($seccion, EventoEstadisticaService::SECCIONES, true), 404, 'La sección no existe.');

        return response()->json(
            $this->servicio->generar($request->filtros(), [$seccion])
        );
    }
}
