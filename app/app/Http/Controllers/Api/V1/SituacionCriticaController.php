<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SituacionCritica\ActualizarSituacionCriticaRequest;
use App\Http\Requests\SituacionCritica\CrearSituacionCriticaRequest;
use App\Http\Requests\SituacionCritica\FiltroSituacionCriticaRequest;
use App\Http\Controllers\SituacionCriticaController as Web;
use App\Models\SituacionCritica;
use App\Services\SituacionCriticaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Throwable;

/** Situaciones Críticas (RF-14 a RF-16). Sin eliminación manual (RF-15.6). */
class SituacionCriticaController extends Controller
{
    public function __construct(private readonly SituacionCriticaService $servicio) {}

    public function index(FiltroSituacionCriticaRequest $request): JsonResponse
    {
        Gate::authorize('viewAny', SituacionCritica::class);

        $query = $this->servicio->consulta($request->user(), $request->filtros());
        $situaciones = $request->boolean('todos')
            ? $query->limit(1000)->get()
            : $query->paginate($request->integer('per_page', 15));

        return response()->json($situaciones);
    }

    public function store(CrearSituacionCriticaRequest $request): JsonResponse
    {
        Gate::authorize('create', SituacionCritica::class);

        try {
            $situacion = $this->servicio->registrarManual($request->evento(), $request->user());
        } catch (Throwable $e) {
            Log::error('Error al registrar situación crítica (API)', ['error' => $e->getMessage()]);

            return response()->json(['message' => Web::MENSAJE_ERROR_REGISTRO], 500);
        }

        return response()->json($situacion->load(SituacionCriticaService::RELACIONES), 201);
    }

    public function show(SituacionCritica $situacionCritica): JsonResponse
    {
        Gate::authorize('view', $situacionCritica);

        return response()->json([
            ...$situacionCritica->load(SituacionCriticaService::RELACIONES)->toArray(),
            'historial' => $this->servicio->historialDe($situacionCritica),
        ]);
    }

    public function update(ActualizarSituacionCriticaRequest $request, SituacionCritica $situacionCritica): JsonResponse
    {
        Gate::authorize('update', $situacionCritica);

        try {
            $this->servicio->editarManual($situacionCritica, $request->validated(), $request->user());
        } catch (Throwable $e) {
            Log::error('Error al actualizar situación crítica (API)', ['id' => $situacionCritica->id, 'error' => $e->getMessage()]);

            return response()->json(['message' => Web::MENSAJE_ERROR_ACTUALIZACION], 500);
        }

        return response()->json($situacionCritica->fresh(SituacionCriticaService::RELACIONES));
    }
}
