<?php

namespace App\Http\Controllers;

use App\Models\situacionCritica;
use App\Models\Evento;
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
        return Inertia::render('SituacionCriticas/Index', [
            'situacionCriticas' => situacionCritica::with(['trabajador.persona', 'supervisor.trabajador.persona', 'evento'])
                ->orderByDesc('id')->get()->map(fn ($item) => $this->presentar($item)),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('SituacionCriticas/Create', $this->opciones());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        situacionCritica::create($this->validar($request));
        return redirect()->route('situacion-criticas.index')->with('success', 'Situación crítica registrada.');
    }

    /**
     * Display the specified resource.
     */
    public function show(situacionCritica $situacionCritica)
    {
        return Inertia::render('SituacionCriticas/Show', [
            'situacionCritica' => $this->presentar($situacionCritica->load(['trabajador.persona', 'supervisor.trabajador.persona', 'evento'])),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(situacionCritica $situacionCritica)
    {
        return Inertia::render('SituacionCriticas/Edit', array_merge(
            $this->opciones(),
            ['situacionCritica' => $this->presentar($situacionCritica->load(['trabajador.persona', 'supervisor.trabajador.persona', 'evento']))]
        ));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, situacionCritica $situacionCritica)
    {
        $situacionCritica->update($this->validar($request));
        return redirect()->route('situacion-criticas.index')->with('success', 'Situación crítica actualizada.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(situacionCritica $situacionCritica)
    {
        $situacionCritica->delete();
        return redirect()->route('situacion-criticas.index')->with('success', 'Situación crítica eliminada.');
    }

    private function opciones(): array
    {
        return [
            'trabajadores' => Trabajador::with('persona')->where('estado', 'activo')->get()
                ->map(fn ($trabajador) => $this->trabajadorPlano($trabajador)),
            'supervisores' => Supervisor::with('trabajador.persona')->get()->map(fn ($supervisor) => [
                'id_trabajador' => $supervisor->id_trabajador,
                'trabajador' => $this->trabajadorPlano($supervisor->trabajador),
            ]),
            'eventos' => Evento::select('id_evento', 'descripcion')->orderByDesc('id_evento')->get(),
        ];
    }

    private function validar(Request $request): array
    {
        return $request->validate([
            'id_trabajador' => ['required', 'integer', 'exists:trabajadores,id_trabajador'],
            'id_supervisor' => ['nullable', 'integer', 'exists:supervisores,id_trabajador'],
            'id_evento' => ['required', 'integer', 'exists:eventos,id_evento'],
            'referencia' => ['required', 'string', 'max:255'],
            'condicion' => ['required', 'integer', 'in:1,2'],
        ]);
    }

    private function presentar(situacionCritica $situacion): array
    {
        return array_merge($situacion->toArray(), [
            'trabajador' => $this->trabajadorPlano($situacion->trabajador),
            'supervisor' => $situacion->supervisor ? [
                'id_trabajador' => $situacion->supervisor->id_trabajador,
                'trabajador' => $this->trabajadorPlano($situacion->supervisor->trabajador),
            ] : null,
        ]);
    }

    private function trabajadorPlano(?Trabajador $trabajador): ?array
    {
        if (!$trabajador) return null;
        return array_merge($trabajador->toArray(), $trabajador->persona?->only([
            'rut', 'nombre_1', 'nombre_2', 'apellido_1', 'apellido_2',
        ]) ?? []);
    }
}
