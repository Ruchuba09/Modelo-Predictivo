<?php

namespace App\Http\Controllers;

use App\Models\Evento;
use App\Models\Fatalidad;
use App\Models\Incidente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EventoController extends Controller
{
    public function index()
    {
        $eventos = Evento::with(['incidente', 'fatalidad'])->get();

        return Inertia::render('Eventos/Index', [
            'eventos' => $eventos,
        ]);
    }

    public function create()
    {
        return Inertia::render('Eventos/Create');
    }
    private function trabajadorAutenticado()
    {
        $trabajador = auth()->user()->trabajador;

        abort_if(! $trabajador, 403, 'El usuario autenticado no está vinculado a un trabajador.');

        return $trabajador;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tipo' => 'required|in:incidente,fatalidad',
            'descripcion' => 'required|string',
            'fecha_evento' => 'required|date',
            'gravedad' => 'required_if:tipo,incidente|string',
            'requiere_investigacion' => 'boolean',
            'causa_muerte' => 'required_if:tipo,fatalidad|string',
            'id_victima' => 'required_if:tipo,fatalidad|integer|exists:usuarios.usuarios,id_user',
        ]);

        $evento = DB::transaction(function () use ($validated) {
            $evento = Evento::create([
                'descripcion' => $validated['descripcion'],
                'fecha_evento' => $validated['fecha_evento'],
            ]);

            if ($validated['tipo'] === 'incidente') {
                Incidente::create([
                    'id_evento' => $evento->id_evento,
                    'gravedad' => $validated['gravedad'],
                    'requiere_investigacion' => $validated['requiere_investigacion'] ?? false,
                ]);
            } else {
                Fatalidad::create([
                    'id_evento' => $evento->id_evento,
                    'causa_muerte' => $validated['causa_muerte'],
                    'id_victima' => $validated['id_victima'],
                ]);
            }

            return $evento;
        });

        return redirect()->route('eventos.show', $evento->id_evento);
    }

    public function show(Evento $evento)
    {
        $evento->load(['incidente', 'fatalidad']);

        return Inertia::render('Eventos/Show', [
            'evento' => $evento,
        ]);
    }

    public function edit(Evento $evento)
    {
        $evento->load(['incidente', 'fatalidad']);

        return Inertia::render('Eventos/Edit', [
            'evento' => $evento,
        ]);
    }
    public function cerrar(Evento $evento)
    {
        abort_unless(auth()->user()->tieneRol('administrativo'), 403);

        if ($evento->estado === 'cerrada') {
            return back()->withErrors(['estado' => 'El evento ya está cerrado.']);
        }

        $evento->update([
            'estado' => 'cerrada',
            'fecha_cierre' => now(),
        ]);

        return redirect()->route('eventos.show', $evento->id_evento);
    }
    public function update(Request $request, Evento $evento)
    {
        $validated = $request->validate([
            'descripcion' => 'required|string',
            'fecha_evento' => 'required|date',
            'gravedad' => 'nullable|string',
            'requiere_investigacion' => 'boolean',
            'causa_muerte' => 'nullable|string',
            'id_victima' => 'nullable|integer|exists:usuarios.usuarios,id_user',
        ]);

        DB::transaction(function () use ($evento, $validated) {
            $evento->update([
                'descripcion' => $validated['descripcion'],
                'fecha_evento' => $validated['fecha_evento'],
            ]);

            if ($evento->incidente) {
                $evento->incidente->update([
                    'gravedad' => $validated['gravedad'] ?? $evento->incidente->gravedad,
                    'requiere_investigacion' => $validated['requiere_investigacion'] ?? $evento->incidente->requiere_investigacion,
                ]);
            }

            if ($evento->fatalidad) {
                $evento->fatalidad->update([
                    'causa_muerte' => $validated['causa_muerte'] ?? $evento->fatalidad->causa_muerte,
                    'id_victima' => $validated['id_victima'] ?? $evento->fatalidad->id_victima,
                ]);
            }
        });

        return redirect()->route('eventos.show', $evento->id_evento);
    }

    public function destroy(Evento $evento)
    {
        $evento->delete();

        return redirect()->route('eventos.index');
    }
}