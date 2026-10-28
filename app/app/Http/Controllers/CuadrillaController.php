<?php

namespace App\Http\Controllers;

use App\DTOs\CuadrillaDTO;
use App\Http\Requests\StoreCuadrillaRequest;
use App\Http\Requests\UpdateCuadrillaRequest;
use App\Models\Cuadrilla;
use App\Services\CuadrillaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class CuadrillaController extends Controller
{
    public function __construct(
        private readonly CuadrillaService $cuadrillaService
    ) {}

    public function index(): JsonResponse
    {
        return response()->json(
            $this->cuadrillaService->index()
        );
    }

    public function store(StoreCuadrillaRequest $request): JsonResponse
    {
        $dto = CuadrillaDTO::fromArray($request->validated());

        $cuadrilla = $this->cuadrillaService->store($dto);

        return response()->json($cuadrilla, 201);
    }

    public function show(Cuadrilla $cuadrilla): JsonResponse
    {
        return response()->json(
            $this->cuadrillaService->show($cuadrilla)
        );
    }

    public function update(
        UpdateCuadrillaRequest $request,
        Cuadrilla $cuadrilla
    ): JsonResponse {
        $dto = CuadrillaDTO::fromArray($request->validated());

        return response()->json(
            $this->cuadrillaService->update($cuadrilla, $dto)
        );
    }

    public function destroy(Cuadrilla $cuadrilla): JsonResponse
    {
        try {
            $this->cuadrillaService->destroy($cuadrilla);

            return response()->json(null, 204);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => collect($e->errors())->flatten()->first() ?? 'No se pudo eliminar la cuadrilla.',
                'errors' => $e->errors(),
            ], 409);
        }
    }

    public function supervisores(): JsonResponse
    {
        return response()->json(
            $this->cuadrillaService->supervisores()
        );
    }
}
