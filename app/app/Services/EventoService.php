<?php

namespace App\Services;

use App\DataTransferObjects\ActualizarEventoData;
use App\DataTransferObjects\CerrarEventoData;
use App\DataTransferObjects\CrearEventoData;
use App\Models\Administrativo;
use App\Models\Asignacion;
use App\Models\Cuadrilla;
use App\Models\Evento;
use App\Models\Obrero;
use App\Models\Proyecto;
use App\Models\Supervisor;
use App\Models\TipoEvento;
use App\Models\Trabajador;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

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
                $rutasArchivos = $this->guardarArchivos(
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
                    'estado' => 'abierta',
                    'evidencia' => $rutasArchivos,
                ];

                if ($datos->severidad !== null
                    && $datos->severidad !== '') {
                    $campos['severidad'] = $datos->severidad;
                }

                $evento = Evento::create($campos);

                Log::alert(
                    "ALERTA DE SEGURIDAD MÓDULO A: Tarjeta PARE registrada. " .
                    "Evento ID: {$evento->id_evento}, " .
                    "Proyecto ID: {$evento->id_proyecto}, " .
                    "Trabajador ID: {$evento->id_trabajador}"
                );

                return $evento;
            });
        } catch (\Throwable $e) {
            $this->eliminarArchivos($rutasArchivos);
            throw $e;
        }
    }

    public function obtener(Evento $evento): Evento
    {
        return $evento->load([
            'tipoEvento',
            'proyecto',
            'area',
            'administrador',
            'trabajador',
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
        $evento->delete();
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

        abort_if(
            $evento->estado !== 'abierta',
            422,
            'El evento ya fue tomado o cerrado.'
        );

        $evento->update([
            'id_supervisor' => $supervisor->id_trabajador,
            'estado' => 'proceso',
        ]);
    }

    public function cerrar(
        Evento $evento,
        CerrarEventoData $datos
    ): void {
        $administrativo = $this->administrativoAutenticado();

        abort_if(
            ! in_array($evento->estado, ['abierta', 'proceso'], true),
            422,
            'El evento debe estar abierto o en proceso antes de cerrarse.'
        );

        $rutasArchivos = [];

        try {
            DB::transaction(function () use (
                $evento,
                $datos,
                $administrativo,
                &$rutasArchivos
            ) {
                $rutasArchivos = $this->guardarArchivos(
                    $datos->evidenciasCierre,
                    'evidencias_cierre'
                );

                $evento->update([
                    'id_administrador' => $administrativo->id_trabajador,
                    'estado' => 'cerrada',
                    'justificacion' => $datos->justificacion,
                    'evidencia_cierre' => $rutasArchivos,
                    'fecha_cierre' => now(),
                ]);
            });
        } catch (\Throwable $e) {
            $this->eliminarArchivos($rutasArchivos);
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

    public function obtenerEvidencias(Evento $evento): array
    {
        $evidencias = $evento->evidencia;

        if (is_string($evidencias)) {
            $evidencias = json_decode($evidencias, true) ?: [];
        } elseif (! is_array($evidencias)) {
            $evidencias = [];
        }

        $archivos = [];

        foreach ($evidencias as $ruta) {
            $nombre = basename($ruta);
            $extension = strtolower(
                pathinfo($ruta, PATHINFO_EXTENSION)
            );

            $archivos[] = [
                'nombre' => $nombre,
                'ruta' => "/eventos/archivo/{$nombre}",
                'extension' => $extension ?: 'archivo',
                'es_imagen' => in_array(
                    $extension,
                    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
                    true
                ),
            ];
        }

        return [
            'total' => count($archivos),
            'evidencias' => $archivos,
        ];
    }

    public function responderArchivo(string $archivo)
    {
        $nombreSeguro = basename($archivo);

        foreach (['evidencias', 'evidencias_cierre'] as $carpeta) {
            $ruta = "{$carpeta}/{$nombreSeguro}";

            if (Storage::disk('public')->exists($ruta)) {
                return Storage::disk('public')->response($ruta);
            }
        }

        abort(404, 'Archivo no encontrado');
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
        if (! empty($filtros['id_proyecto'])) {
            $query->where(
                'id_proyecto',
                $filtros['id_proyecto']
            );
        }

        if (! empty($filtros['condicion'])) {
            $query->where(
                'condicion',
                $filtros['condicion']
            );
        }

        if (! empty($filtros['estado'])) {
            $query->where('estado', $filtros['estado']);
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

    private function guardarArchivos(
        array $archivos,
        string $carpeta
    ): array {
        $rutas = [];

        foreach ($archivos as $archivo) {
            if (! $archivo instanceof UploadedFile) {
                continue;
            }

            $rutas[] = $archivo->store($carpeta, 'public');
        }

        return $rutas;
    }

    private function eliminarArchivos(array $rutas): void
    {
        foreach ($rutas as $ruta) {
            Storage::disk('public')->delete($ruta);
        }
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
}
