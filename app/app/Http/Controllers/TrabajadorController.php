<?php

namespace App\Http\Controllers;

use App\Models\trabajador;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TrabajadorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $trabajadores = Trabajador::latest()->get();

        return Inertia::render('Trabajadores/Trabajadores', [
            'trabajadores' => $trabajadores,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Trabajadores/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $this->validarDatos($request);

        Trabajador::create($validated);

        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador creado correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(trabajador $trabajador)
    {
        return Inertia::render('Trabajadores/Show', [
            'trabajador' => $trabajador,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(trabajador $trabajador)
    {
        return Inertia::render('Trabajadores/Edit', [
            'trabajador' => $trabajador,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, trabajador $trabajador)
    {
        $validated = $this->validarDatos($request, $trabajador->id);

        $trabajador->update($validated);

        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador actualizado correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(trabajador $trabajador)
    {
        $trabajador->delete();

        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador eliminado correctamente.');
    }

    /**
     * Reglas de validación compartidas entre store() y update().
     */
    private function validarDatos(Request $request, ?int $ignorarId = null): array
    {
        return $request->validate([
            'nombre_1' => 'required|string|max:100',
            'nombre_2' => 'nullable|string|max:100',
            'apellido_1' => 'required|string|max:100',
            'apellido_2' => 'nullable|string|max:100',
            'cargo' => 'required|string|max:100',
            'id_tipo_trabajador' => 'nullable|string|max:50',
            'rut' => [
                'required',
                'string',
                'max:12',
                'unique:usuarios.trabajadors,rut' . ($ignorarId ? ",{$ignorarId}" : ''),
            ],
            'email' => [
                'required',
                'email',
                'max:150',
                'unique:usuarios.trabajadors,email' . ($ignorarId ? ",{$ignorarId}" : ''),
            ],
        ]);
    }
}