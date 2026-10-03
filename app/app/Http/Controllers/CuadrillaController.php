<?php

namespace App\Http\Controllers;

use App\Models\Cuadrilla;
use App\Models\Supervisor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CuadrillaController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Cuadrilla::with('supervisor.trabajador.persona')
                ->orderBy('numero_cuadrilla')
                ->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $cuadrilla = Cuadrilla::create($this->validarDatos($request));

        return response()->json(
            $cuadrilla->load('supervisor.trabajador.persona'),
            201
        );
    }

    public function show(Cuadrilla $cuadrilla): JsonResponse
    {
        return response()->json(
            $cuadrilla->load([
                'supervisor.trabajador.persona',
                'obreros.trabajador.persona',
            ])
        );
    }

    public function update(Request $request, Cuadrilla $cuadrilla): JsonResponse
    {
        $cuadrilla->update($this->validarDatos($request, $cuadrilla, parcial: true));

        return response()->json(
            $cuadrilla->fresh('supervisor.trabajador.persona')
        );
    }

    public function destroy(Cuadrilla $cuadrilla): JsonResponse
    {
        // asignaciones.id_cuadrilla es ON DELETE RESTRICT
        if ($cuadrilla->asignaciones()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar: la cuadrilla tiene asignaciones registradas.',
            ], 409);
        }

        // obreros.id_cuadrilla es ON DELETE SET NULL
        $cuadrilla->delete();

        return response()->json(null, 204);
    }

    /**
     * Opciones para el selector de supervisores del formulario.
     * Ruta: GET /api/cuadrillas/supervisores
     */
    public function supervisores(): JsonResponse
    {
        $supervisores = Supervisor::with('trabajador.persona')
            ->get()
            ->map(fn (Supervisor $s) => [
                'id_trabajador' => $s->id_trabajador,
                'nombre' => trim(
                    ($s->trabajador?->persona?->nombre_1 ?? '') . ' ' .
                    ($s->trabajador?->persona?->apellido_1 ?? '')
                ),
            ])
            ->values();

        return response()->json($supervisores);
    }

    private function validarDatos(
        Request $request,
        ?Cuadrilla $cuadrilla = null,
        bool $parcial = false
    ): array {
        // "sometimes" permite PUT parciales (Partial<CrearCuadrilla> en el frontend)
        $req = $parcial ? 'sometimes|required' : 'required';

        return $request->validate([
            'id_supervisor' => "$req|integer|exists:supervisores,id_trabajador",
            'numero_cuadrilla' => [
                ...($parcial ? ['sometimes'] : []),
                'required',
                'string',
                'max:50',
                Rule::unique('cuadrillas', 'numero_cuadrilla')
                    ->ignore($cuadrilla?->id_cuadrilla, 'id_cuadrilla'),
            ],
        ]);
    }
}