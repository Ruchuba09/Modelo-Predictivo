<?php

namespace App\Http\Controllers;

use App\Models\escala_riesgo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EscalaRiesgoController extends Controller
{
    public function index()
    {
        return Inertia::render('EscalaRiesgo/Index', [
            'escalas' => escala_riesgo::orderBy('valor')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('EscalaRiesgo/EscalaRiesgoCrear');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nivel' => ['required', 'string', 'max:50', 'unique:usuarios.escala_riesgo,nivel'],
            'valor' => ['required', 'integer', 'unique:usuarios.escala_riesgo,valor'],
            'color_hex' => ['nullable', 'string', 'max:7'],
            'descripcion' => ['nullable', 'string'],
        ]);

        escala_riesgo::create($validated);

        return redirect()->route('escala-riesgo.index')
            ->with('success', 'Escala de riesgo creada correctamente.');
    }

    public function show(escala_riesgo $escala)
    {
        return Inertia::render('EscalaRiesgo/EscalaRiesgoMostrar', [
            'escala' => $escala,
        ]);
    }

    public function edit(escala_riesgo $escala)
    {
        return Inertia::render('EscalaRiesgo/EscalaRiesgoEditar', [
            'escala' => $escala,
        ]);
    }

    public function update(Request $request, escala_riesgo $escala)
    {
        $validated = $request->validate([
            'nivel' => ['required', 'string', 'max:50', 'unique:usuarios.escala_riesgo,nivel,' . $escala->id . ',id'],
            'valor' => ['required', 'integer', 'unique:usuarios.escala_riesgo,valor,' . $escala->id . ',id'],
            'color_hex' => ['nullable', 'string', 'max:7'],
            'descripcion' => ['nullable', 'string'],
        ]);

        $escala->update($validated);

        return redirect()->route('escala-riesgo.index')
            ->with('success', 'Escala de riesgo actualizada correctamente.');
    }

    public function destroy(escala_riesgo $escala)
    {
        try {
            $escala->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            return back()->with('error', 'No se puede eliminar: hay tarjetas PARE que usan esta escala de riesgo.');
        }

        return redirect()->route('escala-riesgo.index')
            ->with('success', 'Escala de riesgo eliminada correctamente.');
    }
}