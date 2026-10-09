<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Evento;
use App\Models\Faena;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AreaController extends Controller
{
    public function index(Request $request)
    {
        $query = Area::with('faena');

        if ($request->filled('id_faena')) {
            $query->where('id_faena', $request->id_faena);
        }

        return Inertia::render('Areas/Index', [
            'areas' => $query->orderBy('codigo_area')->get(),
            'faenas' => Faena::orderBy('nombre')->get(),
            'filtros' => $request->only(['id_faena']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Areas/Create', [
            'faenas' => Faena::orderBy('nombre')->get(),
        ]);
    }

    public function store(Request $request)
    {
        Area::create($this->validarDatos($request));

        return redirect()
            ->route('areas.index')
            ->with('success', 'Área creada correctamente.');
    }

    public function show(Area $area)
    {
        $area->load('faena');

        return Inertia::render('Areas/Show', [
            'area' => $area,
        ]);
    }

    public function edit(Area $area)
    {
        return Inertia::render('Areas/Edit', [
            'area' => $area,
            'faenas' => Faena::orderBy('nombre')->get(),
        ]);
    }

    public function update(Request $request, Area $area)
    {
        $area->update($this->validarDatos($request, $area));

        return redirect()
            ->route('areas.index')
            ->with('success', 'Área actualizada correctamente.');
    }

    public function destroy(Area $area)
    {
        // eventos.id_area es ON DELETE RESTRICT
        if (Evento::where('id_area', $area->id_area)->exists()) {
            return back()->with('error', 'No se puede eliminar: el área tiene eventos asociados.');
        }

        $area->delete();

        return redirect()
            ->route('areas.index')
            ->with('success', 'Área eliminada correctamente.');
    }

    private function validarDatos(Request $request, ?Area $area = null): array
    {
        return $request->validate([
            'id_faena' => 'required|integer|exists:faenas,id_faena',
            'codigo_area' => [
                'required',
                'string',
                'max:50',
                // uq_area_faena_codigo: único por (id_faena, codigo_area)
                Rule::unique('areas', 'codigo_area')
                    ->where('id_faena', $request->input('id_faena'))
                    ->ignore($area?->id_area, 'id_area'),
            ],
            'descripcion' => 'nullable|string',
        ]);
    }
}