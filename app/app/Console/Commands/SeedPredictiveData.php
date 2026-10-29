<?php

namespace App\Console\Commands;

use App\Models\Actividad;
use App\Models\Administrativo;
use App\Models\Area;
use App\Models\Asignacion;
use App\Models\Cliente;
use App\Models\Cuadrilla;
use App\Models\Faena;
use App\Models\Obrero;
use App\Models\Proyecto;
use App\Models\Supervisor;
use App\Models\TipoEvento;
use App\Models\Trabajador;
use App\Models\tipo_obrero;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SeedPredictiveData extends Command
{
    protected $signature = 'model:seed-predictive
        {--projects=60 : Número de proyectos sintéticos}
        {--workers=360 : Número de trabajadores de terreno}
        {--squads=40 : Número de cuadrillas}
        {--events=1800 : Número de eventos históricos}
        {--months=60 : Meses de historial a generar}
        {--seed=20261029 : Semilla para repetir la distribución}
        {--tag= : Prefijo único para reconocer este lote}';

    protected $description = 'Genera un lote grande y reproducible de datos sintéticos para el modelo predictivo.';

    public function handle(): int
    {
        $environment = $_SERVER['APP_ENV'] ?? $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?? config('app.env');
        $environment = $environment ?: config('app.env');
        if ($environment === 'production') {
            $this->error('Este comando solo se puede ejecutar fuera de producción.');

            return self::FAILURE;
        }

        $projectsCount = max(1, (int) $this->option('projects'));
        $workersCount = max(1, (int) $this->option('workers'));
        $squadsCount = min($workersCount, max(1, (int) $this->option('squads')));
        $eventsCount = max(1, (int) $this->option('events'));
        $months = min(120, max(12, (int) $this->option('months')));
        $seed = (int) $this->option('seed');
        $tag = $this->option('tag') ?: 'SINTETICO-'.now()->format('Ymd-His');

        if (Proyecto::query()->where('nombre', 'like', $tag.'-%')->exists()) {
            $this->error("Ya hay datos del lote [{$tag}]. Usa otro --tag para crear un lote adicional.");

            return self::FAILURE;
        }

        return DB::transaction(function () use (
            $projectsCount, $workersCount, $squadsCount, $eventsCount,
            $months, $seed, $tag
        ): int {
        mt_srand($seed);
        fake()->seed($seed);
        $tipoObrero = tipo_obrero::query()->first()
            ?? tipo_obrero::query()->create([
                'nombre' => 'General',
                'descripcion' => 'Tipo sintético para los datos predictivos.',
                'estado' => 'activo',
            ]);
        $tiposEvento = TipoEvento::query()->pluck('id_tipo_evento')->all();
        if ($tiposEvento === []) {
            $tiposEvento[] = TipoEvento::query()->create(['nombre' => 'Evento de seguridad'])->id_tipo_evento;
        }
        $administrador = Administrativo::query()->first();
        if (! $administrador) {
            $adminTrabajador = Trabajador::factory()->create(['cargo' => 'Administrador sintético']);
            $administrador = Administrativo::query()->create(['id_trabajador' => $adminTrabajador->id_trabajador]);
        }

        $areasCount = max(3, (int) ceil($projectsCount / 2));
        $clientes = collect(range(1, max(3, (int) ceil($projectsCount / 4))))
            ->map(fn () => Cliente::factory()->create());
        $faenas = collect(range(1, max(3, (int) ceil($projectsCount / 3))))
            ->map(fn () => Faena::factory()->create());
        $areasPorFaena = [];
        foreach ($faenas as $faena) {
            $areasPorFaena[$faena->id_faena] = collect(range(1, max(2, (int) ceil($areasCount / $faenas->count()))))
                ->map(fn () => Area::factory()->create(['id_faena' => $faena->id_faena]));
        }

        $tipoTrabajadores = collect();
        for ($index = 0; $index < $squadsCount; $index++) {
            $supervisorTrabajador = Trabajador::factory()->create(['cargo' => 'Supervisor de terreno']);
            $supervisor = Supervisor::query()->create(['id_trabajador' => $supervisorTrabajador->id_trabajador]);
            $tipoTrabajadores->push(Cuadrilla::factory()->create([
                'id_supervisor' => $supervisor->id_trabajador,
                'numero_cuadrilla' => $tag.'-C'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
            ]));
        }

        $trabajadoresPorCuadrilla = [];
        foreach ($tipoTrabajadores as $cuadrilla) {
            $trabajadoresPorCuadrilla[$cuadrilla->id_cuadrilla] = collect();
        }
        for ($index = 0; $index < $workersCount; $index++) {
            $trabajador = Trabajador::factory()->create([
                'cargo' => fake()->randomElement(['Operador', 'Mecánico', 'Electricista', 'Soldador', 'Rigger', 'Ayudante']),
            ]);
            $cuadrillaIndex = $index % $squadsCount;
            Obrero::query()->create([
                'id_trabajador' => $trabajador->id_trabajador,
                'id_tipo_obrero' => $tipoObrero->id_tipo_obrero,
                'id_cuadrilla' => $tipoTrabajadores[$cuadrillaIndex]->id_cuadrilla,
            ]);
            $trabajadoresPorCuadrilla[$tipoTrabajadores[$cuadrillaIndex]->id_cuadrilla]->push($trabajador);
        }

        $fechaInicio = CarbonImmutable::now()->startOfDay()->subMonths($months);
        $proyectos = collect();
        $actividadesPorProyecto = [];
        $cuadrillasPorProyecto = [];
        for ($index = 0; $index < $projectsCount; $index++) {
            $faena = $faenas[$index % $faenas->count()];
            $proyecto = Proyecto::factory()->create([
                'id_faena' => $faena->id_faena,
                'id_cliente' => $clientes[$index % $clientes->count()]->id_cliente,
                'nombre' => $tag.'-Proyecto-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                'fecha_inicio' => $fechaInicio->toDateString(),
                'fecha_termino' => null,
                'estado' => 'activo',
            ]);
            $proyectos->push($proyecto);

            $primeraCuadrilla = $index % $squadsCount;
            $cantidadCuadrillasProyecto = $squadsCount === 1
                ? 1
                : mt_rand(2, min(4, $squadsCount));
            $indices = collect(range(0, $cantidadCuadrillasProyecto - 1))
                ->map(fn ($offset) => ($primeraCuadrilla + $offset) % $squadsCount);
            $cuadrillasPorProyecto[$proyecto->id_proyecto] = collect();
            $actividadesPorProyecto[$proyecto->id_proyecto] = collect();

            foreach ($indices as $cuadrillaIndex) {
                $cuadrilla = $tipoTrabajadores[$cuadrillaIndex];
                $cuadrillasPorProyecto[$proyecto->id_proyecto]->push($cuadrilla);
                $asignacion = Asignacion::factory()->create([
                    'id_administrador' => $administrador->id_trabajador,
                    'id_proyecto' => $proyecto->id_proyecto,
                    'id_cuadrilla' => $cuadrilla->id_cuadrilla,
                    'fecha_inicio' => $fechaInicio->toDateString(),
                    'fecha_termino' => null,
                ]);
                for ($activityIndex = 1; $activityIndex <= 3; $activityIndex++) {
                    $actividad = Actividad::factory()->create([
                        'id_asignacion' => $asignacion->id_asignacion,
                        'nombre' => $tag.'-Actividad-'.($index + 1).'-'.$cuadrillaIndex.'-'.$activityIndex,
                        'fecha_inicio' => $fechaInicio->addMonths(($activityIndex - 1) * 3)->toDateString(),
                        'fecha_termino' => $activityIndex === 3 ? null : $fechaInicio->addMonths($activityIndex * 3)->toDateString(),
                        'estado' => $activityIndex === 3 ? 'en_progreso' : 'completada',
                    ]);
                    $actividadesPorProyecto[$proyecto->id_proyecto]->push($actividad);
                }
            }
        }

        $eventColumns = Schema::getColumnListing('eventos');
        $eventColumnSet = array_fill_keys($eventColumns, true);
        $hasEventWorkers = Schema::hasTable('evento_trabajador');
        $hasEventWorkerRole = $hasEventWorkers && Schema::hasColumn('evento_trabajador', 'rol');
        $areasPorFaena = collect($areasPorFaena);
        $insertados = 0;
        DB::transaction(function () use (
            $eventsCount, $proyectos, $cuadrillasPorProyecto, $trabajadoresPorCuadrilla,
            $actividadesPorProyecto, $areasPorFaena, $faenas, $tiposEvento,
            $administrador, $fechaInicio, $months, $tag, $eventColumnSet,
            $hasEventWorkers, $hasEventWorkerRole, &$insertados
        ): void {
            for ($index = 1; $index <= $eventsCount; $index++) {
                $proyecto = $proyectos[mt_rand(0, $proyectos->count() - 1)];
                $cuadrillas = $cuadrillasPorProyecto[$proyecto->id_proyecto];
                $cuadrilla = $cuadrillas[mt_rand(0, $cuadrillas->count() - 1)];
                $crew = $trabajadoresPorCuadrilla[$cuadrilla->id_cuadrilla];
                $trabajador = $crew[mt_rand(0, $crew->count() - 1)];
                $date = $fechaInicio->addDays(mt_rand(0, max(0, $months * 30 - 1)));
                $severity = fake()->randomElement(['Baja', 'Media', 'Alta', 'Grave']);
                $areaOptions = $areasPorFaena[$proyecto->id_faena] ?? collect();
                $area = $areaOptions->isNotEmpty() ? $areaOptions[mt_rand(0, $areaOptions->count() - 1)] : null;
                $actividadOptions = $actividadesPorProyecto[$proyecto->id_proyecto];
                $activityDate = $date->toDateString();
                $actividadOptions = $actividadOptions->filter(
                    fn (Actividad $item) => $item->fecha_inicio->toDateString() <= $activityDate
                        && (! $item->fecha_termino || $item->fecha_termino->toDateString() >= $activityDate)
                )->values();
                if ($actividadOptions->isEmpty()) {
                    $actividadOptions = $actividadesPorProyecto[$proyecto->id_proyecto];
                }
                $actividad = $actividadOptions[mt_rand(0, $actividadOptions->count() - 1)];
                $event = [
                    'id_tipo_evento' => $tiposEvento[mt_rand(0, count($tiposEvento) - 1)],
                    'id_administrador' => $administrador->id_trabajador,
                    'id_trabajador' => $trabajador->id_trabajador,
                    'id_supervisor' => $cuadrilla->id_supervisor,
                    'id_area' => $area?->id_area,
                    'id_proyecto' => $proyecto->id_proyecto,
                    'id_actividad' => $actividad->id_actividad,
                    'descripcion' => fake()->sentence(12),
                    'condicion' => mt_rand(1, 10),
                    'referencia' => $tag.'-EVT-'.str_pad((string) $index, 7, '0', STR_PAD_LEFT),
                    'estado' => $index % 4 === 0 ? 'cerrado' : 'abierto',
                    'severidad' => $severity,
                    'fecha_creacion' => $date->addHours(mt_rand(6, 18))->toDateTimeString(),
                    'fecha_actualizacion' => $date->addHours(mt_rand(6, 20))->toDateTimeString(),
                    'fecha_cierre' => $index % 4 === 0 ? $date->addDays(mt_rand(1, 5))->toDateTimeString() : null,
                    'justificacion' => $index % 4 === 0 ? 'Registro sintético cerrado para entrenamiento.' : null,
                    'fecha_ocurrencia' => $date->toDateTimeString(),
                ];
                $event = array_intersect_key($event, $eventColumnSet);
                $eventId = DB::table('eventos')->insertGetId($event, 'id_evento');
                $insertados++;

                if ($hasEventWorkers) {
                    $participantes = $crew->shuffle()->take(min(3, $crew->count()));
                    foreach ($participantes as $participante) {
                        $row = ['id_evento' => $eventId, 'id_trabajador' => $participante->id_trabajador];
                        if ($hasEventWorkerRole) {
                            $row['rol'] = $participante->id_trabajador === $trabajador->id_trabajador ? 'afectado' : 'involucrado';
                        }
                        DB::table('evento_trabajador')->insertOrIgnore($row);
                    }
                }
            }
        });

        $this->generarExposiciones($proyectos, $cuadrillasPorProyecto, $trabajadoresPorCuadrilla, $fechaInicio, $months);

        $this->info("Lote {$tag} creado: {$projectsCount} proyectos, {$workersCount} trabajadores, {$squadsCount} cuadrillas y {$insertados} eventos.");
        $this->line('El lote está marcado con el prefijo en nombres y referencias para localizarlo sin afectar registros existentes.');
        $this->line('Si las vistas predictivas aún no existen, ejecuta los scripts SQL de python/database antes de solicitar predicciones.');

        return self::SUCCESS;
        });
    }

    private function generarExposiciones($proyectos, $cuadrillasPorProyecto, $trabajadoresPorCuadrilla, CarbonImmutable $inicio, int $months): void
    {
        $tablas = ['horas_hombre', 'proyecto_avance_semanal', 'asistencia_diaria', 'clima_diario'];
        $presentes = array_fill_keys(array_filter($tablas, fn ($tabla) => Schema::hasTable($tabla)), true);
        if ($presentes === []) {
            return;
        }

        $turnoId = Schema::hasTable('cat_turno') ? DB::table('cat_turno')->value('id_turno') : null;
        $lotes = array_fill_keys(array_keys($presentes), []);
        $pasos = (int) floor($months * 30.4375 / 7);
        foreach ($proyectos as $proyecto) {
            for ($week = 0; $week <= $pasos; $week++) {
                $date = $inicio->addWeeks($week)->toDateString();
                if (isset($presentes['proyecto_avance_semanal'])) {
                    $avance = min(100, max(0, round(($week / max(1, $pasos)) * 100 + mt_rand(-3, 3), 2)));
                    $avancePlanificado = min(100, max(0, round($avance + mt_rand(-8, 8), 2)));
                    $lotes['proyecto_avance_semanal'][] = [
                        'id_proyecto' => $proyecto->id_proyecto, 'semana' => $date,
                        'avance_fisico_pct' => $avance,
                        'avance_planificado_pct' => $avancePlanificado,
                        'dias_atraso' => mt_rand(0, 12),
                    ];
                }
                foreach ($cuadrillasPorProyecto[$proyecto->id_proyecto] as $cuadrilla) {
                    if (isset($presentes['horas_hombre'])) {
                        $lotes['horas_hombre'][] = [
                            'id_proyecto' => $proyecto->id_proyecto,
                            'id_cuadrilla' => $cuadrilla->id_cuadrilla,
                            'fecha' => $date,
                            'n_trabajadores' => $trabajadoresPorCuadrilla[$cuadrilla->id_cuadrilla]->count(),
                            'horas_normales' => mt_rand(40, 240), 'horas_extra' => mt_rand(0, 36),
                        ];
                    }
                }
                foreach (array_keys($lotes) as $table) {
                    if (count($lotes[$table]) >= 500) {
                        DB::table($table)->insert($lotes[$table]);
                        $lotes[$table] = [];
                    }
                }
            }
        }
        if (isset($presentes['clima_diario'])) {
            foreach ($proyectos->pluck('id_faena')->unique() as $faenaId) {
                for ($week = 0; $week <= $pasos; $week++) {
                    $lotes['clima_diario'][] = [
                        'id_faena' => $faenaId, 'fecha' => $inicio->addWeeks($week)->toDateString(),
                        'temp_max' => mt_rand(5, 34), 'temp_min' => mt_rand(-8, 15),
                        'viento_max_kmh' => mt_rand(0, 110), 'precipitacion_mm' => mt_rand(0, 25),
                    ];
                    if (count($lotes['clima_diario']) >= 500) {
                        DB::table('clima_diario')->insert($lotes['clima_diario']);
                        $lotes['clima_diario'] = [];
                    }
                }
            }
        }
        foreach ($proyectos as $proyecto) {
            if (! isset($presentes['asistencia_diaria'])) {
                break;
            }
            $squads = $cuadrillasPorProyecto[$proyecto->id_proyecto];
            foreach ($squads as $cuadrilla) {
                foreach ($trabajadoresPorCuadrilla[$cuadrilla->id_cuadrilla] as $trabajador) {
                    for ($week = 0; $week <= $pasos; $week += 2) {
                        $lotes['asistencia_diaria'][] = [
                            'id_trabajador' => $trabajador->id_trabajador,
                            'id_proyecto' => $proyecto->id_proyecto,
                            'fecha' => $inicio->addWeeks($week)->toDateString(),
                            'id_turno' => $turnoId,
                            'horas_normales' => mt_rand(0, 1) ? 8 : 10,
                            'horas_extra' => mt_rand(0, 4),
                            'ausente' => mt_rand(1, 100) <= 5,
                            'tipo_ausencia' => null,
                        ];
                        if (count($lotes['asistencia_diaria']) >= 500) {
                            DB::table('asistencia_diaria')->insert($lotes['asistencia_diaria']);
                            $lotes['asistencia_diaria'] = [];
                        }
                    }
                }
            }
        }
        foreach ($lotes as $table => $rows) {
            if ($rows !== []) {
                DB::table($table)->insert($rows);
            }
        }
    }
}
