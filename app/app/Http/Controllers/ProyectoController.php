<?php

namespace App\Http\Controllers;

use App\Models\Proyecto;
use Illuminate\Http\Request;

class ProyectoController extends Controller
{
    public function index()
    {
        $proyectos = Proyecto::with(['faena', 'cliente'])
            ->orderBy('id_proyecto', 'desc')
            ->get();

        return response()->json($proyectos);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_faena' => 'required|integer|exists:faenas,id_faena',
            'id_cliente' => 'required|integer|exists:clientes,id_cliente',
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'ubicacion' => 'nullable|string|max:255',
            'fecha_inicio' => 'nullable|date',
            'fecha_termino' => 'nullable|date|after_or_equal:fecha_inicio',
            'estado' => 'required|string|max:50',
        ]);

        $proyecto = Proyecto::create($validated);

        $proyecto->load(['faena', 'cliente']);

        return response()->json([
            'message' => 'Proyecto creado correctamente.',
            'data' => $proyecto,
        ], 201);
    }

    public function show($id)
    {
        $proyecto = Proyecto::with(['faena', 'cliente'])
            ->find($id);

        if (!$proyecto) {
            return response()->json([
                'message' => 'Proyecto no encontrado.',
            ], 404);
        }

        return response()->json($proyecto);
    }

    public function update(Request $request, $id)
    {
        $proyecto = Proyecto::find($id);

        if (!$proyecto) {
            return response()->json([
                'message' => 'Proyecto no encontrado.',
            ], 404);
        }

        $validated = $request->validate([
            'id_faena' => 'sometimes|required|integer|exists:faenas,id_faena',
            'id_cliente' => 'sometimes|required|integer|exists:clientes,id_cliente',
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'ubicacion' => 'nullable|string|max:255',
            'fecha_inicio' => 'nullable|date',
            'fecha_termino' => 'nullable|date|after_or_equal:fecha_inicio',
            'estado' => 'sometimes|required|string|max:50',
        ]);

        $proyecto->update($validated);

        $proyecto->load(['faena', 'cliente']);

        return response()->json([
            'message' => 'Proyecto actualizado correctamente.',
            'data' => $proyecto,
        ]);
    }

    public function destroy($id)
    {
        $proyecto = Proyecto::find($id);

        if (!$proyecto) {
            return response()->json([
                'message' => 'Proyecto no encontrado.',
            ], 404);
        }

        $proyecto->delete();

        return response()->json([
            'message' => 'Proyecto eliminado correctamente.',
        ]);
    }
}