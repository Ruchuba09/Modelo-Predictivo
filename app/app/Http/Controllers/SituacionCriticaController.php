<?php

namespace App\Http\Controllers;

use App\Models\Evento;
use App\Models\SituacionCritica;
use App\Models\Supervisor;
use App\Models\Trabajador;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SituacionCriticaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $situacionCriticas = SituacionCritica::with(['trabajador', 'supervisor.trabajador', 'evento'])
            ->latest()
            ->get();

        return Inertia::render('SituacionCriticas/Index', [
            'situacionCriticas' => $situacionCriticas,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('SituacionCriticas/Create', $this->datosParaFormulario());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $this->validarDatos($request);

        SituacionCritica::create($validated);

        return redirect()
            ->route('situacion-criticas.index')
            ->with('success', 'Situación crítica registrada correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(SituacionCritica $situacionCritica)
    {
        $situacionCritica->load(['trabajador', 'supervisor.trabajador', 'evento']);

        return Inertia::render('SituacionCriticas/Show', [
            'situacionCritica' => $situacionCritica,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SituacionCritica $situacionCritica)
    {
        return Inertia::render('SituacionCriticas/Edit', array_merge(
            $this->datosParaFormulario(),
            ['situacionCritica' => $situacionCritica]
        ));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SituacionCritica $situacionCritica)
    {
        $validated = $this->validarDatos($request);

        $situacionCritica->update($validated);

        return redirect()
            ->route('situacion-criticas.index')
            ->with('success', 'Situación crítica actualizada correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SituacionCritica $situacionCritica)
    {
        $situacionCritica->delete();

        return redirect()
            ->route('situacion-criticas.index')
            ->with('success', 'Situación crítica eliminada correctamente.');
    }

    /**
     * Datos comunes (selects) usados por los formularios create/edit.
     */
    private function datosParaFormulario(): array
    {
        return [
            'trabajadores' => Trabajador::select('id_trabajador', 'nombre_1', 'apellido_1')
                ->orderBy('nombre_1')
                ->get(),
            'supervisores' => Supervisor::with('trabajador:id_trabajador,nombre_1,apellido_1')
                ->get(),
            'eventos' => Evento::select('id_evento', 'descripcion')
                ->orderBy('id_evento', 'desc')
                ->get(),
        ];
    }

    /**
     * Reglas de validación compartidas entre store() y update().
     */
    private function validarDatos(Request $request): array
    {
        return $request->validate([
            'id_trabajador' => 'required|integer|exists:trabajadors,id_trabajador',
            'id_supervisor' => 'nullable|integer|exists:supervisors,id_trabajador',
            'id_evento' => 'required|integer|exists:eventos,id_evento',
            'referencia' => 'required|string|max:255',
            'condicion' => 'required|in:1,2',
        ]);
    }
}