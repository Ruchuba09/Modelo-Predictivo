<?php

namespace App\Http\Controllers;

use App\Http\Requests\PersonaRequest;
use App\Models\Persona;
use App\Http\Services\PersonaService;
use Inertia\Inertia;

class PersonaController extends Controller
{
    public function __construct(
        private readonly PersonaService $servicio
    ) {}

    public function index()
    {
        return Inertia::render('Personas/Index', [
            'personas' => $this->servicio->listarConTrabajador(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Personas/Create');
    }

    public function store(PersonaRequest $request)
    {
        $this->servicio->crear($request->toData());

        return redirect()
            ->route('personas.index')
            ->with('success', 'Persona creada correctamente.');
    }

    public function show(Persona $persona)
    {
        return Inertia::render('Personas/Show', [
            'persona' => $this->servicio->obtenerConTrabajador($persona),
        ]);
    }

    public function edit(Persona $persona)
    {
        return Inertia::render('Personas/Edit', [
            'persona' => $persona,
        ]);
    }

    public function update(PersonaRequest $request, Persona $persona)
    {
        $this->servicio->actualizar($persona, $request->toData());

        return redirect()
            ->route('personas.index')
            ->with('success', 'Persona actualizada correctamente.');
    }

    public function destroy(Persona $persona)
    {
        $this->servicio->eliminar($persona);

        return redirect()
            ->route('personas.index')
            ->with('success', 'Persona eliminada correctamente.');
    }
}