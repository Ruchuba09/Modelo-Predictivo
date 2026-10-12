<?php

namespace App\Http\Controllers;

use App\Http\Requests\PersonaRequest;
use App\Models\Persona;
use App\Services\PersonaService;
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

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    public function store(PersonaRequest $request)
    {
        $this->servicio->crear($request->toData());

        return redirect()
            ->route('personas.index')
            ->with('success', 'Persona creada correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Persona $persona)
    {
        return Inertia::render('Personas/Show', [
            'persona' => $this->servicio->obtenerConTrabajador($persona),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Persona $persona)
    {
        //
    }

    public function update(PersonaRequest $request, Persona $persona)
    {
        $this->servicio->actualizar($persona, $request->toData());

        return redirect()
            ->route('personas.index')
            ->with('success', 'Persona actualizada correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Persona $persona)
    {
        $this->servicio->eliminar($persona);

        return redirect()
            ->route('personas.index')
            ->with('success', 'Persona eliminada correctamente.');
    }
}
