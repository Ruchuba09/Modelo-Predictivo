<?php

namespace App\Http\Controllers;

use App\Models\Administrativo;
use App\Models\Asignacion;
use App\Models\Cuadrilla;
use App\Models\Evento;
use App\Models\Obrero;
use App\Models\Proyecto;
use App\Models\Supervisor;
use App\Models\TipoEvento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class EventoController extends Controller
{
    private const TIPO_EVENTO_PARE = 4;

    private const CONDICIONES = [
        1 => '1. Cond. Inseguras',
        2 => '2. Herramientas',
        3 => '3. Falta EPP',
        4 => '4. Capacitación',
        5 => '5. Procedimientos',
        6 => '6. Recursos',
        7 => '7. AST/VATS/ERT',
        8 => '8. Permisos',
        9 => '9. Est. Físico/Mental',
        10 => '10. Otros',
    ];

    public function dashboard()
    {
        $columnas = [DB::raw('DATE(fecha_creacion) as fecha')];

        foreach (array_keys(self::CONDICIONES) as $id) {
            $columnas[] = DB::raw("SUM(CASE WHEN condicion = {$id} THEN 1 ELSE 0 END) as c{$id}");
        }

        $tarjetasPare = Evento::select($columnas)
            ->where('id_tipo_evento', self::TIPO_EVENTO_PARE)
            ->where('fecha_creacion', '>=', now()->subDays(7))
            ->groupBy(DB::raw('DATE(fecha_creacion)'))
            ->orderBy('fecha', 'asc')
            ->get();

        return Inertia::render('dashboard', [
            'datosGrafico' => $tarjetasPare,
        ]);
    }

    public function index(Request $request)
    {
        $query = Evento::with(['tipoEvento', 'proyecto']);

        if ($request->filled('id_proyecto')) {
            $query->where('id_proyecto', $request->id_proyecto);
        }

        if ($request->filled('condicion')) {
            $query->where('condicion', $request->condicion);
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_creacion', '>=', $request->fecha_inicio);
        }

        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_creacion', '<=', $request->fecha_fin);
        }

        return Inertia::render('Eventos/Index', [
            'eventos' => $query->orderByDesc('fecha_creacion')->get(),
            'proyectos' => Proyecto::all(),
            'filtros' => $request->only(['id_proyecto', 'condicion', 'estado', 'fecha_inicio', 'fecha_fin']),
        ]);
    }

    public function indexGrafico(Request $request)
    {
        $query = Evento::where('id_tipo_evento', self::TIPO_EVENTO_PARE);

        if ($request->filled('id_proyecto')) {
            $query->where('id_proyecto', $request->id_proyecto);
        }
        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_creacion', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_creacion', '<=', $request->fecha_fin);
        }

        $conteos = $query
            ->select('condicion', DB::raw('COUNT(*) as total'))
            ->groupBy('condicion')
            ->get()
            ->mapWithKeys(fn ($fila) => [(int) $fila->condicion => (int) $fila->total]);

        $datosGrafico = [];
        foreach (self::CONDICIONES as $id => $nombre) {
            $datosGrafico[] = [
                'id' => "c{$id}",
                'condicion' => $nombre,
                'hallazgos' => $conteos->get($id, 0),
            ];
        }

        return Inertia::render('dashboard', [
            'datosGrafico' => $datosGrafico,
            'proyectos' => Proyecto::all(),
            'filtros' => $request->only(['id_proyecto', 'fecha_inicio', 'fecha_fin']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Eventos/Create', [
            'tiposEvento' => TipoEvento::all(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_tipo_evento' => 'required|integer|exists:tipo_eventos,id_tipo_evento',
            'condicion' => 'required|integer|between:1,10',
            'descripcion' => 'required|string|max:500',
            'referencia' => 'required|string|max:255',
            'severidad' => 'nullable|string|max:50',
            'evidencia' => 'nullable|array|max:3',
            'evidencia.*' => 'file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
        ]);

        $rutasArchivos = $this->guardarArchivos($request, 'evidencia', 'evidencias');

        $datos = [
            'id_tipo_evento' => $request->id_tipo_evento,
            'condicion' => $request->condicion,
            'descripcion' => $request->descripcion,
            'referencia' => $request->referencia,
            'id_proyecto' => $this->proyectoActualDelTrabajador(),
            'id_trabajador' => auth()->user()->trabajador?->id_trabajador,
            'estado' => 'abierta',
            'evidencia' => $rutasArchivos,
        ];

        if ($request->filled('severidad')) {
            $datos['severidad'] = $request->severidad;
        }

        $evento = Evento::create($datos);

        Log::alert("ALERTA DE SEGURIDAD MÓDULO A: Tarjeta PARE registrada. Evento ID: {$evento->id_evento}, Proyecto ID: {$evento->id_proyecto}");

        return redirect()->route('eventos.index')->with('success', 'Reporte creado con éxito');
    }

    public function show(Evento $evento)
    {
        $evento->load(['tipoEvento', 'proyecto', 'area', 'administrador', 'trabajador.persona', 'evidencias']);

        return Inertia::render('Eventos/Show', [
            'evento' => $evento,
        ]);
    }

    public function edit(Evento $evento)
    {
        $evento->load(['tipoEvento', 'proyecto']);

        return Inertia::render('Eventos/Edit', [
            'evento' => $evento,
        ]);
    }

    public function update(Request $request, Evento $evento)
    {
        $validated = $request->validate([
            'condicion' => 'required|integer|between:1,10',
            'descripcion' => 'required|string|max:500',
            'referencia' => 'required|string|max:255',
        ]);

        $evento->update($validated);

        return redirect()->route('eventos.show', $evento->id_evento);
    }

    public function tomarReporte(Evento $evento)
    {
        $supervisor = $this->supervisorAutenticado();
        $cuadrilla = $evento->trabajador?->obrero?->cuadrilla;

        abort_if(! $cuadrilla, 422, 'El trabajador no tiene cuadrilla asignada.');
        abort_unless(
            (int) $cuadrilla->id_supervisor === (int) $supervisor->id_trabajador,
            403,
            'No eres el supervisor asignado a esta cuadrilla.'
        );
        abort_if($evento->estado !== 'abierta', 422, 'El evento ya fue tomado o cerrado.');

        $evento->update([
            'id_supervisor' => $supervisor->id_trabajador,
            'estado' => 'proceso',
        ]);

        return redirect()->route('eventos.show', $evento->id_evento);
    }

    public function cerrar(Request $request, Evento $evento)
    {
        $administrativo = $this->administrativoAutenticado();

        abort_if(
            ! in_array($evento->estado, ['abierta', 'proceso']),
            422,
            'El evento debe estar abierto o en proceso antes de cerrarse.'
        );

        $request->validate([
            'justificacion' => 'required|string|max:500',
            'evidencia_cierre' => 'nullable|array|max:3',
            'evidencia_cierre.*' => 'file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
        ]);

        $evento->update([
            'id_administrador' => $administrativo->id_trabajador,
            'estado' => 'cerrada',
            'justificacion' => $request->justificacion,
            'evidencia_cierre' => $this->guardarArchivos($request, 'evidencia_cierre', 'evidencias_cierre'),
            'fecha_cierre' => now(),
        ]);

        return redirect()->route('eventos.show', $evento->id_evento)->with('success', 'Evento cerrado con éxito');
    }

    public function destroy(Evento $evento)
    {
        $evento->delete();

        return redirect()->route('eventos.index');
    }

    private function guardarArchivos(Request $request, string $campo, string $carpeta): array
    {
        $rutas = [];

        if ($request->hasFile($campo)) {
            foreach ($request->file($campo) as $archivo) {
                $rutas[] = $archivo->store($carpeta, 'public');
            }
        }

        return $rutas;
    }

    private function proyectoActualDelTrabajador(): int
    {
        $trabajador = auth()->user()->trabajador;

        abort_if(! $trabajador, 403, 'El usuario autenticado no está registrado como trabajador.');

        if ($trabajador->administrativo) {
            return $this->proyectoVigente(
                'id_administrador',
                [$trabajador->id_trabajador],
                'No tienes un proyecto asignado actualmente.'
            );
        }

        if ($trabajador->supervisor) {
            $cuadrillas = Cuadrilla::where('id_supervisor', $trabajador->id_trabajador)->pluck('id_cuadrilla')->all();

            abort_if(empty($cuadrillas), 422, 'No tienes una cuadrilla asignada.');

            return $this->proyectoVigente(
                'id_cuadrilla',
                $cuadrillas,
                'Tu cuadrilla no tiene un proyecto asignado actualmente.'
            );
        }

        if ($trabajador->obrero) {
            abort_if(! $trabajador->obrero->id_cuadrilla, 422, 'No tienes una cuadrilla asignada.');

            return $this->proyectoVigente(
                'id_cuadrilla',
                [$trabajador->obrero->id_cuadrilla],
                'Tu cuadrilla no tiene un proyecto asignado actualmente.'
            );
        }

        abort(403, 'El usuario no tiene un rol válido (obrero, supervisor o administrativo).');
    }

    private function proyectoVigente(string $columna, array $ids, string $mensaje): int
    {
        $hoy = now()->toDateString();

        $asignacion = Asignacion::whereIn($columna, $ids)
            ->whereDate('fecha_inicio', '<=', $hoy)
            ->where(function ($q) use ($hoy) {
                $q->whereNull('fecha_termino')
                    ->orWhereDate('fecha_termino', '>=', $hoy);
            })
            ->latest('fecha_inicio')
            ->first();

        abort_if(! $asignacion, 422, $mensaje);

        return $asignacion->id_proyecto;
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
}