<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProyectoRequest;
use App\Models\Proyecto;
use App\Http\Services\ProyectoService;
use Illuminate\Http\JsonResponse;

class ProyectoController extends Controller
{
    public function __construct(
        private readonly ProyectoService $servicio
    ) {}

    public function index(): JsonResponse
    {
        return response()->json($this->servicio->listarConRelaciones());
    }

    public function store(ProyectoRequest $request): JsonResponse
    {
        $proyecto = $this->servicio->crear($request->toData());

        return response()->json([
            'message' => 'Proyecto creado correctamente.',
            'data' => $proyecto,
        ], 201);
    }

    public function show(Proyecto $proyecto): JsonResponse
    {
        return response()->json($this->servicio->obtenerConRelaciones($proyecto));
    }

    public function update(ProyectoRequest $request, Proyecto $proyecto): JsonResponse
    {
        $proyecto = $this->servicio->actualizar($proyecto, $request->toData());

        return response()->json([
            'message' => 'Proyecto actualizado correctamente.',
            'data' => $proyecto,
        ]);
    }

    public function destroy(Proyecto $proyecto): JsonResponse
    {
        $this->servicio->eliminar($proyecto);

        return response()->json([
            'message' => 'Proyecto eliminado correctamente.',
        ]);
    }
}