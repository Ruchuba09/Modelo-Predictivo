<?php

namespace App\Http\Controllers;

use App\Http\Requests\ActualizarEventoRequest;
use App\Http\Requests\CerrarEventoRequest;
use App\Http\Requests\CrearEventoRequest;
use App\Http\Requests\FiltroEventoRequest;
use App\Models\Evento;
use App\Services\EventoService;
use Inertia\Inertia;

class EventoController extends Controller
{
    public function __construct(
        private readonly EventoService $servicio
    ) {}

    public function dashboard()
    {
        return Inertia::render('dashboard', [
            'datosGrafico' => $this->servicio->obtenerDashboard(),
        ]);
    }

    public function index(FiltroEventoRequest $request)
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

        if ($request->filled('id_evento') || $request->filled('id')) {
            $id = trim((string) ($request->id_evento ?? $request->id));
            $cleanId = preg_replace('/\D/', '', $id);
            if ($cleanId !== '') {
                $query->where('id_evento', (int) $cleanId);
            }
        }

        if ($request->filled('id_proyecto')) {
            $query->where('id_proyecto', $request->id_proyecto);
        }

        $filtroEstado = strtolower(trim((string) ($request->input('estado') ?? $request->input('condicion'))));
        if ($filtroEstado !== '') {
            if (in_array($filtroEstado, ['abierto', 'abierta'])) {
                $query->whereIn('estado', ['abierto', 'abierta', 'en_revision', 'proceso']);
            } elseif (in_array($filtroEstado, ['cerrado', 'cerrada'])) {
                $query->whereIn('estado', ['cerrado', 'cerrada']);
            } elseif (is_numeric($filtroEstado)) {
                $query->where('condicion', (int) $filtroEstado);
            } else {
                $query->where('estado', $filtroEstado);
            }
        }

        $fechaInicio = $request->input('fecha_inicio') ?? $request->input('desde');
        if ($fechaInicio) {
            $query->whereDate('fecha_creacion', '>=', $fechaInicio);
        }

        $fechaFin = $request->input('fecha_fin') ?? $request->input('hasta');
        if ($fechaFin) {
            $query->whereDate('fecha_creacion', '<=', $fechaFin);
        }

        return Inertia::render('Eventos/Index', [
            'eventos' => $query->orderByDesc('fecha_creacion')->get(),
            'proyectos' => Proyecto::all(),
            'filtros' => [
                'id_evento' => $request->input('id_evento') ?? $request->input('id') ?? '',
                'id_proyecto' => $request->input('id_proyecto') ?? '',
                'estado' => $request->input('estado') ?? $request->input('condicion') ?? '',
                'fecha_inicio' => $fechaInicio ?? '',
                'fecha_fin' => $fechaFin ?? '',
            ],
        ]);
    }

    public function MisReportes(FiltroEventoRequest $request)
    {
        $trabajador = Auth::user()->trabajador;

        abort_if(! $trabajador, 403, 'El usuario no está registrado como trabajador.');

        $query = Evento::with(['tipoEvento', 'proyecto'])
            ->where('id_trabajador', $trabajador->id_trabajador);

        if ($request->filled('id_evento') || $request->filled('id')) {
            $id = trim((string) ($request->id_evento ?? $request->id));
            $cleanId = preg_replace('/\D/', '', $id);
            if ($cleanId !== '') {
                $query->where('id_evento', (int) $cleanId);
            }
        }

        if ($request->filled('id_proyecto')) {
            $query->where('id_proyecto', $request->id_proyecto);
        }

        $filtroEstado = strtolower(trim((string) ($request->input('estado') ?? $request->input('condicion'))));
        if ($filtroEstado !== '') {
            if (in_array($filtroEstado, ['abierto', 'abierta'])) {
                $query->whereIn('estado', ['abierto', 'abierta', 'en_revision', 'proceso']);
            } elseif (in_array($filtroEstado, ['cerrado', 'cerrada'])) {
                $query->whereIn('estado', ['cerrado', 'cerrada']);
            } elseif (is_numeric($filtroEstado)) {
                $query->where('condicion', (int) $filtroEstado);
            } else {
                $query->where('estado', $filtroEstado);
            }
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
                'id_evento',
                'id_proyecto',
                'condicion',
                'estado',
                'fecha_inicio',
                'fecha_fin',
            ]),
        ]);
    }

    public function indexGrafico(FiltroEventoRequest $request)
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
            'datosGrafico' => $this->servicio->listarGrafico(
                $request->filtrosGrafico()
            ),
            'proyectos' => $this->servicio->listarProyectos(),
            'filtros' => $request->filtrosGrafico(),
        ]);
    }

    public function create()
    {
        return Inertia::render(
            'Eventos/Create',
            $this->servicio->obtenerDatosFormularioCrear()
        );
    }

    public function store(CrearEventoRequest $request)
    {
        $this->servicio->crear($request->toData());

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
            'evento' => $this->servicio->obtener($evento),
        ]);
    }

    public function verArchivo(string $archivo)
    {
        return $this->servicio->responderArchivo($archivo);
    }

    public function obtenerEvidencias(Evento $evento)
    {
        return response()->json(
            $this->servicio->obtenerEvidencias($evento)
        );
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
            'evento' => $this->servicio->obtenerParaEditar($evento),
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

        return redirect()->route(
            'eventos.show',
            $evento->id_evento
        );
    }

    public function tomarReporte(Evento $evento)
    {
        $this->servicio->tomarReporte($evento);

        return redirect()->route(
            'eventos.show',
            $evento->id_evento
        );
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

    public function apiSinAdministrador()
    {
        return response()->json(
            $this->servicio->listarSinAdministrador()
        );
    }
}
