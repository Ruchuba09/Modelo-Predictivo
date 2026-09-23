<?php

namespace App\Http\Controllers;

use App\Models\Administrativo;
use App\Models\Obrero;
use App\Models\Supervisor;
use App\Models\Trabajador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        $trabajador = DB::transaction(function () use ($validated) {
            $trabajador = Trabajador::create($validated);

            $this->crearSubtipo($trabajador, $validated['id_tipo_trabajador']);

            return $trabajador;
        });

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
            'trabajador' => $trabajador,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Trabajador $trabajador)
    {
        return Inertia::render('Trabajadores/Edit', [
            'trabajador' => $trabajador,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Trabajador $trabajador)
    {
        $validated = $this->validarDatos($request, $trabajador->id_trabajador);

        DB::transaction(function () use ($trabajador, $validated) {
            $tipoAnterior = $trabajador->id_tipo_trabajador;
            $tipoNuevo = $validated['id_tipo_trabajador'];

            $trabajador->update($validated);

            // Si el tipo de trabajador cambió, hay que borrar el registro
            // hijo anterior (obrero/supervisor/administrativo) y crear el nuevo.
            if ($tipoAnterior !== $tipoNuevo) {
                $this->eliminarSubtipo($trabajador, $tipoAnterior);
                $this->crearSubtipo($trabajador, $tipoNuevo);
            }
        });

        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador actualizado correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Trabajador $trabajador)
    {
        // No hace falta borrar el subtipo manualmente si las FKs tienen
        // ->cascadeOnDelete() (como en tus migraciones de obreros/supervisors).
        $trabajador->delete();

        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador eliminado correctamente.');
    }

    /**
     * Crea el registro correspondiente en la tabla hija según el tipo.
     */
    private function crearSubtipo(Trabajador $trabajador, string $tipo): void
    {
        match ($tipo) {
            'obrero' => Obrero::firstOrCreate(['id_trabajador' => $trabajador->id_trabajador]),
            'supervisor' => Supervisor::firstOrCreate(['id_trabajador' => $trabajador->id_trabajador]),
            'administrativo' => Administrativo::firstOrCreate(['id_trabajador' => $trabajador->id_trabajador]),
        };
    }

    /**
     * Elimina el registro de la tabla hija correspondiente al tipo dado.
     */
    private function eliminarSubtipo(Trabajador $trabajador, ?string $tipo): void
    {
        match ($tipo) {
            'obrero' => Obrero::where('id_trabajador', $trabajador->id_trabajador)->delete(),
            'supervisor' => Supervisor::where('id_trabajador', $trabajador->id_trabajador)->delete(),
            'administrativo' => Administrativo::where('id_trabajador', $trabajador->id_trabajador)->delete(),
            default => null,
        };
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
            'id_tipo_trabajador' => 'required|string|in:obrero,supervisor,administrativo',
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