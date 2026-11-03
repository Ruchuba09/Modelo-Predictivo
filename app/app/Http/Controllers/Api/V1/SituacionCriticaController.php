<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\situacionCritica;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SituacionCriticaController extends Controller
{
    private const RELACIONES = ['trabajador.persona', 'supervisor.trabajador.persona', 'evento'];

    public function index(Request $request): JsonResponse
    {
        $query = situacionCritica::query()->with(self::RELACIONES)->orderByDesc('id');
        $situaciones = $request->boolean('todos')
            ? $query->limit(1000)->get()
            : $query->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json($situaciones);
    }

    public function store(Request $request): JsonResponse
    {
        $situacion = situacionCritica::create($this->validar($request));

        return response()->json($situacion->load(self::RELACIONES), 201);
    }

    public function show(situacionCritica $situacionCritica): JsonResponse
    {
        return response()->json($situacionCritica->load(self::RELACIONES));
    }

    public function update(Request $request, situacionCritica $situacionCritica): JsonResponse
    {
        $situacionCritica->update($this->validar($request, true));

        return response()->json($situacionCritica->fresh(self::RELACIONES));
    }

    public function destroy(situacionCritica $situacionCritica): Response
    {
        $situacionCritica->delete();

        return response()->noContent();
    }

    private function validar(Request $request, bool $parcial = false): array
    {
        $required = $parcial ? 'sometimes|required' : 'required';

        return $request->validate([
            'id_trabajador' => [$required, 'integer', 'exists:trabajadores,id_trabajador'],
            'id_supervisor' => ['nullable', 'integer', 'exists:supervisores,id_trabajador'],
            'id_evento' => [$required, 'integer', 'exists:eventos,id_evento'],
            'referencia' => [$required, 'string', 'max:255'],
            'condicion' => [$required, 'integer', 'in:1,2'],
        ]);
    }
}
