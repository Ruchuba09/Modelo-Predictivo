<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TipoEvento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class TipoEventoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TipoEvento::query()->orderBy('nombre');
        $tipos = $request->boolean('todos')
            ? $query->limit(1000)->get()
            : $query->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json($tipos);
    }

    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:100', Rule::unique('tipo_eventos', 'nombre')],
        ]);

        return response()->json(TipoEvento::create($datos), 201);
    }

    public function show(TipoEvento $tipoEvento): JsonResponse
    {
        return response()->json($tipoEvento);
    }

    public function update(Request $request, TipoEvento $tipoEvento): JsonResponse
    {
        $datos = $request->validate([
            'nombre' => [
                'required', 'string', 'max:100',
                Rule::unique('tipo_eventos', 'nombre')->ignore($tipoEvento->id_tipo_evento, 'id_tipo_evento'),
            ],
        ]);
        $tipoEvento->update($datos);

        return response()->json($tipoEvento->refresh());
    }

    public function destroy(TipoEvento $tipoEvento): Response
    {
        $tipoEvento->delete();

        return response()->noContent();
    }
}
