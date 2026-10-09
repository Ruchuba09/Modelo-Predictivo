<?php

namespace App\Http\Controllers;

use App\Models\Faena;
use App\Models\Proyecto;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class FaenaController extends Controller
{
    public function index()
    {
        return Inertia::render('Faenas/Index', [
            'faenas' => Faena::withCount(['areas', 'proyectos'])
                ->orderBy('nombre')
                ->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Faenas/Create');
    }

    public function store(Request $request)
    {
        Faena::create($this->validarDatos($request));

        return redirect()
            ->route('faenas.index')
            ->with('success', 'Faena creada correctamente.');
    }

    public function show(Faena $faena)
    {
        $faena->load(['areas', 'proyectos']);

        return Inertia::render('Faenas/Show', [
            'faena' => $faena,
        ]);
    }

    public function edit(Faena $faena)
    {
        return Inertia::render('Faenas/Edit', [
            'faena' => $faena,
        ]);
    }

    public function update(Request $request, Faena $faena)
    {
        $faena->update($this->validarDatos($request, $faena));

        return redirect()
            ->route('faenas.index')
            ->with('success', 'Faena actualizada correctamente.');
    }

    public function destroy(Faena $faena)
    {
        // proyectos.id_faena es ON DELETE RESTRICT (areas hace cascade)
        if (Proyecto::where('id_faena', $faena->id_faena)->exists()) {
            return back()->with('error', 'No se puede eliminar: la faena tiene proyectos asociados.');
        }

        $faena->delete();

        return redirect()
            ->route('faenas.index')
            ->with('success', 'Faena eliminada correctamente.');
    }

    private function validarDatos(Request $request, ?Faena $faena = null): array
    {
        return $request->validate([
            'codigo_faena' => [
                'required',
                'string',
                'max:50',
                Rule::unique('faenas', 'codigo_faena')->ignore($faena?->id_faena, 'id_faena'),
            ],
            'nombre' => 'required|string|max:255',
        ]);
    }
}