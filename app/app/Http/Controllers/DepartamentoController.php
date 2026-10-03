<?php

namespace App\Http\Controllers;

use App\Models\Departamento;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DepartamentoController extends Controller
{
    public function index()
    {
        return Inertia::render('Departamentos/Index', [
            'departamentos' => Departamento::withCount('trabajadores')
                ->orderBy('nombre')
                ->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Departamentos/Create');
    }

    public function store(Request $request)
    {
        Departamento::create($this->validarDatos($request));

        return redirect()
            ->route('departamentos.index')
            ->with('success', 'Departamento creado correctamente.');
    }

    public function show(Departamento $departamento)
    {
        $departamento->load('trabajadores.persona');

        return Inertia::render('Departamentos/Show', [
            'departamento' => $departamento,
        ]);
    }

    public function edit(Departamento $departamento)
    {
        return Inertia::render('Departamentos/Edit', [
            'departamento' => $departamento,
        ]);
    }

    public function update(Request $request, Departamento $departamento)
    {
        $departamento->update($this->validarDatos($request, $departamento));

        return redirect()
            ->route('departamentos.index')
            ->with('success', 'Departamento actualizado correctamente.');
    }

    public function destroy(Departamento $departamento)
    {
        // trabajador_departamento hace cascade
        $departamento->delete();

        return redirect()
            ->route('departamentos.index')
            ->with('success', 'Departamento eliminado correctamente.');
    }

    private function validarDatos(Request $request, ?Departamento $departamento = null): array
    {
        return $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:150',
                Rule::unique('departamentos', 'nombre')->ignore($departamento?->id_departamento, 'id_departamento'),
            ],
            'descripcion' => 'nullable|string',
            'estado' => 'sometimes|required|string|in:activo,inactivo',
        ]);
    }
}