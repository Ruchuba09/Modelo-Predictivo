<?php

namespace App\Http\Controllers;

use App\Http\Requests\FaenaRequest;
use App\Models\Faena;
use App\Services\FaenaService;
use Inertia\Inertia;

class FaenaController extends Controller
{
    public function __construct(
        private readonly FaenaService $servicio
    ) {}

    public function index()
    {
        return Inertia::render('Faenas/Index', [
            'faenas' => $this->servicio->listar(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Faenas/Create');
    }

    public function store(FaenaRequest $request)
    {
        $this->servicio->crear($request->toData());

        return redirect()
            ->route('faenas.index')
            ->with('success', 'Faena creada correctamente.');
    }

    public function show(Faena $faena)
    {
        return Inertia::render('Faenas/Show', [
            'faena' => $this->servicio->obtener($faena),
        ]);
    }

    public function edit(Faena $faena)
    {
        return Inertia::render('Faenas/Edit', [
            'faena' => $this->servicio->obtenerParaEditar($faena),
        ]);
    }

    public function update(
        FaenaRequest $request,
        Faena $faena
    ) {
        $this->servicio->actualizar(
            $faena,
            $request->toData()
        );

        return redirect()
            ->route('faenas.index')
            ->with('success', 'Faena actualizada correctamente.');
    }

    public function destroy(Faena $faena)
    {
        if ($this->servicio->tieneProyectos($faena)) {
            return back()->with(
                'error',
                'No se puede eliminar: la faena tiene proyectos asociados.'
            );
        }

        $this->servicio->eliminar($faena);

        return redirect()
            ->route('faenas.index')
            ->with('success', 'Faena eliminada correctamente.');
    }
}
