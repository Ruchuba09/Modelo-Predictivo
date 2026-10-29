<?php

namespace App\Http\Controllers;

use App\Models\tarjeta_pare;
use App\Models\trabajador;
use App\Models\modelo_tarjeta_pare;
use App\Models\escala_riesgo;
use App\Models\Proyecto;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TarjetaPareController extends Controller
{
    public function index()
    {
        $tarjetas = tarjeta_pare::with(['trabajador', 'modelo', 'escalaRiesgo', 'proyecto'])
            ->orderBy('fecha_reporte', 'desc')
            ->get();

        return Inertia::render('TarjetasPare/Index', [
            'tarjetas' => $tarjetas,
        ]);
    }

    public function create()
    {
        return Inertia::render('TarjetasPare/TarjetasPareCrear', $this->datosFormulario());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_trabajador' => ['required', 'exists:usuarios.trabajadors,id'],
            'id_modelo' => ['required', 'exists:usuarios.modelo_tarjeta_pare,id'],
            'id_escala_riesgo' => ['required', 'exists:usuarios.escala_riesgo,id'],
            'id_proyecto' => ['nullable', 'exists:usuarios.proyectos,id'],
            'ubicacion' => ['nullable', 'string', 'max:255'],
            'descripcion' => ['required', 'string'],
            'estado' => ['nullable', 'string', 'in:abierta,en_proceso,cerrada'],
        ]);

        $validated['estado'] = $validated['estado'] ?? 'abierta';

        tarjeta_pare::create($validated);

        return redirect()->route('tarjetas-pare.index')
            ->with('success', 'Tarjeta PARE creada correctamente.');
    }

    public function show(tarjeta_pare $tarjeta)
    {
        return Inertia::render('TarjetasPare/TarjetasPareMostrar', [
            'tarjeta' => $tarjeta->load(['trabajador', 'modelo', 'escalaRiesgo', 'proyecto']),
        ]);
    }

    public function edit(tarjeta_pare $tarjeta)
    {
        return Inertia::render('TarjetasPare/TarjetasPareEditar', array_merge(
            $this->datosFormulario(),
            ['tarjeta' => $tarjeta->load(['trabajador', 'modelo', 'escalaRiesgo', 'proyecto'])]
        ));
    }

    public function update(Request $request, tarjeta_pare $tarjeta)
    {
        $validated = $request->validate([
            'id_trabajador' => ['required', 'exists:usuarios.trabajadors,id'],
            'id_modelo' => ['required', 'exists:usuarios.modelo_tarjeta_pare,id'],
            'id_escala_riesgo' => ['required', 'exists:usuarios.escala_riesgo,id'],
            'id_proyecto' => ['nullable', 'exists:usuarios.proyectos,id'],
            'ubicacion' => ['nullable', 'string', 'max:255'],
            'descripcion' => ['required', 'string'],
            'estado' => ['required', 'string', 'in:abierta,en_proceso,cerrada'],
        ]);

        $tarjeta->update($validated);

        return redirect()->route('tarjetas-pare.index')
            ->with('success', 'Tarjeta PARE actualizada correctamente.');
    }

    public function destroy(tarjeta_pare $tarjeta)
    {
        $tarjeta->delete();

        return redirect()->route('tarjetas-pare.index')
            ->with('success', 'Tarjeta PARE eliminada correctamente.');
    }

    private function datosFormulario(): array
    {
        return [
            'trabajadores' => trabajador::select('id', 'nombre_1', 'apellido_1', 'rut')->get(),
            'modelos' => modelo_tarjeta_pare::select('id', 'nombre')->get(),
            'escalas' => escala_riesgo::select('id', 'nivel', 'color_hex')->orderBy('valor')->get(),
            'proyectos' => Proyecto::select('id', 'nombre', 'alias')->get(),
        ];
    }
}