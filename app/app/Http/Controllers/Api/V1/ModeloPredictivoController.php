<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ObjetivoPrediccion;
use App\Http\Controllers\Controller;
use App\Http\Requests\ModeloPredictivo\FiltroPrediccionRequest;
use App\Http\Resources\ModeloPredictivo\EntidadesRiesgoResource;
use App\Http\Resources\ModeloPredictivo\EntrenamientoResource;
use App\Http\Resources\ModeloPredictivo\EvaluacionModeloResource;
use App\Http\Resources\ModeloPredictivo\PrediccionesResource;
use App\Http\Resources\ModeloPredictivo\ResumenModelosResource;
use App\Models\Proyecto;
use App\Services\ModeloPredictivoService;
use Illuminate\Http\JsonResponse;

/**
 * Consultas del modelo predictivo. Los datos vienen del servicio Python (ModeloPredictivoService);
 * los errores del servicio se responden con ModeloPredictivoException (503, 502 o 422).
 */
class ModeloPredictivoController extends Controller
{
    public function __construct(private readonly ModeloPredictivoService $servicio) {}

    /** Si el servicio responde y con qué base de datos trabaja. */
    public function estado(): JsonResponse
    {
        return response()->json($this->servicio->estado());
    }

    /** Objetivos disponibles, con su etiqueta. */
    public function tipos(): JsonResponse
    {
        $tipos = $this->servicio->tipos();

        return response()->json([
            'tipos' => $tipos,
            'etiquetas' => collect($tipos)
                ->mapWithKeys(fn (string $tipo) => [$tipo => ObjetivoPrediccion::tryFrom($tipo)?->etiqueta() ?? $tipo]),
        ]);
    }

    /** Los tres modelos: qué predicen, cuál se publicó y su calidad. */
    public function modelos(): JsonResponse
    {
        return (new ResumenModelosResource($this->servicio->resumen()))->response();
    }

    /** Ranking de proyectos; con id_proyecto, también el análisis de sus entidades. */
    public function index(FiltroPrediccionRequest $request): JsonResponse
    {
        return (new PrediccionesResource($this->servicio->predicciones($request->toData())))->response();
    }

    public function show(FiltroPrediccionRequest $request, Proyecto $proyecto): JsonResponse
    {
        $filtro = $request->toData()->conProyecto((int) $proyecto->getKey());

        return (new PrediccionesResource($this->servicio->predicciones($filtro)))->response();
    }

    public function entidades(FiltroPrediccionRequest $request): JsonResponse
    {
        return (new EntidadesRiesgoResource($this->servicio->entidades($request->toData())))->response();
    }

    public function evaluacion(): JsonResponse
    {
        return response()->json([
            'evaluacion' => EvaluacionModeloResource::lista($this->servicio->evaluacion()),
        ]);
    }

    /** Reentrena aunque los datos no hayan cambiado; tarda alrededor de un minuto. */
    public function entrenar(): JsonResponse
    {
        return (new EntrenamientoResource($this->servicio->entrenar()))->response();
    }
}
