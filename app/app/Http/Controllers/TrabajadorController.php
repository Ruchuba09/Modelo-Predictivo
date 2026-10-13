<?php

namespace App\Http\Controllers;

use App\Http\Requests\TrabajadorRequest;
use App\Models\Trabajador;
use App\Http\Services\TrabajadorService;
use Inertia\Inertia;

class TrabajadorController extends Controller
{
    public function __construct(
        private readonly TrabajadorService $servicio
    ) {}

    public function index()
    {
        return Inertia::render('Trabajadores/Trabajadores', [
            'trabajadores' => $this->servicio->listarFormateados(),
        ]);
    }

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

    public function show(Trabajador $trabajador)
    {
        return Inertia::render('Trabajadores/Show', [
            'trabajador' => $this->servicio->formatear($trabajador),
        ]);
    }

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

    public function destroy(Trabajador $trabajador)
    {
        $this->servicio->eliminar($trabajador);

        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador eliminado correctamente.');
    }
}