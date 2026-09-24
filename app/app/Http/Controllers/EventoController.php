<?php

namespace App\Http\Controllers;

use App\Models\Administrativo;
use App\Models\Evento;
use App\Models\Fatalidad;
use App\Models\Incidente;
use App\Models\Obrero;
use App\Models\Supervisor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Asignacion;
class EventoController extends Controller
{
    public function index()
    {
        $eventos = Evento::with(['incidente', 'fatalidad'])->get();

        return Inertia::render('Eventos/Index', [
            'eventos' => $eventos,
        ]);
    }
    public function indexGrafico()
    {
        // 1. Consultar la base de datos agrupando por fecha
        $tarjetasPare = Evento::select(
                DB::raw('DATE(created_at) as fecha'),
                DB::raw('count(*) as cantidad')
            )
            ->where('tipo_evento', 4) // El filtro crucial para Tarjetas PARE
            ->where('created_at', '>=', now()->subDays(7)) // Rango: últimos 7 días
            ->groupBy('fecha')
            ->orderBy('fecha', 'asc')
            ->get();

        // 2. Enviar la variable $tarjetasPare a la vista de React
        return Inertia::render('Dashboard', [
            'datosGrafico' => $tarjetasPare
        ]);
    }

    private function proyectoActualDelObrero(Obrero $obrero): int
    {
        abort_if(! $obrero->id_cuadrilla, 422, 'El obrero no tiene cuadrilla asignada.');

        $asignacion = Asignacion::where('id_cuadrilla', $obrero->id_cuadrilla)
            ->whereNull('fecha_termino')
            ->latest('fecha_inicio')
            ->first();

        abort_if(! $asignacion, 422, 'La cuadrilla no tiene un proyecto asignado actualmente.');

        return $asignacion->id_proyecto;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_tipo_evento' => 'required|integer|exists:tipo_eventos,id_tipo_evento',
            'condicion' => 'required|integer|between:1,10',
            'descripcion' => 'required|string',
        ]);

        $obrero = $this->obreroAutenticado();
        $idProyecto = $this->proyectoActualDelObrero($obrero);

        $evento = Evento::create([
            'id_tipo_evento' => $validated['id_tipo_evento'],
            'id_administrador' => null,
            'id_area' => null,
            'id_proyecto' => $idProyecto,
            'descripcion' => $validated['descripcion'],
            'condicion' => $validated['condicion'],
            'estado' => 'abierto',
        ]);

        return redirect()->route('eventos.show', $evento->id_evento);
    }

    public function create()
    {
        return Inertia::render('Eventos/Create');
    }

    private function obreroAutenticado(): Obrero
    {
        $obrero = auth()->user()->trabajador?->obrero;

        abort_if(! $obrero, 403, 'El usuario autenticado no está registrado como obrero.');

        return $obrero;
    }

    private function supervisorAutenticado(): Supervisor
    {
        $supervisor = auth()->user()->trabajador?->supervisor;

        abort_if(! $supervisor, 403, 'El usuario autenticado no está registrado como supervisor.');

        return $supervisor;
    }

    private function administrativoAutenticado(): Administrativo
    {
        $administrativo = auth()->user()->trabajador?->administrativo;

        abort_if(! $administrativo, 403, 'El usuario autenticado no está registrado como administrativo.');

        return $administrativo;
    }

    
    public function show(Evento $evento)
    {
        $evento->load(['incidente', 'fatalidad', 'trabajador', 'supervisor', 'administrativo']);

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

    public function update(Request $request, Evento $evento)
    {
        $validated = $request->validate([
            'condicion' => 'required|string',
            'descripcion' => 'required|string',
            'referencia' => 'required|string',
            'gravedad' => 'nullable|string',
            'requiere_investigacion' => 'boolean',
            'causa_muerte' => 'nullable|string',
            'id_victima' => 'nullable|integer|exists:obreros,id_trabajador',
        ]);

        DB::transaction(function () use ($evento, $validated) {
            $evento->update([
                'condicion' => $validated['condicion'],
                'descripcion' => $validated['descripcion'],
                'referencia' => $validated['referencia'],
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

    public function tomarReporte(Evento $evento)
    {
        $supervisor = $this->supervisorAutenticado();
        $cuadrillaObrero = $evento->trabajador->cuadrilla;

        abort_if(! $cuadrillaObrero, 422, 'El trabajador no tiene cuadrilla asignada.');
        abort_unless($cuadrillaObrero->id_supervisor === $supervisor->id_trabajador, 403, 'No eres el supervisor asignado a esta cuadrilla.');
        abort_if($evento->estado !== 'abierta', 422, 'El evento ya fue tomado o cerrado.');

        $evento->update([
            'id_supervisor' => $supervisor->id_trabajador,
            'estado' => 'proceso',
        ]);

        return redirect()->route('eventos.show', $evento->id_evento);
    }

    public function cerrar(Evento $evento)
    {
        $administrativo = $this->administrativoAutenticado();

        abort_if($evento->estado !== 'proceso', 422, 'El evento debe estar en proceso antes de cerrarse.');

        $evento->update([
            'id_administrativo' => $administrativo->id_trabajador,
            'estado' => 'cerrada',
            'fecha_cierre' => now(),
        ]);

        return redirect()->route('eventos.show', $evento->id_evento);
    }

    public function destroy(Evento $evento)
    {
        $evento->delete();

        return redirect()->route('eventos.index');
    }
}