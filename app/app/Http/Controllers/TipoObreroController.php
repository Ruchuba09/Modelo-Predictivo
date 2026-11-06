<?php

namespace App\Http\Controllers;

use App\Http\Requests\TipoObreroRequest;
use App\Models\TipoObrero;
use App\Services\TipoObreroService;
use Inertia\Inertia;

class TipoObreroController extends Controller
{
    public function __construct(
        private readonly TipoObreroService $servicio
    ) {}

    public function index()
    {
        return Inertia::render('TipoObreros/Index', [
            'tipoObreros' => $this->servicio->listar(),
        ]);
    }

    public function create()
    {
        return Inertia::render('TipoObreros/Create');
    }

    public function store(TipoObreroRequest $request)
    {
        $this->servicio->crear($request->toData());

        return redirect()
            ->route('tipo-obreros.index')
            ->with('success', 'Tipo de obrero creado correctamente.');
    }

    public function show(TipoObrero $tipo_obrero)
    {
        return Inertia::render('TipoObreros/Show', [
            'tipoObrero' => $tipo_obrero,
        ]);
    }

    public function edit(TipoObrero $tipo_obrero)
    {
        return Inertia::render('TipoObreros/Edit', [
            'tipoObrero' => $tipo_obrero,
        ]);
    }

    public function update(TipoObreroRequest $request, TipoObrero $tipo_obrero)
    {
        $this->servicio->actualizar($tipo_obrero, $request->toData());

        return redirect()
            ->route('tipo-obreros.index')
            ->with('success', 'Tipo de obrero actualizado correctamente.');
    }

    public function destroy(TipoObrero $tipo_obrero)
    {
        $this->servicio->eliminar($tipo_obrero);

        return redirect()
            ->route('tipo-obreros.index')
            ->with('success', 'Tipo de obrero eliminado correctamente.');
    }
}