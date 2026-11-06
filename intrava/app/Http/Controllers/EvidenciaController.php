<?php

namespace App\Http\Controllers;

use App\Models\Evidencia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EvidenciaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $evidencias = Evidencia::with('evento')->get();

        return response()->json([
            'success' => true,
            'data' => $evidencias,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_evento' => [
                'required',
                'integer',
                'exists:eventos,id_evento',
            ],
            'nombre' => ['required', 'string', 'max:255'],
            'archivo' => ['required', 'file', 'max:10240'],
        ]);

        $archivo = $request->file('archivo');

        $ruta = $archivo->store(
            'evidencias/eventos/' . $validated['id_evento'],
            'public'
        );

        $evidencia = Evidencia::create([
            'id_evento' => $validated['id_evento'],
            'nombre' => $validated['nombre'],
            'ruta' => $ruta,
            'tipo_archivo' => $archivo->getMimeType(),
            'fecha_creacion' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Evidencia creada correctamente.',
            'data' => $evidencia,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Evidencia $evidencia)
    {
        return response()->json([
            'success' => true,
            'data' => $evidencia->load('evento'),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Evidencia $evidencia)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Evidencia $evidencia)
    {
        $validated = $request->validate([
            'id_evento' => [
                'sometimes',
                'required',
                'integer',
                'exists:eventos,id_evento',
            ],
            'nombre' => ['sometimes', 'required', 'string', 'max:255'],
            'archivo' => ['sometimes', 'required', 'file', 'max:10240'],
        ]);

        if ($request->hasFile('archivo')) {
            if ($evidencia->ruta) {
                Storage::disk('public')->delete($evidencia->ruta);
            }

            $archivo = $request->file('archivo');

            $validated['ruta'] = $archivo->store(
                'evidencias/eventos/' .
                    ($validated['id_evento'] ?? $evidencia->id_evento),
                'public'
            );

            $validated['tipo_archivo'] = $archivo->getMimeType();
        }

        unset($validated['archivo']);

        $evidencia->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Evidencia actualizada correctamente.',
            'data' => $evidencia->fresh(),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Evidencia $evidencia)
    {
        if ($evidencia->ruta) {
            Storage::disk('public')->delete($evidencia->ruta);
        }

        $evidencia->delete();

        return response()->json([
            'success' => true,
            'message' => 'Evidencia eliminada correctamente.',
        ]);
    }
}