<?php

namespace App\Http\Controllers;

use App\Models\Persona;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PersonaController extends Controller
{
    public function index()
    {
        return Inertia::render('Personas/Index', [
            'personas' => Persona::with('trabajador')
                ->orderBy('apellido_1')
                ->orderBy('nombre_1')
                ->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Personas/Create');
    }

    public function store(Request $request)
    {
        Persona::create($this->validarDatos($request));

        return redirect()
            ->route('personas.index')
            ->with('success', 'Persona creada correctamente.');
    }

    public function show(Persona $persona)
    {
        $persona->load('trabajador');

        return Inertia::render('Personas/Show', [
            'persona' => $persona,
        ]);
    }

    public function edit(Persona $persona)
    {
        return Inertia::render('Personas/Edit', [
            'persona' => $persona,
        ]);
    }

    public function update(Request $request, Persona $persona)
    {
        $persona->update($this->validarDatos($request, $persona));

        return redirect()
            ->route('personas.index')
            ->with('success', 'Persona actualizada correctamente.');
    }

    public function destroy(Persona $persona)
    {
        // trabajadores.id_persona hace cascade (y desde ahí subtipo, user y pivotes)
        $persona->delete();

        return redirect()
            ->route('personas.index')
            ->with('success', 'Persona eliminada correctamente.');
    }

    private function validarDatos(Request $request, ?Persona $persona = null): array
    {
        return $request->validate([
            'rut' => [
                'required',
                'string',
                'max:20',
                Rule::unique('personas', 'rut')->ignore($persona?->id_persona, 'id_persona'),
            ],
            'nombre_1' => 'required|string|max:100',
            'nombre_2' => 'nullable|string|max:100',
            'apellido_1' => 'required|string|max:100',
            'apellido_2' => 'nullable|string|max:100',
        ]);
    }
}