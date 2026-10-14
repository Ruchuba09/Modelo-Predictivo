<?php

namespace App\Http\Controllers;

use App\Models\Asignacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AsignacionController extends Controller
{
    private const RELACIONES = [
        'administrador.trabajador.persona',
        'proyecto',
        'cuadrilla',
    ];

    public function index(Request $request): JsonResponse
    {
        $query = Asignacion::with(self::RELACIONES);

        if ($request->filled('id_proyecto')) {
            $query->where('id_proyecto', $request->id_proyecto);
        }

        if ($request->filled('id_cuadrilla')) {
            $query->where('id_cuadrilla', $request->id_cuadrilla);
        }

        return response()->json(
            $query->orderByDesc('fecha_inicio')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $asignacion = Asignacion::create($this->validarDatos($request));

        return response()->json(
            $asignacion->load(self::RELACIONES),
            201
        );
    }

    public function show(Asignacion $asignacion): JsonResponse
    {
        return response()->json(
            $asignacion->load([
                'administrador.trabajador.persona',
                'proyecto',
                'cuadrilla.supervisor.trabajador.persona',
            ])
        );
    }

    public function update(Request $request, Asignacion $asignacion): JsonResponse
    {
        $asignacion->update($this->validarDatos($request, parcial: true));

        return response()->json(
            $asignacion->fresh(self::RELACIONES)
        );
    }

    public function destroy(Asignacion $asignacion): JsonResponse
    {
        $asignacion->delete();

        return response()->json(null, 204);
    }

    private function validarDatos(Request $request, bool $parcial = false): array
    {
        // "sometimes" permite PUT parciales (Partial<CrearAsignacion> en el frontend)
        $req = $parcial ? 'sometimes|required' : 'required';

        return $request->validate([
            'id_administrador' => "$req|integer|exists:administrativos,id_trabajador",
            'id_proyecto'      => "$req|integer|exists:proyectos,id_proyecto",
            'id_cuadrilla'     => "$req|integer|exists:cuadrillas,id_cuadrilla",
            'fecha_inicio'     => "$req|date",
            'fecha_termino'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);
    }
}