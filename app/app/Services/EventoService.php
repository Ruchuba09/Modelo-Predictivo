<?php

namespace App\Services;

use App\DataTransferObjects\ActualizarEventoData;
use App\DataTransferObjects\CerrarEventoData;
use App\DataTransferObjects\CrearEventoData;
use App\Enums\EstadoEvento;
use App\Models\Administrativo;
use App\Models\Asignacion;
use App\Models\Cuadrilla;
use App\Models\Evento;
use App\Models\Obrero;
use App\Models\Proyecto;
use App\Models\Supervisor;
use App\Models\TipoEvento;
use App\Models\Trabajador;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EventoService
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

    public function __construct(
        private readonly EvidenciaEventoService $evidencias
    ) {}

    public function obtenerDashboard(): Collection
    {
        $columnas = [
            DB::raw('DATE(fecha_creacion) as fecha'),
        ];

        foreach (array_keys(self::CONDICIONES) as $id) {
            $columnas[] = DB::raw(
                "SUM(CASE WHEN condicion = {$id} THEN 1 ELSE 0 END) as c{$id}"
            );
        }

        return Evento::select($columnas)
            ->where('id_tipo_evento', self::TIPO_EVENTO_PARE)
            ->where('fecha_creacion', '>=', now()->subDays(7))
            ->groupBy(DB::raw('DATE(fecha_creacion)'))
            ->orderBy('fecha', 'asc')
            ->get();
    }

    public function listar(array $filtros = []): Collection
    {
        $query = Evento::with(['tipoEvento', 'proyecto']);

        $this->aplicarFiltros($query, $filtros);
        $this->restringirASupervisor($query);

        return $query->orderByDesc('fecha_creacion')->get();
    }

    public function listarMisReportes(array $filtros = []): Collection
    {
        $trabajador = Auth::user()?->trabajador;

        abort_if(
            ! $trabajador,
            403,
            'El usuario no está registrado como trabajador.'
        );

        $query = Evento::with(['tipoEvento', 'proyecto'])
            ->where('id_trabajador', $trabajador->id_trabajador);

        $this->aplicarFiltros($query, $filtros);

        return $query->orderByDesc('fecha_creacion')->get();
    }

    public function listarProyectos(): Collection
    {
        return Proyecto::all();
    }

    public function listarProyectosParaCrear(): Collection
    {
        $proyectos = Proyecto::where('estado', 'activo')
            ->get(['id_proyecto', 'nombre']);

        return $proyectos->isEmpty()
            ? Proyecto::all(['id_proyecto', 'nombre'])
            : $proyectos;
    }

    public function obtenerDatosFormularioCrear(): array
    {
        $usuario = Auth::user();

        $trabajadorActual = $usuario?->trabajador
            ?->loadMissing([
                'persona',
                'obrero',
                'supervisor',
                'administrativo',
            ]);

        $proyectosUsuario = $this->obtenerProyectosDeTrabajador(
            $trabajadorActual
        );

        $usuarioTrabajador = $trabajadorActual ? [
            'id_trabajador' => $trabajadorActual->id_trabajador,
            'nombre' => trim(
                ($trabajadorActual->persona?->nombre_1 ?? '') . ' ' .
                ($trabajadorActual->persona?->apellido_1 ?? '')
            ),
            'cargo' => $trabajadorActual->cargo,
            'proyectos' => $proyectosUsuario
                ->map(fn ($p) => [
                    'id_proyecto' => $p->id_proyecto,
                    'nombre' => $p->nombre,
                ])
                ->values(),
        ] : null;

        $trabajadores = Trabajador::with([
            'persona',
            'obrero',
            'supervisor',
            'administrativo',
        ])
            ->where('estado', 'activo')
            ->get()
            ->map(function (Trabajador $trabajador) {
                $proyectos = $this->obtenerProyectosDeTrabajador(
                    $trabajador
                );

                $nombre = trim(
                    ($trabajador->persona?->nombre_1 ?? '') . ' ' .
                    ($trabajador->persona?->apellido_1 ?? '')
                );

                return [
                    'id_trabajador' => $trabajador->id_trabajador,
                    'nombre' => $nombre
                        ?: "Trabajador #{$trabajador->id_trabajador}",
                    'rut' => $trabajador->persona?->rut ?? '',
                    'cargo' => $trabajador->cargo ?? '',
                    'proyectos' => $proyectos
                        ->map(fn ($p) => [
                            'id_proyecto' => $p->id_proyecto,
                            'nombre' => $p->nombre,
                        ])
                        ->values(),
                ];
            })
            ->sortBy('nombre')
            ->values();

        return [
            'tiposEvento' => TipoEvento::all(),
            'usuarioTrabajador' => $usuarioTrabajador,
            'trabajadores' => $trabajadores,
            'proyectos' => $this->listarProyectosParaCrear(),
        ];
    }

    public function crear(CrearEventoData $datos): Evento
    {
        $usuario = Auth::user();

        $idTrabajador = $datos->esParaMi
            ? ($usuario?->trabajador?->id_trabajador
                ?? $datos->idTrabajador)
            : $datos->idTrabajador;

        $rutasArchivos = [];

        try {
            return DB::transaction(function () use (
                $datos,
                $idTrabajador,
                &$rutasArchivos
            ) {
                $rutasArchivos = $this->evidencias->guardar(
                    $datos->evidencias,
                    'evidencias'
                );

                $campos = [
                    'id_tipo_evento' => $datos->idTipoEvento,
                    'condicion' => $datos->condicion,
                    'descripcion' => $datos->descripcion,
                    'referencia' => $datos->referencia,
                    'id_proyecto' => $datos->idProyecto,
                    'id_trabajador' => $idTrabajador,
                    'id_supervisor' => $this->supervisorDelTrabajador($idTrabajador),
                    'estado' => EstadoEvento::Abierto,
                    'evidencia' => $rutasArchivos,
                ];

                if ($datos->severidad !== null
                    && $datos->severidad !== '') {
                    $campos['severidad'] = $datos->severidad;
                }

                $evento = Evento::create($campos);
                if ($idTrabajador) {
                    $evento->trabajadores()->sync([$idTrabajador]);
                }

                Log::alert(
                    "ALERTA DE SEGURIDAD MÓDULO A: Tarjeta PARE registrada. " .
                    "Evento ID: {$evento->id_evento}, " .
                    "Proyecto ID: {$evento->id_proyecto}, " .
                    "Trabajador ID: {$evento->id_trabajador}"
                );

                return $evento;
            });
        } catch (\Throwable $e) {
            $this->evidencias->eliminar($rutasArchivos);
            throw $e;
        }
    }

    public function obtener(Evento $evento): Evento
    {
        return $evento->load([
            'tipoEvento',
            'proyecto',
            'area',
            'administrador.trabajador.persona',
            'trabajador.persona',
            'supervisor.trabajador.persona',
            'trabajador.obrero.cuadrilla.supervisor.trabajador.persona',
        ]);
    }

    public function obtenerParaEditar(Evento $evento): Evento
    {
        return $evento->load(['tipoEvento', 'proyecto']);
    }

    public function actualizar(
        Evento $evento,
        ActualizarEventoData $datos
    ): Evento {
        $evento->update($datos->toArray());

        return $evento->refresh();
    }

    public function eliminar(Evento $evento): void
    {
        $rutas = $this->evidencias->rutas($evento);

        DB::transaction(fn () => $evento->delete());

        // Los archivos se borran solo si la fila se eliminó correctamente.
        $this->evidencias->eliminar($rutas);
    }

    public function listarGrafico(array $filtros = []): array
    {
        $query = Evento::where(
            'id_tipo_evento',
            self::TIPO_EVENTO_PARE
        );

        if (! empty($filtros['id_proyecto'])) {
            $query->where(
                'id_proyecto',
                $filtros['id_proyecto']
            );
        }

        if (! empty($filtros['fecha_inicio'])) {
            $query->whereDate(
                'fecha_creacion',
                '>=',
                $filtros['fecha_inicio']
            );
        }

        if (! empty($filtros['fecha_fin'])) {
            $query->whereDate(
                'fecha_creacion',
                '<=',
                $filtros['fecha_fin']
            );
        }

        $this->restringirASupervisor($query);

        $conteos = $query
            ->select('condicion', DB::raw('COUNT(*) as total'))
            ->groupBy('condicion')
            ->get()
            ->mapWithKeys(
                fn ($fila) => [
                    (int) $fila->condicion => (int) $fila->total,
                ]
            );

        $datos = [];

        foreach (self::CONDICIONES as $id => $nombre) {
            $datos[] = [
                'id' => "c{$id}",
                'condicion' => $nombre,
                'hallazgos' => $conteos->get($id, 0),
            ];
        }

        return $datos;
    }

    public function tomarReporte(Evento $evento): void
    {
        $supervisor = $this->supervisorAutenticado();
        $cuadrilla = $evento->trabajador?->cuadrillaActual();

        abort_if(
            ! $cuadrilla,
            422,
            'El trabajador no tiene cuadrilla asignada.'
        );

        abort_unless(
            (int) $cuadrilla->id_supervisor
                === (int) $supervisor->id_trabajador,
            403,
            'No eres el supervisor asignado a esta cuadrilla.'
        );

        // Bloquea la fila: si dos supervisores lo toman a la vez, el segundo
        // espera, ve el estado ya actualizado y recibe el 422.
        DB::transaction(function () use ($evento, $supervisor) {
            $bloqueado = Evento::whereKey($evento->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                $bloqueado->estado?->puedeTomarse(),
                422,
                'El evento ya fue tomado o cerrado.'
            );

            $bloqueado->update([
                'id_supervisor' => $supervisor->id_trabajador,
                'estado' => EstadoEvento::EnRevision,
            ]);

            $evento->setRawAttributes($bloqueado->getAttributes(), true);
        });
    }

    public function cerrar(
        Evento $evento,
        CerrarEventoData $datos
    ): void {
        $administrativo = $this->administrativoAutenticado();

        $rutasArchivos = [];

        try {
            DB::transaction(function () use (
                $evento,
                $datos,
                $administrativo,
                &$rutasArchivos
            ) {
                $bloqueado = Evento::whereKey($evento->getKey())
                    ->lockForUpdate()
                    ->firstOrFail();

                abort_unless(
                    $bloqueado->estado?->esPendiente(),
                    422,
                    'El evento debe estar abierto o en revisión antes de cerrarse.'
                );

                $rutasArchivos = $this->evidencias->guardar(
                    $datos->evidenciasCierre,
                    'evidencias_cierre'
                );

                $bloqueado->update([
                    'id_administrador' => $administrativo->id_trabajador,
                    'estado' => EstadoEvento::Cerrado,
                    'justificacion' => $datos->justificacion,
                    'evidencia_cierre' => $rutasArchivos,
                    'fecha_cierre' => now(),
                ]);

                $evento->setRawAttributes($bloqueado->getAttributes(), true);
            });
        } catch (\Throwable $e) {
            $this->evidencias->eliminar($rutasArchivos);
            throw $e;
        }
    }

    public function listarSinAdministrador(): Collection
    {
        return Evento::with([
            'tipoEvento',
            'proyecto',
            'trabajador.persona',
            'supervisor.trabajador.persona',
        ])
            ->whereNull('id_administrador')
            ->orderByDesc('fecha_creacion')
            ->get();
    }

    public function obtenerProyectosDeTrabajador(
        ?Trabajador $trabajador
    ): Collection {
        if (! $trabajador) {
            return collect();
        }

        $hoy = now()->toDateString();
        $proyectoIds = collect();

        if ($trabajador->administrativo) {
            $ids = Asignacion::where(
                'id_administrador',
                $trabajador->id_trabajador
            )
                ->whereDate('fecha_inicio', '<=', $hoy)
                ->where(function ($q) use ($hoy) {
                    $q->whereNull('fecha_termino')
                        ->orWhereDate('fecha_termino', '>=', $hoy);
                })
                ->pluck('id_proyecto');

            if ($ids->isEmpty()) {
                $ids = Asignacion::where(
                    'id_administrador',
                    $trabajador->id_trabajador
                )->pluck('id_proyecto');
            }

            $proyectoIds = $proyectoIds->merge($ids);
        }

        if ($trabajador->supervisor) {
            $cuadrillas = Cuadrilla::where(
                'id_supervisor',
                $trabajador->id_trabajador
            )->pluck('id_cuadrilla')->all();

            if (! empty($cuadrillas)) {
                $ids = Asignacion::whereIn(
                    'id_cuadrilla',
                    $cuadrillas
                )
                    ->whereDate('fecha_inicio', '<=', $hoy)
                    ->where(function ($q) use ($hoy) {
                        $q->whereNull('fecha_termino')
                            ->orWhereDate('fecha_termino', '>=', $hoy);
                    })
                    ->pluck('id_proyecto');

                if ($ids->isEmpty()) {
                    $ids = Asignacion::whereIn(
                        'id_cuadrilla',
                        $cuadrillas
                    )->pluck('id_proyecto');
                }

                $proyectoIds = $proyectoIds->merge($ids);
            }
        }

        if ($cuadrilla = $trabajador->cuadrillaActual()) {
            $idCuadrilla = $cuadrilla->id_cuadrilla;

            $ids = Asignacion::where(
                'id_cuadrilla',
                $idCuadrilla
            )
                ->whereDate('fecha_inicio', '<=', $hoy)
                ->where(function ($q) use ($hoy) {
                    $q->whereNull('fecha_termino')
                        ->orWhereDate('fecha_termino', '>=', $hoy);
                })
                ->pluck('id_proyecto');

            if ($ids->isEmpty()) {
                $ids = Asignacion::where(
                    'id_cuadrilla',
                    $idCuadrilla
                )->pluck('id_proyecto');
            }

            $proyectoIds = $proyectoIds->merge($ids);
        }

        $proyectoIds = $proyectoIds->unique()->values();

        if ($proyectoIds->isNotEmpty()) {
            $proyectos = Proyecto::whereIn(
                'id_proyecto',
                $proyectoIds
            )->get();

            if ($proyectos->isNotEmpty()) {
                return $proyectos;
            }
        }

        $activos = Proyecto::where('estado', 'activo')->get();

        return $activos->isNotEmpty()
            ? $activos
            : Proyecto::all();
    }

    private function aplicarFiltros($query, array $filtros): void
    {
        if (! empty($filtros['id_evento'])) {
            $query->where('id_evento', (int) $filtros['id_evento']);
        }

        if (! empty($filtros['id_proyecto'])) {
            $query->where(
                'id_proyecto',
                $filtros['id_proyecto']
            );
        }

        $estado = strtolower(trim((string) ($filtros['estado'] ?? '')));
        if ($estado !== '') {
            $this->filtrarPorEstado($query, $estado);
        } elseif (! empty($filtros['condicion'])) {
            $query->where('condicion', $filtros['condicion']);
        }

        if (! empty($filtros['fecha_inicio'])) {
            $query->whereDate(
                'fecha_creacion',
                '>=',
                $filtros['fecha_inicio']
            );
        }

        if (! empty($filtros['fecha_fin'])) {
            $query->whereDate(
                'fecha_creacion',
                '<=',
                $filtros['fecha_fin']
            );
        }
    }

    /**
     * "abierto" incluye todo lo pendiente (abierto + en revisión), como en
     * el listado original. Un número filtra por condición.
     */
    public static function filtrarPorEstado($query, string $estado): void
    {
        $enum = EstadoEvento::desdeTexto($estado);

        if ($enum === EstadoEvento::Abierto) {
            $query->whereIn('estado', EstadoEvento::valoresPendientes());
        } elseif ($enum !== null) {
            $query->where('estado', $enum->value);
        } elseif (is_numeric($estado)) {
            $query->where('condicion', (int) $estado);
        } else {
            // Valor desconocido: no debe devolver resultados.
            $query->whereRaw('1 = 0');
        }
    }

    private function restringirASupervisor($query): void
    {
        $usuario = Auth::user();
        $trabajador = $usuario?->trabajador;

        if (! $usuario?->tieneRol('Supervisor')
            || $usuario->tieneRol('Administrador')
            || ! $trabajador) {
            return;
        }

        $idTrabajador = $trabajador->id_trabajador;
        $cuadrillaIds = Cuadrilla::where('id_supervisor', $idTrabajador)
            ->pluck('id_cuadrilla');
        $obreroIds = Obrero::whereIn('id_cuadrilla', $cuadrillaIds)
            ->pluck('id_trabajador');

        $query->where(function ($subquery) use ($idTrabajador, $cuadrillaIds, $obreroIds) {
            if ($obreroIds->isNotEmpty()) {
                $subquery->whereIn('id_trabajador', $obreroIds);
            }

            $subquery->orWhere('id_supervisor', $idTrabajador)
                ->orWhere('id_trabajador', $idTrabajador);
        });
    }

    private function supervisorAutenticado(): Supervisor
    {
        $supervisor = Auth::user()?->trabajador?->supervisor;

        abort_if(
            ! $supervisor,
            403,
            'El usuario autenticado no está registrado como supervisor.'
        );

        return $supervisor;
    }

    private function administrativoAutenticado(): Administrativo
    {
        $administrativo = Auth::user()?->trabajador?->administrativo;

        abort_if(
            ! $administrativo,
            403,
            'El usuario autenticado no está registrado como administrativo.'
        );

        return $administrativo;
    }

    private function supervisorDelTrabajador(?int $idTrabajador): ?int
    {
        if (! $idTrabajador) {
            return null;
        }

        $trabajador = Trabajador::with(['obrero', 'supervisor'])->find($idTrabajador);
        if (! $trabajador) {
            return null;
        }

        if ($cuadrilla = $trabajador->cuadrillaActual()) {
            return $cuadrilla->id_supervisor;
        }

        return $trabajador->supervisor ? $idTrabajador : null;
    }
}
