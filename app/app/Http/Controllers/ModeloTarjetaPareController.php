<?php

namespace App\Http\Controllers;

use App\Models\modelo_tarjeta_pare;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModeloTarjetaPareController extends Controller
{
    public function index()
    {
        return Inertia::render('ModeloTarjeta/Index', [
            'modelos' => modelo_tarjeta_pare::orderBy('nombre')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('ModeloTarjeta/ModeloTarjetaCrear');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:100', 'unique:usuarios.modelo_tarjeta_pare,nombre'],
            'descripcion' => ['nullable', 'string'],
        ]);

        modelo_tarjeta_pare::create($validated);

        return redirect()->route('modelo-tarjeta.index')
            ->with('success', 'Modelo de tarjeta creado correctamente.');
    }

    public function show(modelo_tarjeta_pare $modelo)
    {
        return Inertia::render('ModeloTarjeta/ModeloTarjetaMostrar', [
            'modelo' => $modelo,
        ]);
    }

    public function edit(modelo_tarjeta_pare $modelo)
    {
        return Inertia::render('ModeloTarjeta/ModeloTarjetaEditar', [
            'modelo' => $modelo,
        ]);
    }

    public function update(Request $request, modelo_tarjeta_pare $modelo)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:100', 'unique:usuarios.modelo_tarjeta_pare,nombre,' . $modelo->id . ',id'],
            'descripcion' => ['nullable', 'string'],
        ]);

        $modelo->update($validated);

        return redirect()->route('modelo-tarjeta.index')
            ->with('success', 'Modelo de tarjeta actualizado correctamente.');
    }

    public function destroy(modelo_tarjeta_pare $modelo)
    {
        try {
            $modelo->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            return back()->with('error', 'No se puede eliminar: hay tarjetas PARE que usan este modelo.');
        }

        return redirect()->route('modelo-tarjeta.index')
            ->with('success', 'Modelo de tarjeta eliminado correctamente.');
    }
}