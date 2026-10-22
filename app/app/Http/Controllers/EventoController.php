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
use App\Models\Trabajador;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
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
        $user = Auth::user();

        if (! $user) {
            return redirect()->route('login');
        }

        // Si es sólo trabajador (sin rol de Administrador ni Supervisor), redirigir a sus propios reportes
        if (! $user->tieneRol('Administrador', 'Supervisor')) {
            return redirect()->route('eventos.mis-reportes');
        }

        $query = Evento::with(['tipoEvento', 'proyecto']);

        // Si es Supervisor (y no Administrador), filtrar únicamente reportes de su cuadrilla o propios
        if ($user->tieneRol('Supervisor') && ! $user->tieneRol('Administrador')) {
            $trabajador = $user->trabajador;
            $trabajadorId = $trabajador?->id_trabajador;
            $cuadrillaIds = Cuadrilla::where('id_supervisor', $trabajadorId)->pluck('id_cuadrilla');
            $obrerosIds = Obrero::whereIn('id_cuadrilla', $cuadrillaIds)->pluck('id_trabajador')->all();

            $query->where(function ($q) use ($obrerosIds, $trabajadorId) {
                if (! empty($obrerosIds)) {
                    $q->whereIn('id_trabajador', $obrerosIds);
                } else {
                    $q->whereRaw('1=0');
                }
                if ($trabajadorId) {
                    $q->orWhere('id_supervisor', $trabajadorId)
                      ->orWhere('id_trabajador', $trabajadorId);
                }
            });
        }

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

    public function MisReportes(Request $request)
    {
        $trabajador = Auth::user()->trabajador;

        abort_if(! $trabajador, 403, 'El usuario no está registrado como trabajador.');

        $query = Evento::with(['tipoEvento', 'proyecto'])
            ->where('id_trabajador', $trabajador->id_trabajador);

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

        return Inertia::render('Eventos/MisReportes', [
            'eventos' => $query->orderByDesc('fecha_creacion')->get(),
            'proyectos' => Proyecto::all(),
            'filtros' => $request->only([
                'id_proyecto',
                'condicion',
                'estado',
                'fecha_inicio',
                'fecha_fin',
            ]),
        ]);
    }

    public function indexGrafico(Request $request)
    {
        $user = Auth::user();
        $query = Evento::where('id_tipo_evento', self::TIPO_EVENTO_PARE);

        // Si es Supervisor (y no Administrador), restringir métricas a su cuadrilla o propios
        if ($user && $user->tieneRol('Supervisor') && ! $user->tieneRol('Administrador')) {
            $trabajador = $user->trabajador;
            $trabajadorId = $trabajador?->id_trabajador;
            $cuadrillaIds = Cuadrilla::where('id_supervisor', $trabajadorId)->pluck('id_cuadrilla');
            $obrerosIds = Obrero::whereIn('id_cuadrilla', $cuadrillaIds)->pluck('id_trabajador')->all();

            $query->where(function ($q) use ($obrerosIds, $trabajadorId) {
                if (! empty($obrerosIds)) {
                    $q->whereIn('id_trabajador', $obrerosIds);
                } else {
                    $q->whereRaw('1=0');
                }
                if ($trabajadorId) {
                    $q->orWhere('id_supervisor', $trabajadorId)
                      ->orWhere('id_trabajador', $trabajadorId);
                }
            });
        }

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
        $usuario = Auth::user();
        $trabajadorActual = $usuario?->trabajador?->loadMissing(['persona', 'obrero', 'supervisor', 'administrativo']);

        $proyectosUsuario = $this->obtenerProyectosDeTrabajador($trabajadorActual);

        $usuarioTrabajador = $trabajadorActual ? [
            'id_trabajador' => $trabajadorActual->id_trabajador,
            'nombre' => trim(($trabajadorActual->persona?->nombre_1 ?? '') . ' ' . ($trabajadorActual->persona?->apellido_1 ?? '')),
            'cargo' => $trabajadorActual->cargo,
            'proyectos' => $proyectosUsuario->map(fn ($p) => [
                'id_proyecto' => $p->id_proyecto,
                'nombre' => $p->nombre,
            ])->values(),
        ] : null;

        $trabajadores = Trabajador::with(['persona', 'obrero', 'supervisor', 'administrativo'])
            ->where('estado', 'activo')
            ->get()
            ->map(function (Trabajador $t) {
                $proyectos = $this->obtenerProyectosDeTrabajador($t);
                $nombre1 = $t->persona?->nombre_1 ?? '';
                $apellido1 = $t->persona?->apellido_1 ?? '';
                $nombreCompleto = trim("{$nombre1} {$apellido1}");

                return [
                    'id_trabajador' => $t->id_trabajador,
                    'nombre' => $nombreCompleto ?: "Trabajador #{$t->id_trabajador}",
                    'rut' => $t->persona?->rut ?? '',
                    'cargo' => $t->cargo ?? '',
                    'proyectos' => $proyectos->map(fn ($p) => [
                        'id_proyecto' => $p->id_proyecto,
                        'nombre' => $p->nombre,
                    ])->values(),
                ];
            })
            ->sortBy('nombre')
            ->values();

        $todosProyectos = Proyecto::where('estado', 'activo')->get(['id_proyecto', 'nombre']);
        if ($todosProyectos->isEmpty()) {
            $todosProyectos = Proyecto::all(['id_proyecto', 'nombre']);
        }

        return Inertia::render('Eventos/Create', [
            'tiposEvento' => TipoEvento::all(),
            'usuarioTrabajador' => $usuarioTrabajador,
            'trabajadores' => $trabajadores,
            'proyectos' => $todosProyectos,
        ]);
    }

    public function store(Request $request)
    {
        $esParaMi = $request->boolean('es_para_mi', true);

        $request->validate([
            'id_tipo_evento' => 'required|integer|exists:tipo_eventos,id_tipo_evento',
            'condicion' => 'required|integer|between:1,10',
            'descripcion' => 'required|string|max:500',
            'referencia' => 'required|string|max:255',
            'id_proyecto' => 'required|integer|exists:proyectos,id_proyecto',
            'es_para_mi' => 'nullable|boolean',
            'id_trabajador' => $esParaMi
                ? 'nullable|integer|exists:trabajadores,id_trabajador'
                : 'required|integer|exists:trabajadores,id_trabajador',
            'severidad' => 'nullable|string|max:50',
            'evidencia' => 'nullable|array|max:3',
            'evidencia.*' => 'file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
        ], [
            'id_proyecto.required' => 'Debe seleccionar un proyecto.',
            'id_trabajador.required' => 'Debe seleccionar a la persona reportada.',
            'condicion.between' => 'Por favor seleccione una condición válida.',
        ]);

        $rutasArchivos = $this->guardarArchivos($request, 'evidencia', 'evidencias');

        $idTrabajadorFinal = $esParaMi
            ? (auth()->user()->trabajador?->id_trabajador ?? $request->input('id_trabajador'))
            : $request->input('id_trabajador');

        $idSupervisor = null;
        if ($idTrabajadorFinal) {
            $obrero = Obrero::with('cuadrilla')->find($idTrabajadorFinal);
            if ($obrero && $obrero->id_cuadrilla) {
                $idSupervisor = $obrero->cuadrilla?->id_supervisor;
            } elseif (Supervisor::where('id_trabajador', $idTrabajadorFinal)->exists()) {
                $idSupervisor = $idTrabajadorFinal;
            }
        }

        $datos = [
            'id_tipo_evento' => $request->id_tipo_evento,
            'condicion' => $request->condicion,
            'descripcion' => $request->descripcion,
            'referencia' => $request->referencia,
            'id_proyecto' => $request->id_proyecto,
            'id_trabajador' => $idTrabajadorFinal,
            'id_supervisor' => $idSupervisor,
            'estado' => 'abierta',
            'evidencia' => $rutasArchivos,
        ];

        if ($request->filled('severidad')) {
            $datos['severidad'] = $request->severidad;
        }

        $evento = Evento::create($datos);

        Log::alert("ALERTA DE SEGURIDAD MÓDULO A: Tarjeta PARE registrada. Evento ID: {$evento->id_evento}, Proyecto ID: {$evento->id_proyecto}, Trabajador ID: {$evento->id_trabajador}");

        if (! auth()->user()?->tieneRol('Administrador', 'Supervisor')) {
            return redirect()->route('eventos.mis-reportes')->with('success', 'Reporte creado con éxito');
        }

        return redirect()->route('eventos.index')->with('success', 'Reporte creado con éxito');
    }

    public function obtenerProyectosDeTrabajador(?Trabajador $trabajador): Collection
    {
        if (! $trabajador) {
            return collect();
        }

        $hoy = now()->toDateString();
        $proyectoIds = collect();

        if ($trabajador->administrativo) {
            $ids = Asignacion::where('id_administrador', $trabajador->id_trabajador)
                ->whereDate('fecha_inicio', '<=', $hoy)
                ->where(function ($q) use ($hoy) {
                    $q->whereNull('fecha_termino')->orWhereDate('fecha_termino', '>=', $hoy);
                })
                ->pluck('id_proyecto');

            if ($ids->isEmpty()) {
                $ids = Asignacion::where('id_administrador', $trabajador->id_trabajador)->pluck('id_proyecto');
            }
            $proyectoIds = $proyectoIds->merge($ids);
        }

        if ($trabajador->supervisor) {
            $cuadrillas = Cuadrilla::where('id_supervisor', $trabajador->id_trabajador)->pluck('id_cuadrilla')->all();
            if (! empty($cuadrillas)) {
                $ids = Asignacion::whereIn('id_cuadrilla', $cuadrillas)
                    ->whereDate('fecha_inicio', '<=', $hoy)
                    ->where(function ($q) use ($hoy) {
                        $q->whereNull('fecha_termino')->orWhereDate('fecha_termino', '>=', $hoy);
                    })
                    ->pluck('id_proyecto');

                if ($ids->isEmpty()) {
                    $ids = Asignacion::whereIn('id_cuadrilla', $cuadrillas)->pluck('id_proyecto');
                }
                $proyectoIds = $proyectoIds->merge($ids);
            }
        }

        if ($trabajador->obrero && $trabajador->obrero->id_cuadrilla) {
            $idCuadrilla = $trabajador->obrero->id_cuadrilla;
            $ids = Asignacion::where('id_cuadrilla', $idCuadrilla)
                ->whereDate('fecha_inicio', '<=', $hoy)
                ->where(function ($q) use ($hoy) {
                    $q->whereNull('fecha_termino')->orWhereDate('fecha_termino', '>=', $hoy);
                })
                ->pluck('id_proyecto');

            if ($ids->isEmpty()) {
                $ids = Asignacion::where('id_cuadrilla', $idCuadrilla)->pluck('id_proyecto');
            }
            $proyectoIds = $proyectoIds->merge($ids);
        }

        $proyectoIds = $proyectoIds->unique()->values();

        if ($proyectoIds->isNotEmpty()) {
            $proyectos = Proyecto::whereIn('id_proyecto', $proyectoIds)->get();
            if ($proyectos->isNotEmpty()) {
                return $proyectos;
            }
        }

        $activos = Proyecto::where('estado', 'activo')->get();
        return $activos->isNotEmpty() ? $activos : Proyecto::all();
    }

    public function show(Evento $evento)
    {
        $user = Auth::user();
        if (! $user) {
            abort(401);
        }

        $trabajador = $user->trabajador;
        $trabajadorId = $trabajador?->id_trabajador;

        if ($user->tieneRol('Administrador')) {
            // Administrador tiene acceso total a todos los reportes
        } elseif ($user->tieneRol('Supervisor')) {
            $cuadrillaIds = Cuadrilla::where('id_supervisor', $trabajadorId)->pluck('id_cuadrilla');
            $obrerosIds = Obrero::whereIn('id_cuadrilla', $cuadrillaIds)->pluck('id_trabajador')->all();

            $tieneAcceso = (
                ($trabajadorId && (int) $evento->id_trabajador === (int) $trabajadorId) ||
                ($trabajadorId && (int) $evento->id_supervisor === (int) $trabajadorId) ||
                ($evento->id_trabajador && in_array((int) $evento->id_trabajador, array_map('intval', $obrerosIds), true))
            );

            abort_unless($tieneAcceso, 403, 'No tienes permisos para ver este reporte.');
        } else {
            // Trabajador común: solo puede ver sus propios reportes
            $tieneAcceso = ($trabajadorId && (int) $evento->id_trabajador === (int) $trabajadorId);
            abort_unless($tieneAcceso, 403, 'No tienes permisos para ver este reporte.');
        }

        $evento->load([
            'tipoEvento',
            'proyecto',
            'area',
            'administrador.trabajador.persona',
            'trabajador.persona',
            'supervisor.trabajador.persona',
            'trabajador.obrero.cuadrilla.supervisor.trabajador.persona',
        ]);

        if (! $evento->supervisor && $evento->trabajador?->obrero?->cuadrilla?->supervisor) {
            $evento->setRelation('supervisor', $evento->trabajador->obrero->cuadrilla->supervisor);
        }

        return Inertia::render('Eventos/Show', [
            'evento' => $evento,
        ]);
    }

    public function verArchivo(string $archivo)
    {
        $nombreSeguro = basename($archivo);

        // 1. Verificar en evidencias
        $ruta = 'evidencias/' . $nombreSeguro;
        if (\Illuminate\Support\Facades\Storage::disk('public')->exists($ruta)) {
            return \Illuminate\Support\Facades\Storage::disk('public')->response($ruta);
        }

        // 2. Verificar en evidencias_cierre
        $rutaCierre = 'evidencias_cierre/' . $nombreSeguro;
        if (\Illuminate\Support\Facades\Storage::disk('public')->exists($rutaCierre)) {
            return \Illuminate\Support\Facades\Storage::disk('public')->response($rutaCierre);
        }

        abort(404, 'Archivo no encontrado');
    }

    public function obtenerEvidencias(Evento $evento)
    {
        $evidenciasRaw = $evento->evidencia;

        if (is_string($evidenciasRaw)) {
            $evidencias = json_decode($evidenciasRaw, true) ?: [];
        } elseif (is_array($evidenciasRaw)) {
            $evidencias = $evidenciasRaw;
        } else {
            $evidencias = [];
        }

        $archivos = [];
        foreach ($evidencias as $ruta) {
            $nombreArchivo = basename($ruta);
            $extension = strtolower(pathinfo($ruta, PATHINFO_EXTENSION));
            $esImagen = in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']);

            $archivos[] = [
                'nombre'    => $nombreArchivo,
                'ruta'      => "/eventos/archivo/{$nombreArchivo}",
                'extension' => $extension ?: 'archivo',
                'es_imagen' => $esImagen,
            ];
        }

        return response()->json([
            'total'      => count($archivos),
            'evidencias' => $archivos,
        ]);
    }

    public function edit(Evento $evento)
    {
        $user = Auth::user();
        $trabajadorId = $user?->trabajador?->id_trabajador;

        $puedeEditar = $user && ($user->tieneRol('Administrador') ||
            ($trabajadorId && (int) $evento->id_trabajador === (int) $trabajadorId && $evento->estado === 'abierta'));

        abort_unless($puedeEditar, 403, 'No tienes permiso para editar este reporte.');

        $evento->load(['tipoEvento', 'proyecto']);

        return Inertia::render('Eventos/Edit', [
            'evento' => $evento,
        ]);
    }

    public function update(Request $request, Evento $evento)
    {
        $user = Auth::user();
        $trabajadorId = $user?->trabajador?->id_trabajador;

        $puedeEditar = $user && ($user->tieneRol('Administrador') ||
            ($trabajadorId && (int) $evento->id_trabajador === (int) $trabajadorId && $evento->estado === 'abierta'));

        abort_unless($puedeEditar, 403, 'No tienes permiso para editar este reporte.');

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
        abort_unless(
            auth()->user()?->tieneRol('Administrador'),
            403,
            'Solo un administrador puede cerrar un reporte.'
        );

        $trabajador = auth()->user()?->trabajador;
        $administrativo = $trabajador?->administrativo;

        $idAdministrador = $administrativo?->id_trabajador;
        if (! $idAdministrador) {
            $primerAdmin = Administrativo::first();
            $idAdministrador = $primerAdmin?->id_trabajador;
        }

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
            'id_administrador' => $idAdministrador,
            'estado' => 'cerrada',
            'justificacion' => $request->justificacion,
            'evidencia_cierre' => $this->guardarArchivos($request, 'evidencia_cierre', 'evidencias_cierre'),
            'fecha_cierre' => now(),
        ]);

        return redirect()->route('eventos.show', $evento->id_evento)->with('success', 'Evento cerrado con éxito');
    }

    public function destroy(Evento $evento)
    {
        abort_unless(
            auth()->user()?->tieneRol('Administrador'),
            403,
            'Solo un administrador puede eliminar reportes.'
        );

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

    public function apiSinAdministrador()
    {
        $eventos = Evento::with([
            'tipoEvento',
            'proyecto',
            'trabajador.persona',
            'supervisor.trabajador.persona',
        ])
        ->whereNull('id_administrador')
        ->orderByDesc('fecha_creacion')
        ->get();

        return response()->json($eventos);
    }

    private function administrativoAutenticado(): Administrativo
    {
        $administrativo = auth()->user()->trabajador?->administrativo;

        abort_if(! $administrativo, 403, 'El usuario autenticado no está registrado como administrativo.');

        return $administrativo;
    }
}

