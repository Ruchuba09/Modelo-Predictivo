<?php

namespace App\Http\Controllers;

use App\Http\Requests\TrabajadorRequest;
use App\Models\Trabajador;
use App\Services\TrabajadorService;
use Inertia\Inertia;

class TrabajadorController extends Controller
{
    public function __construct(
        private readonly TrabajadorService $servicio
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Trabajadores/Trabajadores', [
            'trabajadores' => $this->servicio->listarFormateados(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Trabajadores/Create');
    }

    public function store(TrabajadorRequest $request)
    {
        $this->servicio->crear($request->toData());

        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador creado correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Trabajador $trabajador)
    {
        return Inertia::render('Trabajadores/Show', [
            'trabajador' => $this->servicio->formatear($trabajador),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Trabajador $trabajador)
    {
        return Inertia::render('Trabajadores/Edit', [
            'trabajador' => $this->servicio->formatear($trabajador),
        ]);
    }

    public function update(TrabajadorRequest $request, Trabajador $trabajador)
    {
        $this->servicio->actualizar($trabajador, $request->toData());

        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador actualizado correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Trabajador $trabajador)
    {
        $this->servicio->eliminar($trabajador);

        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador eliminado correctamente.');
    }
}