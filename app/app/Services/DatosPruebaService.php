<?php

namespace App\Services;

use App\Models\Actividad;
use App\Models\Administrativo;
use App\Models\Area;
use App\Models\Asignacion;
use App\Models\Cliente;
use App\Models\Cuadrilla;
use App\Models\Faena;
use App\Models\JefeZona;
use App\Models\Obrero;
use App\Models\Proyecto;
use App\Models\Supervisor;
use App\Models\TipoEvento;
use App\Models\TipoObrero;
use App\Models\Trabajador;
use Carbon\CarbonImmutable;
use Database\Factories\Providers\SeguridadProvider as Texto;
use Database\Seeders\CatalogosSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Genera y limpia datos de prueba. Los incidentes siguen un patrón causal simulado (los reportes
 * preventivos anticipan incidentes), por lo que las métricas del modelo con estos datos no
 * describen el riesgo real de AVA.
 */
class DatosPruebaService
{
    public const TAMANOS = [
        'pequena' => ['etiqueta' => 'Pequeña', 'proyectos' => 4, 'cuadrillas' => 6, 'por_cuadrilla' => 6, 'meses' => 12],
        'mediana' => ['etiqueta' => 'Mediana', 'proyectos' => 10, 'cuadrillas' => 16, 'por_cuadrilla' => 7, 'meses' => 24],
        'grande' => ['etiqueta' => 'Grande', 'proyectos' => 25, 'cuadrillas' => 40, 'por_cuadrilla' => 8, 'meses' => 36],
    ];

    /** Bloquea ejecuciones simultáneas de poblado y limpieza. */
    private const LLAVE_BLOQUEO = 620511;

    private const TAMANO_LOTE = 500;

    /** Se borran en este orden para respetar las claves foráneas. */
    private const TABLAS_OPERATIVAS = [
        'predicciones_registradas', 'actividad_trabajador', 'situacion_criticas', 'evidencias', 'evento_lesion', 'evento_trabajador', 'medidas_correctivas', 'eventos',
        'informes_investigacion_intrava', 'reportes_flash_intrava', 'reportes_previene_intrava', 'hallazgos_intrava',
        'intrava_trabajador_map', 'controles_riesgo', 'riesgos_proyecto', 'analisis_riesgo_trabajo', 'permisos_trabajo',
        'intervenciones_prevencion', 'comite_reuniones', 'hitos_reporte', 'asistencia_diaria', 'horas_hombre',
        'proyecto_avance_semanal', 'proyecto_fase', 'proyecto_equipo', 'mantenciones_equipo', 'equipos', 'clima_diario',
        'trabajadores_cuadrillas', 'entrega_epp', 'trabajador_capacitacion', 'trabajador_aptitud',
        'actividades', 'asignaciones',
    ];

    private const TABLAS_ESTRUCTURA = ['cuadrillas', 'proyectos', 'areas', 'faenas', 'clientes'];

    private const CONTEOS = [
        'proyectos' => 'Proyectos', 'cuadrillas' => 'Cuadrillas', 'trabajadores' => 'Trabajadores', 'actividades' => 'Actividades',
        'eventos' => 'Eventos', 'reportes_previene_intrava' => 'Reporte Previene', 'reportes_flash_intrava' => 'Reportes Flash',
        'informes_investigacion_intrava' => 'Investigaciones', 'hallazgos_intrava' => 'Hallazgos', 'horas_hombre' => 'Horas-hombre',
        'asistencia_diaria' => 'Asistencia',
    ];

    private const CONSERVADOS = ['users' => 'Usuarios', 'roles' => 'Roles', 'permisos' => 'Permisos'];

    public function habilitado(): bool
    {
        return ! app()->isProduction();
    }

    public function resumen(): array
    {
        $contar = fn (array $tablas) => collect($tablas)
            ->filter(fn ($etiqueta, $tabla) => Schema::hasTable($tabla))
            ->map(fn ($etiqueta, $tabla) => ['tabla' => $tabla, 'etiqueta' => $etiqueta, 'total' => DB::table($tabla)->count()])
            ->values();

        return [
            'habilitado' => $this->habilitado(),
            'tamanos' => collect(self::TAMANOS)->map(fn ($t, $clave) => [
                'clave' => $clave,
                'etiqueta' => $t['etiqueta'],
                'proyectos' => $t['proyectos'],
                'cuadrillas' => $t['cuadrillas'],
                'trabajadores' => $t['cuadrillas'] * ($t['por_cuadrilla'] + 1),
                'meses' => $t['meses'],
            ])->values(),
            'datos' => $contar(self::CONTEOS),
            'conservados' => $contar(self::CONSERVADOS),
        ];
    }

    public function poblar(string $tamano): array
    {
        $config = self::TAMANOS[$tamano] ?? throw new RuntimeException("Tamaño desconocido: {$tamano}");

        return $this->exclusivo(function () use ($config) {
            $antes = $this->totales();
            $lote = 'L'.now()->format('ymdHis');
            (new CatalogosSeeder)->run();

            $base = $this->crearEstructura($config, $lote);
            $this->simular($base, $lote);
            $this->crearExposicion($base);

            return collect($this->totales())->map(fn ($total, $tabla) => $total - $antes[$tabla])->all();
        });
    }

    public function limpiar(): array
    {
        return $this->exclusivo(function () {
            $antes = $this->totales();

            foreach (self::TABLAS_OPERATIVAS as $tabla) {
                $this->vaciar($tabla);
            }

            // Las cuentas conservan su trabajador, pero sin cuadrilla ni empresa asignadas.
            DB::table('obreros')->update(['id_cuadrilla' => null]);
            foreach (self::TABLAS_ESTRUCTURA as $tabla) {
                $this->vaciar($tabla);
            }

            $conCuenta = DB::table('users')->select('id_trabajador');
            DB::table('jefes_zona')->whereNotIn('id_trabajador', $conCuenta)->delete();
            $this->vaciar('trabajador_departamento');
            foreach (['obreros', 'supervisores', 'administrativos'] as $tabla) {
                DB::table($tabla)->whereNotIn('id_trabajador', $conCuenta)->delete();
            }
            DB::table('trabajadores')->whereNotIn('id_trabajador', $conCuenta)->delete();
            DB::table('personas')->whereNotIn('id_persona', DB::table('trabajadores')->select('id_persona'))->delete();
            if (Schema::hasTable('empresas')) {
                if (Schema::hasColumn('trabajadores', 'id_empresa')) {
                    DB::table('trabajadores')->update(['id_empresa' => null]);
                }
                $this->vaciar('empresas');
            }
            $this->vaciar('departamentos');
            $this->vaciar('tipo_eventos');
            DB::table('tipo_obreros')->whereNotIn('id_tipo_obrero', DB::table('obreros')->select('id_tipo_obrero'))->delete();

            // Sin estos catálogos no se podría registrar ni una Tarjeta PARE.
            (new CatalogosSeeder)->run();

            return collect($antes)->map(fn ($total, $tabla) => $total - $this->totales()[$tabla])->all();
        });
    }

    private function vaciar(string $tabla): void
    {
        if (Schema::hasTable($tabla)) {
            DB::table($tabla)->delete();
        }
    }

    private function totales(): array
    {
        return collect(self::CONTEOS)
            ->filter(fn ($etiqueta, $tabla) => Schema::hasTable($tabla))
            ->map(fn ($etiqueta, $tabla) => DB::table($tabla)->count())
            ->all();
    }

    private function exclusivo(callable $accion): array
    {
        if (! $this->habilitado()) {
            throw new RuntimeException('Los datos de prueba están deshabilitados en producción.');
        }

        return DB::transaction(function () use ($accion) {
            $libre = DB::selectOne('SELECT pg_try_advisory_xact_lock(?) AS libre', [self::LLAVE_BLOQUEO])->libre;
            if (! $libre) {
                throw new RuntimeException('Ya hay una operación de datos en curso. Espera a que termine.');
            }

            return $accion();
        });
    }

    private function crearEstructura(array $config, string $lote): array
    {
        $inicio = CarbonImmutable::now()->startOfWeek()->subMonths($config['meses']);
        $administrador = $this->administrador();
        $tipoObrero = TipoObrero::query()->orderBy('id_tipo_obrero')->firstOrFail();
        $turnos = Schema::hasTable('cat_turno') ? DB::table('cat_turno')->pluck('id_turno', 'nombre') : collect();

        $nClientes = max(2, (int) ceil($config['proyectos'] / 3));
        $nFaenas = max(2, (int) ceil($config['proyectos'] / 2));
        $clientes = Cliente::factory()->count($nClientes)->create();
        $faenas = Faena::factory()->count($nFaenas)->create();

        $areasPorFaena = [];
        foreach ($faenas as $faena) {
            $areasPorFaena[$faena->id_faena] = collect(Texto::AREAS)->shuffle()->take(mt_rand(3, 5))
                ->map(fn ($area) => Area::query()->create([
                    'id_faena' => $faena->id_faena, 'codigo_area' => $area[0], 'descripcion' => $area[1],
                ])->id_area)->all();
        }

        $proyectos = [];
        $hoy = CarbonImmutable::now()->startOfDay();
        foreach (range(1, $config['proyectos']) as $i) {
            $faena = $faenas[($i - 1) % $nFaenas];
            $desde = $inicio->addWeeks(mt_rand(0, (int) ($config['meses'] * 1.5)));
            // Uno de cada cinco proyectos ya terminó, para que el historial incluya cierres.
            $hasta = $i % 5 === 0 ? $desde->addWeeks(mt_rand(16, 40))->min($hoy->subWeeks(2)) : null;
            $proyecto = Proyecto::factory()->create([
                'id_faena' => $faena->id_faena,
                'id_cliente' => $clientes[($i - 1) % $nClientes]->id_cliente,
                'fecha_inicio' => $desde->toDateString(),
                'fecha_termino' => $hasta?->toDateString(),
                'estado' => $hasta ? 'finalizado' : 'activo',
            ]);
            $proyectos[$proyecto->id_proyecto] = [
                'id' => $proyecto->id_proyecto, 'nombre' => $proyecto->nombre, 'faena' => $faena->id_faena,
                'desde' => $desde, 'hasta' => $hasta ?? $hoy, 'areas' => $areasPorFaena[$faena->id_faena],
                'cuadrillas' => [], 'riesgo' => mt_rand(50, 200) / 100,
            ];
        }

        // Las cuentas de prueba reciben datos para poder revisar sus vistas al iniciar sesión.
        $supervisoresCuenta = Supervisor::query()
            ->whereIn('id_trabajador', DB::table('users')->select('id_trabajador'))
            ->whereNotIn('id_trabajador', DB::table('cuadrillas')->select('id_supervisor'))
            ->pluck('id_trabajador');
        $obrerosLibres = Obrero::query()->whereNull('id_cuadrilla')->pluck('id_trabajador');

        $idsProyecto = array_keys($proyectos);
        $membresias = [];
        $asignacionesActividad = [];
        $riesgosCriticos = DB::table('cat_riesgo_critico')->pluck('id_riesgo_critico')->all();
        $jefes = [];
        foreach (range(1, max(1, (int) ceil($config['cuadrillas'] / 4))) as $unused) {
            $jefes[] = JefeZona::query()->create([
                'id_trabajador' => Trabajador::factory()->create(['cargo' => 'Jefe de zona'])->id_trabajador,
            ])->id_trabajador;
        }
        foreach (range(1, $config['cuadrillas']) as $i) {
            $proyecto = &$proyectos[$idsProyecto[($i - 1) % count($idsProyecto)]];
            $supervisor = $supervisoresCuenta->shift() ?? Supervisor::query()->create([
                'id_trabajador' => Trabajador::factory()->create(['cargo' => 'Supervisor de terreno'])->id_trabajador,
            ])->id_trabajador;
            $cuadrilla = Cuadrilla::factory()->create([
                'id_supervisor' => $supervisor,
                'numero_cuadrilla' => sprintf('%s-C%03d', $lote, $i),
                'id_jefe_zona' => $jefes[($i - 1) % count($jefes)],
            ]);

            $miembros = [];
            foreach (range(1, $config['por_cuadrilla']) as $unused) {
                $trabajador = $obrerosLibres->shift();
                // El historial se inserta aparte, con las fechas simuladas del proyecto.
                if ($trabajador) {
                    Obrero::query()->whereKey($trabajador)->update(['id_cuadrilla' => $cuadrilla->id_cuadrilla]);
                } else {
                    $trabajador = Trabajador::factory()->enTerreno()->create()->id_trabajador;
                    Obrero::withoutEvents(fn () => Obrero::query()->create([
                        'id_trabajador' => $trabajador, 'id_tipo_obrero' => $tipoObrero->id_tipo_obrero,
                        'id_cuadrilla' => $cuadrilla->id_cuadrilla,
                    ]));
                }
                $miembros[] = $trabajador;
                $membresias[] = [
                    'id_trabajador' => $trabajador, 'id_cuadrilla' => $cuadrilla->id_cuadrilla,
                    'fecha_inicio' => $proyecto['desde']->toDateString(),
                    'fecha_fin' => null,
                ];
            }

            $asignacion = Asignacion::factory()->create([
                'id_administrador' => $administrador, 'id_proyecto' => $proyecto['id'], 'id_cuadrilla' => $cuadrilla->id_cuadrilla,
                'fecha_inicio' => $proyecto['desde']->toDateString(),
                'fecha_termino' => $proyecto['hasta']->lt($hoy) ? $proyecto['hasta']->toDateString() : null,
            ]);

            // Actividades consecutivas de 8 a 16 semanas; la última sigue en curso si el proyecto está activo.
            $actividades = [];
            $cursor = $proyecto['desde'];
            while ($cursor->lt($proyecto['hasta'])) {
                $fin = $cursor->addWeeks(mt_rand(8, 16));
                $abierta = $fin->gte($proyecto['hasta']);
                $actividad = Actividad::factory()->create([
                    'id_asignacion' => $asignacion->id_asignacion,
                    'fecha_inicio' => $cursor->toDateString(),
                    'fecha_termino' => $abierta && $proyecto['hasta']->gte($hoy) ? null : $fin->min($proyecto['hasta'])->toDateString(),
                    'estado' => $abierta && $proyecto['hasta']->gte($hoy) ? 'en_progreso' : 'completada',
                    'id_riesgo_critico' => $riesgosCriticos ? self::elegir($riesgosCriticos) : null,
                ]);
                $actividades[] = ['id' => $actividad->id_actividad, 'desde' => $cursor, 'hasta' => $fin];
                $enCurso = $abierta && $proyecto['hasta']->gte($hoy);
                foreach ($miembros as $miembro) {
                    $asignacionesActividad[] = [
                        'id_actividad' => $actividad->id_actividad, 'id_trabajador' => $miembro, 'id_asignado_por' => $supervisor,
                        'fecha_inicio' => $cursor->toDateTimeString(),
                        'fecha_fin' => $enCurso ? null : $fin->min($hoy)->toDateTimeString(),
                        'motivo_fin' => $enCurso ? null : 'completada',
                    ];
                }
                $cursor = $fin;
            }

            $proyecto['cuadrillas'][] = [
                'id' => $cuadrilla->id_cuadrilla, 'supervisor' => $supervisor, 'miembros' => $miembros,
                'propension' => array_map(fn () => mt_rand(20, 300) / 100, $miembros), 'actividades' => $actividades,
            ];
            unset($proyecto);
        }
        $this->insertar('trabajadores_cuadrillas', $membresias);
        $this->insertar('actividad_trabajador', $asignacionesActividad);
        if (Schema::hasColumn('cuadrillas', 'id_turno') && $turnos->isNotEmpty()) {
            DB::table('cuadrillas')->where('numero_cuadrilla', 'like', $lote.'-%')->update(['id_turno' => $turnos->first()]);
        }

        return [
            'proyectos' => array_values(array_filter($proyectos, fn ($p) => $p['cuadrillas'] !== [])),
            'administrador' => $administrador,
            'tipos' => TipoEvento::query()->pluck('id_tipo_evento', 'nombre'),
            'turnos' => $turnos,
            'severidades' => DB::table('cat_severidad')->pluck('id_severidad', 'nivel')->all(),
            'categorias' => DB::table('cat_categoria_evento')->pluck('id_categoria_evento')->all(),
            'causas_inmediatas' => DB::table('cat_causa')->where('tipo', 'inmediata')->pluck('id_causa')->all(),
            'causas_basicas' => DB::table('cat_causa')->where('tipo', 'basica')->pluck('id_causa')->all(),
            'causas_raiz' => DB::table('cat_causa')->where('tipo', 'raiz')->pluck('id_causa')->all(),
            'clasificaciones' => DB::table('cat_clasificacion_incidente')->pluck('id_clasificacion_incidente', 'codigo')->all(),
        ];
    }

    private function administrador(): int
    {
        $existente = Administrativo::query()->orderBy('id_trabajador')->value('id_trabajador');

        return $existente ?? Administrativo::query()->create([
            'id_trabajador' => Trabajador::factory()->create(['cargo' => 'Administrador de contrato'])->id_trabajador,
        ])->id_trabajador;
    }

    /**
     * Simula cada proyecto por semana. Una condición latente del proyecto genera reportes preventivos
     * y, con una semana de desfase, eleva la probabilidad de incidente.
     */
    private function simular(array $base, string $lote): void
    {
        $hoy = CarbonImmutable::now();
        $idTipo = fn (string $nombre) => $base['tipos'][$nombre] ?? throw new RuntimeException("Falta el tipo de evento {$nombre}");
        $tiposProactivos = [
            ['Tarjeta PARE', 30], ['Hallazgo', 20], ['Observacion preventiva', 15], ['No conformidad', 10],
        ];
        $eventos = $participantes = $criticas = $lesiones = $medidas = $previene = $flash = $informes = $hallazgos = [];
        $idFuente = (int) (DB::table('reportes_flash_intrava')->max('id_intrava') ?? 900000);
        $idPreviene = (int) (DB::table('reportes_previene_intrava')->max('id_intrava') ?? 900000);
        $idInforme = (int) (DB::table('informes_investigacion_intrava')->max('id_intrava') ?? 900000);
        $partes = $this->catalogo('cat_parte_cuerpo', 'id_parte_cuerpo');
        $lesionesCat = $this->catalogo('cat_tipo_lesion', 'id_tipo_lesion');
        $numero = 0;

        foreach ($base['proyectos'] as $proyecto) {
            $latente = 0.0;
            $intensidadPrevia = 1.0;
            $pesosArea = array_map(fn () => mt_rand(20, 300) / 100, $proyecto['areas']);

            for ($semana = $proyecto['desde']->startOfWeek(); $semana->lte($proyecto['hasta']); $semana = $semana->addWeek()) {
                $latente = 0.85 * $latente + $this->normal(0.35);
                $intensidad = exp($latente);

                foreach (range(1, max(1, $this->poisson(1.1 * $intensidad))) as $unused) {
                    if (mt_rand(1, 100) > 100 - 15) {
                        $fecha = $this->fechaEnSemana($semana, $proyecto['hasta']);
                        $previene[] = $this->filaPreviene(++$idPreviene, $proyecto, $fecha, $hoy, $pesosArea);

                        continue;
                    }
                    if (mt_rand(1, 100) <= 12) {
                        $hallazgos[] = $this->filaHallazgo($proyecto, $this->fechaEnSemana($semana, $proyecto['hasta']), $hoy);

                        continue;
                    }
                    $tipo = $this->ponderado($tiposProactivos);
                    $id = ++$numero;
                    $fila = $this->filaEvento($id, $idTipo($tipo), $proyecto, $semana, $base, $lote, $hoy, $pesosArea,
                        Texto::CONDICIONES, ['Leve' => 20, 'Baja' => 45, 'Media' => 25, 'Alta' => 10]);
                    if ($tipo === 'Tarjeta PARE') {
                        $evento = &$fila['evento'];
                        $evento['tipo_detencion'] = self::elegir(['total', 'total', 'parcial', 'sin_detencion']);
                        if ($evento['tipo_detencion'] !== 'sin_detencion') {
                            $evento['fecha_detencion'] = $evento['fecha_ocurrencia'];
                            // Se reanuda antes del cierre, salvo que el cierre sea anterior a la media jornada.
                            $evento['fecha_reinicio'] = $evento['fecha_cierre'];
                            $evento['id_autoriza_reinicio'] = $evento['fecha_cierre'] ? $evento['id_supervisor'] : null;
                        }
                        unset($evento);
                    }
                    $eventos[] = $fila['evento'];
                    $participantes[] = ['id_evento' => $id, 'id_trabajador' => $fila['evento']['id_trabajador'], 'rol' => 'reportante'];
                    if ($tipo === 'Tarjeta PARE') {
                        $criticas[] = [
                            'id_trabajador' => $fila['evento']['id_trabajador'], 'id_supervisor' => $fila['evento']['id_supervisor'],
                            'id_evento' => $id, 'referencia' => $fila['evento']['referencia'], 'condicion' => $fila['evento']['condicion'],
                        ];
                    }
                }

                // El riesgo de esta semana depende de las condiciones de la semana anterior.
                $probabilidad = 1 - exp(-0.11 * $proyecto['riesgo'] * $intensidadPrevia ** 1.2);
                if (mt_rand(0, 9999) / 10000 < $probabilidad) {
                    if (mt_rand(1, 100) <= 35) {
                        $fecha = $this->fechaEnSemana($semana, $proyecto['hasta']);
                        $idFuente++;
                        $flash[] = $this->filaFlash($idFuente, $proyecto, $fecha, $pesosArea, $base);
                        if (mt_rand(1, 100) <= 60) {
                            $informes[] = [
                                'id_intrava' => ++$idInforme, 'id_reporte_flash_intrava' => $idFuente, 'id_proyecto' => $proyecto['id'],
                                'proyecto_alias' => $proyecto['nombre'], 'causa_raiz' => self::elegir(Texto::CAUSAS),
                                'analisis_causal' => '[]', 'general' => json_encode(['fecha' => $fecha->toDateString()]),
                                'probabilidad' => mt_rand(1, 5), 'consecuencia' => mt_rand(1, 5),
                                'id_causa_raiz' => $base['causas_raiz'] ? self::elegir($base['causas_raiz']) : null,
                                'payload' => '{"origen":"datos_prueba"}',
                            ];
                        }
                    } else {
                        $accidente = mt_rand(1, 100) <= 35;
                        $id = ++$numero;
                        $fila = $this->filaEvento($id, $idTipo($accidente ? 'Accidente' : 'Incidente'), $proyecto, $semana, $base, $lote, $hoy, $pesosArea,
                            Texto::INCIDENTES, $accidente ? ['Media' => 45, 'Alta' => 40, 'Crítica' => 15] : ['Baja' => 30, 'Media' => 50, 'Alta' => 20]);
                        $codigo = $accidente
                            ? $this->ponderado([['STP', 70], ['CTP', 15], ['AT', 15]])
                            : $this->ponderado([['DMNS', 55], ['DMS', 10], ['FO', 20], ['CUASI', 15]]);
                        $fila['evento']['id_clasificacion_incidente'] = $base['clasificaciones'][$codigo] ?? null;
                        // Más incidentes hacia el final del turno, como efecto simulado de la fatiga.
                        $fila['evento']['dia_ciclo'] = max(mt_rand(1, 14), mt_rand(1, 14));
                        $eventos[] = $fila['evento'];
                        $participantes[] = ['id_evento' => $id, 'id_trabajador' => $fila['evento']['id_trabajador'], 'rol' => 'afectado'];
                        foreach ($fila['testigos'] as $testigo) {
                            $participantes[] = ['id_evento' => $id, 'id_trabajador' => $testigo, 'rol' => 'testigo'];
                        }
                        if ($accidente && $partes && $lesionesCat) {
                            $conTiempo = mt_rand(1, 100) <= 25;
                            $lesiones[] = [
                                'id_evento' => $id, 'id_trabajador' => $fila['evento']['id_trabajador'],
                                'id_parte_cuerpo' => self::elegir($partes), 'id_tipo_lesion' => self::elegir($lesionesCat),
                                'con_tiempo_perdido' => $conTiempo, 'dias_perdidos' => $conTiempo ? mt_rand(1, 30) : 0,
                                'atencion_mutualidad' => true, 'fatal' => false,
                            ];
                        }
                        $cierre = $fila['evento']['fecha_cierre'];
                        $medidas[] = [
                            'id_evento' => $id, 'tipo' => self::elegir(['correctiva', 'preventiva']), 'descripcion' => self::elegir(Texto::MEDIDAS),
                            'id_responsable' => $fila['evento']['id_supervisor'],
                            'fecha_compromiso' => substr($fila['evento']['fecha_ocurrencia'], 0, 10),
                            'fecha_cierre' => $cierre ? substr($cierre, 0, 10) : null, 'estado' => $cierre ? 'cerrada' : 'abierta',
                            'eficaz' => $cierre ? mt_rand(1, 100) <= 85 : null,
                        ];
                    }
                }
                $intensidadPrevia = $intensidad;
            }
        }

        $ids = $this->reservarIds('eventos', 'id_evento', count($eventos));
        $traducir = fn (array $filas) => array_map(fn ($f) => ['id_evento' => $ids[$f['id_evento']]] + $f, $filas);
        foreach ($eventos as $i => $evento) {
            $eventos[$i]['id_evento'] = $ids[$evento['id_evento']];
        }
        $this->insertar('eventos', $eventos);
        $this->insertar('evento_trabajador', array_values(collect($traducir($participantes))
            ->unique(fn ($p) => $p['id_evento'].'-'.$p['id_trabajador'])->all()));
        $this->insertar('situacion_criticas', $traducir($criticas));
        $this->insertar('evento_lesion', $traducir($lesiones));
        $this->insertar('medidas_correctivas', $traducir($medidas));
        $this->insertar('reportes_previene_intrava', $previene);
        $this->insertar('reportes_flash_intrava', $flash);
        $this->insertar('informes_investigacion_intrava', $informes);
        $this->insertar('hallazgos_intrava', $hallazgos);
    }

    private function filaEvento(int $id, int $tipo, array $proyecto, CarbonImmutable $semana, array $base, string $lote, CarbonImmutable $hoy, array $pesosArea, array $textos, array $severidades): array
    {
        $cuadrilla = $proyecto['cuadrillas'][array_rand($proyecto['cuadrillas'])];
        $indice = $this->indicePonderado($cuadrilla['propension']);
        $fecha = $this->fechaEnSemana($semana, $proyecto['hasta']);
        $actividad = collect($cuadrilla['actividades'])->first(fn ($a) => $a['desde']->lte($fecha) && $a['hasta']->gte($fecha));
        $cierre = $this->fechaCierre($fecha, $hoy);
        $noche = $fecha->hour >= 20 || $fecha->hour < 6;
        $turno = $base['turnos'][$noche ? 'Noche' : 'Día'] ?? null;
        $severidad = $this->ponderado(array_map(null, array_keys($severidades), array_values($severidades)));
        $nivel = ['Leve' => 1, 'Baja' => 2, 'Media' => 3, 'Alta' => 4, 'Crítica' => 5][$severidad];

        return [
            'evento' => [
                'id_evento' => $id, 'id_tipo_evento' => $tipo,
                'id_administrador' => $cierre ? $base['administrador'] : null,
                'id_area' => $proyecto['areas'][$this->indicePonderado($pesosArea)],
                'id_proyecto' => $proyecto['id'],
                'id_actividad' => $actividad['id'] ?? null,
                'id_trabajador' => $cuadrilla['miembros'][$indice],
                'id_supervisor' => $cuadrilla['supervisor'],
                'id_turno' => $turno,
                'descripcion' => self::elegir($textos),
                'condicion' => mt_rand(1, 10),
                'referencia' => sprintf('%s-%06d', $lote, $id),
                'estado' => $cierre ? 'cerrado' : (mt_rand(1, 100) <= 30 ? 'en_revision' : 'abierto'),
                'severidad' => $severidad,
                'id_potencial_severidad' => $base['severidades'][min(5, $nivel + mt_rand(0, 2))] ?? null,
                'id_categoria_evento' => $base['categorias'] ? self::elegir($base['categorias']) : null,
                'id_causa_inmediata' => $cierre && $base['causas_inmediatas'] ? self::elegir($base['causas_inmediatas']) : null,
                'id_causa_basica' => $cierre && $base['causas_basicas'] ? self::elegir($base['causas_basicas']) : null,
                'id_clasificacion_incidente' => null,
                'tipo_detencion' => null,
                'fecha_detencion' => null,
                'fecha_reinicio' => null,
                'id_autoriza_reinicio' => null,
                'dia_ciclo' => mt_rand(1, 14),
                'fecha_ocurrencia' => $fecha->toDateTimeString(),
                'fecha_creacion' => $fecha->addHours(mt_rand(0, 6))->toDateTimeString(),
                'fecha_actualizacion' => ($cierre ?? $fecha)->toDateTimeString(),
                'fecha_cierre' => $cierre?->toDateTimeString(),
                'justificacion' => $cierre ? self::elegir(Texto::MEDIDAS) : null,
            ],
            'testigos' => collect($cuadrilla['miembros'])->reject(fn ($m) => $m === $cuadrilla['miembros'][$indice])->shuffle()->take(mt_rand(0, 2))->all(),
        ];
    }

    private function filaPreviene(int $id, array $proyecto, CarbonImmutable $fecha, CarbonImmutable $hoy, array $pesosArea): array
    {
        $cierre = $this->fechaCierre($fecha, $hoy);
        $area = $proyecto['areas'][$this->indicePonderado($pesosArea)];

        return [
            'id_intrava' => $id, 'id_proyecto' => $proyecto['id'], 'proyecto_alias' => $proyecto['nombre'], 'identificador' => $id,
            'fecha' => $fecha->toDateString(), 'hora' => $fecha->format('H:i'), 'id_area' => $area,
            'descripcion' => self::elegir(Texto::CONDICIONES), 'acciones_inmediatas' => self::elegir(Texto::MEDIDAS),
            'urgencia' => mt_rand(1, 5), 'aviso_jefatura' => self::elegir(['SI', 'NO']), 'estado' => $cierre ? 'cerrado' : 'abierto',
            'evidencias_creacion' => mt_rand(0, 2), 'cierre_comentario' => $cierre ? 'Condición corregida.' : null,
            'cierre_fecha' => $cierre?->toDateString(), 'payload' => '{"origen":"datos_prueba"}',
        ];
    }

    private function filaFlash(int $id, array $proyecto, CarbonImmutable $fecha, array $pesosArea, array $base): array
    {
        $clasificacion = self::elegir([['Daño material', 'DMNS'], ['Lesión sin tiempo perdido', 'STP'], ['Falla operacional', 'FO'], ['Cuasi accidente', 'CUASI']]);

        return [
            'id_clasificacion_incidente' => $base['clasificaciones'][$clasificacion[1]] ?? null,
            'id_intrava' => $id, 'id_proyecto' => $proyecto['id'], 'proyecto_alias' => $proyecto['nombre'],
            'id_area' => $proyecto['areas'][$this->indicePonderado($pesosArea)], 'fecha' => $fecha->toDateString(),
            'hora' => $fecha->format('H:i'), 'turno' => $fecha->hour >= 20 || $fecha->hour < 6 ? 'Noche' : 'Día',
            'clasificacion' => $clasificacion[0],
            'descripcion' => self::elegir(Texto::INCIDENTES), 'reportado_por' => 'Supervisor de turno', 'cargo' => 'Supervisor',
            'payload' => '{"origen":"datos_prueba"}',
        ];
    }

    private function filaHallazgo(array $proyecto, CarbonImmutable $fecha, CarbonImmutable $hoy): array
    {
        $cierre = $this->fechaCierre($fecha, $hoy);

        return [
            'id_intrava' => (string) Str::uuid(), 'id_proyecto' => $proyecto['id'],
            'id_area' => self::elegir($proyecto['areas']),
            'tipo' => self::elegir(['Condición subestándar', 'Acción subestándar', 'No conformidad de seguridad', 'Oportunidad de mejora']),
            'origen' => self::elegir(['Inspección planificada', 'Auditoría', 'Reportabilidad cliente']),
            'requisito_incumplido' => self::elegir(Texto::CONDICIONES), 'fecha_creacion' => $fecha->toDateString(),
            'fecha_deteccion' => $fecha->toDateString(), 'fecha_cierre' => $cierre?->toDateString(),
            'estado' => $cierre ? 'cerrado' : 'abierto', 'prioridad' => mt_rand(1, 100) / 10, 'payload' => '{"origen":"datos_prueba"}',
        ];
    }

    /** Lo antiguo casi siempre está cerrado; lo reciente, a menudo sigue pendiente. */
    private function fechaCierre(CarbonImmutable $fecha, CarbonImmutable $hoy): ?CarbonImmutable
    {
        $probabilidad = $fecha->lt($hoy->subWeeks(8)) ? 96 : 35;
        if (mt_rand(1, 100) > $probabilidad) {
            return null;
        }
        $cierre = $fecha->addDays(mt_rand(1, 30));

        return $cierre->gt($hoy) ? null : $cierre;
    }

    private function crearExposicion(array $base): void
    {
        $horas = $avance = $clima = $asistencia = [];
        $turno = $base['turnos']->first();
        $faenas = [];
        foreach ($base['proyectos'] as $proyecto) {
            $semanas = max(1, (int) $proyecto['desde']->diffInWeeks($proyecto['hasta']));
            $atraso = 0;
            foreach (range(0, $semanas) as $n) {
                $fecha = $proyecto['desde']->startOfWeek()->addWeeks($n);
                $plan = round(min(100, 100 * $n / $semanas), 2);
                $atraso = max(0, $atraso + mt_rand(-1, 1));
                $avance[] = [
                    'id_proyecto' => $proyecto['id'], 'semana' => $fecha->toDateString(), 'avance_planificado_pct' => $plan,
                    'avance_fisico_pct' => round(max(0, $plan - mt_rand(0, 6)), 2), 'dias_atraso' => $atraso,
                ];
                foreach ($proyecto['cuadrillas'] as $cuadrilla) {
                    $personas = count($cuadrilla['miembros']);
                    $horas[] = [
                        'id_proyecto' => $proyecto['id'], 'id_cuadrilla' => $cuadrilla['id'], 'fecha' => $fecha->toDateString(),
                        'n_trabajadores' => $personas, 'horas_normales' => $personas * 45, 'horas_extra' => mt_rand(0, $personas * 6), 'fuente' => 'datos_prueba',
                    ];
                    if ($n % 2 === 0) {
                        foreach ($cuadrilla['miembros'] as $trabajador) {
                            $ausente = mt_rand(1, 100) <= 5;
                            $asistencia[] = [
                                'id_trabajador' => $trabajador, 'id_proyecto' => $proyecto['id'], 'fecha' => $fecha->toDateString(), 'id_turno' => $turno,
                                'horas_normales' => $ausente ? 0 : 9, 'horas_extra' => $ausente ? 0 : mt_rand(0, 2), 'ausente' => $ausente,
                                'tipo_ausencia' => $ausente ? self::elegir(['falta', 'permiso', 'licencia']) : null,
                            ];
                        }
                    }
                }
                $clave = $proyecto['faena'].'-'.$fecha->toDateString();
                if (! isset($faenas[$clave])) {
                    $faenas[$clave] = true;
                    $clima[] = [
                        'id_faena' => $proyecto['faena'], 'fecha' => $fecha->toDateString(), 'temp_max' => mt_rand(12, 32), 'temp_min' => mt_rand(-8, 10),
                        'viento_max_kmh' => mt_rand(5, 90), 'precipitacion_mm' => mt_rand(1, 100) <= 5 ? mt_rand(1, 15) : 0, 'fuente' => 'datos_prueba',
                    ];
                }
            }
        }
        $this->insertar('horas_hombre', $horas);
        $this->insertar('proyecto_avance_semanal', $avance);
        $this->insertar('clima_diario', $clima);
        $this->insertar('asistencia_diaria', $asistencia);
    }

    private function insertar(string $tabla, array $filas): void
    {
        if ($filas === [] || ! Schema::hasTable($tabla)) {
            return;
        }
        $columnas = array_flip(Schema::getColumnListing($tabla));
        foreach (array_chunk($filas, self::TAMANO_LOTE) as $lote) {
            DB::table($tabla)->insert(array_map(fn ($fila) => array_intersect_key($fila, $columnas), $lote));
        }
    }

    /** @return array<int,int> Identificador provisional => identificador definitivo */
    private function reservarIds(string $tabla, string $columna, int $cantidad): array
    {
        if ($cantidad === 0) {
            return [];
        }
        $filas = DB::select(
            'SELECT nextval(pg_get_serial_sequence(?, ?)) AS id FROM generate_series(1, ?)',
            ["public.{$tabla}", $columna, $cantidad]
        );

        return array_combine(range(1, $cantidad), array_map(fn ($f) => (int) $f->id, $filas));
    }

    private function catalogo(string $tabla, string $columna): array
    {
        return Schema::hasTable($tabla) ? DB::table($tabla)->pluck($columna)->all() : [];
    }

    private function fechaEnSemana(CarbonImmutable $semana, CarbonImmutable $tope): CarbonImmutable
    {
        // Mayormente de día, con una parte en turno noche.
        $hora = mt_rand(1, 100) <= 18 ? self::elegir([20, 21, 22, 23, 0, 1, 2, 3, 4, 5]) : mt_rand(7, 19);
        $fecha = $semana->addDays(mt_rand(0, 6))->setTime($hora, mt_rand(0, 59));

        return $fecha->gt($tope) ? $tope->setTime(min($hora, 19), 0)->min(CarbonImmutable::now()) : $fecha;
    }

    private static function elegir(array $opciones): mixed
    {
        return $opciones[array_rand($opciones)];
    }

    private function poisson(float $media): int
    {
        $limite = exp(-min($media, 30));
        $k = 0;
        $producto = 1.0;
        do {
            $k++;
            $producto *= mt_rand() / mt_getrandmax();
        } while ($producto > $limite);

        return $k - 1;
    }

    private function normal(float $desviacion): float
    {
        $u = max(mt_rand() / mt_getrandmax(), 1e-9);

        return sqrt(-2 * log($u)) * cos(2 * M_PI * mt_rand() / mt_getrandmax()) * $desviacion;
    }

    private function ponderado(array $opciones): string
    {
        return $opciones[$this->indicePonderado(array_column($opciones, 1))][0];
    }

    private function indicePonderado(array $pesos): int
    {
        $punto = mt_rand() / mt_getrandmax() * array_sum($pesos);
        foreach ($pesos as $indice => $peso) {
            $punto -= $peso;
            if ($punto <= 0) {
                return $indice;
            }
        }

        return array_key_last($pesos);
    }
}
