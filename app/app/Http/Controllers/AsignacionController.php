<?php

namespace App\Http\Controllers;

use App\DTOs\AsignacionDTO;
use App\Http\Requests\StoreAsignacionRequest;
use App\Http\Requests\UpdateAsignacionRequest;
use App\Models\Asignacion;
use App\Services\AsignacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AsignacionController extends Controller
{
    public function __construct(
        private readonly AsignacionService $asignacionService
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $this->asignacionService->index(
                $request->only(['id_proyecto', 'id_cuadrilla'])
            )
        );
    }

    public function store(StoreAsignacionRequest $request): JsonResponse
    {
        $dto = AsignacionDTO::fromArray($request->validated());

        $asignacion = $this->asignacionService->store(
            $dto,
            (int) $request->user()->id_trabajador
        );

        return response()->json($asignacion, 201);
    }

    public function show(Asignacion $asignacion): JsonResponse
    {
        return response()->json(
            $this->asignacionService->show($asignacion)
        );
    }

    public function update(
        UpdateAsignacionRequest $request,
        Asignacion $asignacion
    ): JsonResponse {
        $dto = AsignacionDTO::fromArray($request->validated());

        return response()->json(
            $this->asignacionService->update($asignacion, $dto)
        );
    }

    public function destroy(Asignacion $asignacion): JsonResponse
    {
        $this->asignacionService->destroy($asignacion);

        return response()->json(null, 204);
    }
}