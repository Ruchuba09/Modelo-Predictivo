<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Estadísticas de eventos.
 *
 * GET /api/eventos/estadisticas                 -> todas las secciones
 * GET /api/eventos/estadisticas?secciones=resumen,tiempos
 * GET /api/eventos/estadisticas/{seccion}       -> una sola sección
 *
 * Filtros (todos opcionales): desde, hasta, id_area, id_proyecto, id_tipo_evento,
 * id_supervisor, id_administrador, id_trabajador, estado, severidad, sla_dias.
 *
 * Los cálculos se hacen con Collections (portable entre MySQL/PostgreSQL).
 * Si la tabla crece a cientos de miles de filas, conviene mover los
 * agrupados pesados a SQL o cachearlos (ver Cache::remember en responder()).
 */
class EventoEstadisticaController extends Controller
{
    private const DIAS_SEMANA = [
        1 => 'Lunes', 2 => 'Martes', 3 => 'Miércoles', 4 => 'Jueves',
        5 => 'Viernes', 6 => 'Sábado', 7 => 'Domingo',
    ];

    /** Rangos (en días) para el tiempo de cierre. */
    private const CORTES_CIERRE = [
        [1, '< 1 día'], [3, '1 a 3 días'], [7, '3 a 7 días'], [14, '7 a 14 días'],
        [30, '14 a 30 días'], [90, '30 a 90 días'], [INF, '> 90 días'],
    ];

    /** Rangos (en días) para la antigüedad de eventos pendientes. */
    private const CORTES_EDAD = [
        [8, '0 a 7 días'], [31, '8 a 30 días'], [91, '31 a 90 días'],
        [181, '91 a 180 días'], [INF, '> 180 días'],
    ];

    /** Categorías inferidas por palabra clave en la descripción (gana la primera que coincida). */
    private const CATEGORIAS = [
        'Eléctrico'                => ['electric', 'cable'],
        'EPP / protección'         => ['proteccion', 'protección'],
        'Trabajo en altura'        => ['altura'],
        'Orden, limpieza y derrames' => ['orden y limpieza', 'derrame'],
        'Señalización y circulación' => ['señalizacion', 'señalización', 'via de circulacion', 'vía de circulación'],
        'Herramientas'             => ['herramienta'],
        'Mantenimiento e inspección' => ['inspeccion', 'inspección', 'mantenimiento'],
        'Falla mecánica'           => ['desprendimiento'],
        'Almacenamiento'           => ['material almacenado'],
    ];

    private const UMBRAL_ESTANCADO_DIAS = 30;

    private Carbon $ahora;
    private int $sla = 7;
    private Collection $eventos;
    private Collection $filas;                  // evento x trabajador (tabla pivote)
    private Collection $trabajadoresPorEvento;  // id_evento => [id_trabajador, ...]

    /* ===================================================================
     |  ENDPOINTS
     * =================================================================== */

    public function index(Request $request): JsonResponse
    {
        $this->preparar($request);
        $mapa = $this->mapaSecciones();

        $pedidas = array_keys($mapa);
        if ($request->filled('secciones')) {
            $pedidas = array_values(array_intersect(
                array_map('trim', explode(',', (string) $request->input('secciones'))),
                array_keys($mapa)
            ));
        }

        return $this->responder($request, $pedidas, $mapa);
    }

    public function seccion(Request $request, string $seccion): JsonResponse
    {
        $this->preparar($request);
        $mapa = $this->mapaSecciones();
        abort_unless(isset($mapa[$seccion]), 404, 'La sección no existe.');

        return $this->responder($request, [$seccion], $mapa);
    }

    private function mapaSecciones(): array
    {
        return [
            'resumen'            => fn() => $this->resumen(),
            'distribuciones'     => fn() => $this->distribuciones(),
            'cruces'             => fn() => $this->cruces(),
            'tendencias'         => fn() => $this->tendencias(),
            'tiempos'            => fn() => $this->tiempos(),
            'aging'              => fn() => $this->aging(),
            'trabajadores'       => fn() => $this->trabajadores(),
            'hallazgos'          => fn() => $this->hallazgos(),
            'cierre'             => fn() => $this->cierre(),
            'calidad_datos'      => fn() => $this->calidadDatos(),
            'destacados'         => fn() => $this->destacados(),
            'actividad_reciente' => fn() => $this->actividadReciente(),
        ];
    }

    private function responder(Request $request, array $pedidas, array $mapa): JsonResponse
    {
        $data = [
            'meta' => [
                'generado_en'  => $this->ahora->toIso8601String(),
                'total_eventos' => $this->eventos->count(),
                'filtros'      => $request->only([
                    'desde', 'hasta', 'id_area', 'id_proyecto', 'id_tipo_evento',
                    'id_supervisor', 'id_administrador', 'id_trabajador', 'estado', 'severidad',
                ]),
                'sla_dias'     => $this->sla,
                'secciones_disponibles' => array_keys($mapa),
            ],
        ];

        if ($this->eventos->isEmpty()) {
            return response()->json($data + ['mensaje' => 'No hay eventos con los filtros aplicados.']);
        }

        foreach ($pedidas as $nombre) {
            $data[$nombre] = $mapa[$nombre]();
        }

        return response()->json($data);
    }

    /* ===================================================================
     |  CARGA Y NORMALIZACIÓN
     * =================================================================== */

    private function preparar(Request $r): void
    {
        $r->validate([
            'id_evento'        => 'nullable|string',
            'id'               => 'nullable|string',
            'desde'            => 'nullable|date',
            'hasta'            => 'nullable|date',
            'fecha_inicio'     => 'nullable|date',
            'fecha_fin'        => 'nullable|date',
            'id_area'          => 'nullable|integer',
            'id_proyecto'      => 'nullable|integer',
            'id_tipo_evento'   => 'nullable|integer',
            'id_supervisor'    => 'nullable|integer',
            'id_administrador' => 'nullable|integer',
            'id_trabajador'    => 'nullable|integer',
            'estado'           => 'nullable|string',
            'condicion'        => 'nullable|string',
            'severidad'        => 'nullable|string',
            'sla_dias'         => 'nullable|integer|min:1',
            'secciones'        => 'nullable|string',
        ]);

        $this->ahora = now();
        $this->sla = (int) $r->input('sla_dias', 7);

        $q = DB::table('eventos');

        if ($r->filled('id_evento') || $r->filled('id')) {
            $id = trim((string) ($r->input('id_evento') ?? $r->input('id')));
            $cleanId = preg_replace('/\D/', '', $id);
            if ($cleanId !== '') {
                $q->where('id_evento', (int) $cleanId);
            }
        }

        $desde = $r->input('desde') ?? $r->input('fecha_inicio');
        if ($desde) {
            $q->where('fecha_creacion', '>=', Carbon::parse($desde)->startOfDay());
        }
        $hasta = $r->input('hasta') ?? $r->input('fecha_fin');
        if ($hasta) {
            $q->where('fecha_creacion', '<=', Carbon::parse($hasta)->endOfDay());
        }

        $filtroEstado = strtolower(trim((string) ($r->input('estado') ?? $r->input('condicion'))));
        if ($filtroEstado !== '') {
            if (in_array($filtroEstado, ['abierto', 'abierta'])) {
                $q->whereIn('estado', ['abierto', 'abierta', 'en_revision', 'proceso']);
            } elseif (in_array($filtroEstado, ['cerrado', 'cerrada'])) {
                $q->whereIn('estado', ['cerrado', 'cerrada']);
            } elseif (is_numeric($filtroEstado)) {
                $q->where('condicion', (int) $filtroEstado);
            } else {
                $q->where('estado', $filtroEstado);
            }
        }

        foreach (['id_tipo_evento', 'id_area', 'id_proyecto', 'id_supervisor', 'id_administrador', 'severidad'] as $col) {
            if ($r->filled($col)) {
                $q->where($col, $r->input($col));
            }
        }
        if ($r->filled('id_trabajador')) {
            $q->whereIn('id_evento', DB::table('evento_trabajador')
                ->where('id_trabajador', $r->input('id_trabajador'))
                ->select('id_evento'));
        }

        $this->eventos = $q->get()->map(function ($e) {
            $e->creado      = Carbon::parse($e->fecha_creacion);
            $e->actualizado = Carbon::parse($e->fecha_actualizacion);
            $e->cierre_real = $e->fecha_cierre ? Carbon::parse($e->fecha_cierre) : null;
            $e->cerrado     = in_array(strtolower((string) $e->estado), ['cerrado', 'cerrada']);

            // Fecha de cierre "efectiva": si está cerrado pero no tiene fecha_cierre, usa la última actualización.
            $e->cierre = $e->cerrado ? ($e->cierre_real ?? $e->actualizado) : null;

            // Días reales de resolución (solo si hay fecha_cierre coherente).
            $e->dias_cierre = ($e->cerrado && $e->cierre_real && $e->cierre_real->timestamp >= $e->creado->timestamp)
                ? ($e->cierre_real->timestamp - $e->creado->timestamp) / 86400
                : null;

            $e->edad_dias = $e->cerrado ? null
                : max(0, ($this->ahora->timestamp - $e->creado->timestamp) / 86400);
            $e->dias_sin_actualizar = $e->cerrado ? null
                : max(0, ($this->ahora->timestamp - $e->actualizado->timestamp) / 86400);

            $e->tiene_evidencia        = filled($e->evidencia);
            $e->tiene_evidencia_cierre = filled($e->evidencia_cierre);
            $e->categoria              = $this->categoria($e->descripcion);

            unset($e->evidencia, $e->evidencia_cierre); // liberar memoria
            return $e;
        })->values();

        $ids = $this->eventos->pluck('id_evento');

        $this->trabajadoresPorEvento = $ids->chunk(2000)
            ->flatMap(fn($chunk) => DB::table('evento_trabajador')->whereIn('id_evento', $chunk->all())->get())
            ->groupBy('id_evento')
            ->map(fn($g) => $g->pluck('id_trabajador')->unique()->values());

        $this->filas = $this->eventos->flatMap(function ($e) {
            return ($this->trabajadoresPorEvento[$e->id_evento] ?? collect())->map(function ($t) use ($e) {
                $c = clone $e;
                $c->id_trabajador = $t;
                return $c;
            });
        })->values();
    }

    /* ===================================================================
     |  SECCIÓN: RESUMEN (KPIs)
     * =================================================================== */

    private function resumen(): array
    {
        $ev = $this->eventos;
        $total = $ev->count();
        $cerrados = $ev->where('cerrado', true);
        $pend = $ev->where('cerrado', false);

        $hoy = $this->ahora->copy()->startOfDay();
        $d7  = $this->ahora->copy()->subDays(7);
        $d30 = $this->ahora->copy()->subDays(30);

        $primer = $ev->min(fn($e) => $e->creado->timestamp);
        $ultimo = $ev->max(fn($e) => $e->creado->timestamp);
        $rango  = max(1, (int) ceil(($ultimo - $primer) / 86400) + 1);

        $creados30 = $ev->filter(fn($e) => $e->creado >= $d30)->count();
        $cerrados30 = $ev->filter(fn($e) => $e->cierre && $e->cierre >= $d30)->count();
        $dias = $this->resumenNumerico($ev->pluck('dias_cierre'));

        return [
            'total'        => $total,
            'abiertos'     => $ev->where('estado', 'abierto')->count(),
            'en_revision'  => $ev->where('estado', 'en_revision')->count(),
            'cerrados'     => $cerrados->count(),
            'pendientes'   => $pend->count(),
            'pct_abiertos'    => $this->pct($ev->where('estado', 'abierto')->count(), $total),
            'pct_en_revision' => $this->pct($ev->where('estado', 'en_revision')->count(), $total),
            'tasa_cierre'     => $this->pct($cerrados->count(), $total),

            'con_evidencia'            => $ev->where('tiene_evidencia', true)->count(),
            'pct_con_evidencia'        => $this->pct($ev->where('tiene_evidencia', true)->count(), $total),
            'cerrados_con_evidencia_cierre' => $cerrados->where('tiene_evidencia_cierre', true)->count(),

            'creados_hoy'  => $ev->filter(fn($e) => $e->creado >= $hoy)->count(),
            'creados_7d'   => $ev->filter(fn($e) => $e->creado >= $d7)->count(),
            'creados_30d'  => $creados30,
            'cerrados_7d'  => $ev->filter(fn($e) => $e->cierre && $e->cierre >= $d7)->count(),
            'cerrados_30d' => $cerrados30,
            'balance_30d'  => $creados30 - $cerrados30, // >0: el backlog crece
            'actualizados_7d' => $ev->filter(fn($e) => $e->actualizado >= $d7)->count(),

            'pendientes_sin_actualizar_30d' => $pend->filter(fn($e) => $e->dias_sin_actualizar > self::UMBRAL_ESTANCADO_DIAS)->count(),
            'pendientes_mas_90d'            => $pend->filter(fn($e) => $e->edad_dias > 90)->count(),
            'edad_prom_pendientes_dias'     => $pend->isEmpty() ? null : round($pend->avg('edad_dias'), 1),

            'primer_evento' => Carbon::createFromTimestamp($primer)->toDateTimeString(),
            'ultimo_evento' => Carbon::createFromTimestamp($ultimo)->toDateTimeString(),
            'rango_dias'    => $rango,
            'eventos_por_dia'    => round($total / $rango, 2),
            'eventos_por_semana' => round($total / $rango * 7, 1),
            'eventos_por_mes'    => round($total / $rango * 30.44, 1),

            'dias_cierre_promedio' => $dias['promedio'],
            'dias_cierre_mediana'  => $dias['mediana'],

            'distintos' => [
                'tipos'          => $ev->pluck('id_tipo_evento')->unique()->count(),
                'areas'          => $ev->pluck('id_area')->unique()->count(),
                'proyectos'      => $ev->pluck('id_proyecto')->unique()->count(),
                'supervisores'   => $ev->pluck('id_supervisor')->filter()->unique()->count(),
                'administradores' => $ev->pluck('id_administrador')->unique()->count(),
                'trabajadores'   => $this->filas->pluck('id_trabajador')->unique()->count(),
                'descripciones'  => $ev->pluck('descripcion')->unique()->count(),
            ],
        ];
    }

    /* ===================================================================
     |  SECCIÓN: DISTRIBUCIONES (cada una trae estados, tasa de cierre y tiempos)
     * =================================================================== */

    private function distribuciones(): array
    {
        $k = $this->claves();
        $ev = $this->eventos;

        return [
            'estado'        => $this->agrupar($ev, $k['estado']),
            'tipo'          => $this->agrupar($ev, $k['tipo']),
            'area'          => $this->agrupar($ev, $k['area']),
            'proyecto'      => $this->agrupar($ev, $k['proyecto']),
            'severidad'     => $this->agrupar($ev, $k['severidad']),
            'condicion'     => $this->agrupar($ev, $k['condicion'], 'clave'),
            'supervisor'    => $this->agrupar($ev, $k['supervisor']),
            'administrador' => $this->agrupar($ev, $k['administrador']),
        ];
    }

    /* ===================================================================
     |  SECCIÓN: CRUCES (listas planas {a, b, total}; el front arma la matriz)
     * =================================================================== */

    private function cruces(): array
    {
        $k = $this->claves();
        $out = [];

        $pares = [
            ['tipo', 'estado'], ['area', 'estado'], ['proyecto', 'estado'],
            ['area', 'tipo'], ['area', 'proyecto'], ['severidad', 'estado'],
            ['condicion', 'estado'], ['supervisor', 'estado'],
            ['mes', 'estado'], ['mes', 'tipo'], ['mes', 'area'],
            ['categoria', 'area'], ['categoria', 'estado'], ['categoria', 'mes'],
        ];
        foreach ($pares as [$a, $b]) {
            $out["{$a}_{$b}"] = $this->cruzar($this->eventos, $k[$a], $k[$b]);
        }

        return $out;
    }

    /* ===================================================================
     |  SECCIÓN: TENDENCIAS TEMPORALES
     * =================================================================== */

    private function tendencias(): array
    {
        $ev = $this->eventos;
        $ahora = $this->ahora;

        /* ---- por mes ---- */
        $ini = Carbon::createFromTimestamp($ev->min(fn($e) => $e->creado->timestamp))->startOfMonth();
        $fin = $ahora->copy()->startOfMonth();

        $creadosMes  = $ev->countBy(fn($e) => $e->creado->format('Y-m'));
        $cerradosMes = $ev->filter(fn($e) => $e->cierre)->countBy(fn($e) => $e->cierre->format('Y-m'));
        $cohorte     = $ev->groupBy(fn($e) => $e->creado->format('Y-m'));

        $meses = [];
        $prev = null;
        for ($m = $ini->copy(); $m <= $fin; $m->addMonth()) {
            $k = $m->format('Y-m');
            $finMes = $m->copy()->endOfMonth();
            $cre = $creadosMes[$k] ?? 0;
            $cer = $cerradosMes[$k] ?? 0;
            $grupo = $cohorte[$k] ?? collect();

            $meses[] = [
                'mes'              => $k,
                'creados'          => $cre,
                'cerrados'         => $cer,
                'neto'             => $cre - $cer,
                'backlog_fin_mes'  => $ev->filter(fn($e) => $e->creado <= $finMes && (!$e->cierre || $e->cierre > $finMes))->count(),
                'cohorte_cerrados' => $grupo->where('cerrado', true)->count(),
                'cohorte_tasa_cierre' => $this->pct($grupo->where('cerrado', true)->count(), $grupo->count()),
                'var_creados_pct'  => $prev === null ? null : $this->variacion($cre, $prev),
            ];
            $prev = $cre;
        }

        /* ---- últimos 30 días ---- */
        $creadosDia  = $ev->countBy(fn($e) => $e->creado->toDateString());
        $cerradosDia = $ev->filter(fn($e) => $e->cierre)->countBy(fn($e) => $e->cierre->toDateString());
        $dias = [];
        for ($i = 29; $i >= 0; $i--) {
            $d = $ahora->copy()->subDays($i);
            $suma7 = 0;
            for ($j = 0; $j < 7; $j++) {
                $suma7 += $creadosDia[$d->copy()->subDays($j)->toDateString()] ?? 0;
            }
            $dias[] = [
                'fecha'    => $d->toDateString(),
                'creados'  => $creadosDia[$d->toDateString()] ?? 0,
                'cerrados' => $cerradosDia[$d->toDateString()] ?? 0,
                'media_movil_7d' => round($suma7 / 7, 2),
            ];
        }

        /* ---- últimas 12 semanas ---- */
        $semanas = [];
        for ($i = 11; $i >= 0; $i--) {
            $s = $ahora->copy()->startOfWeek()->subWeeks($i);
            $semanas[] = ['semana_inicio' => $s->toDateString()] + $this->contar($s, $s->copy()->endOfWeek());
        }

        /* ---- trimestres ---- */
        $trimestres = $ev->countBy(fn($e) => $e->creado->year . '-T' . $e->creado->quarter)
            ->map(fn($n, $k) => ['trimestre' => $k, 'creados' => $n])->sortKeys()->values()->all();

        /* ---- comparativas ---- */
        $comparativas = [
            $this->comparar('Mes actual vs mes anterior',
                $ahora->copy()->startOfMonth(), $ahora->copy(),
                $ahora->copy()->subMonthNoOverflow()->startOfMonth(), $ahora->copy()->subMonthNoOverflow()->endOfMonth()),
            $this->comparar('Semana actual vs semana anterior',
                $ahora->copy()->startOfWeek(), $ahora->copy(),
                $ahora->copy()->subWeek()->startOfWeek(), $ahora->copy()->subWeek()->endOfWeek()),
            $this->comparar('Últimos 30 días vs 30 días previos',
                $ahora->copy()->subDays(30), $ahora->copy(),
                $ahora->copy()->subDays(60), $ahora->copy()->subDays(30)),
        ];

        /* ---- proyección simple (promedio de los últimos 3 meses completos) ---- */
        $m3 = [];
        for ($i = 3; $i >= 1; $i--) {
            $i0 = $ahora->copy()->subMonthsNoOverflow($i)->startOfMonth();
            $m3[] = $this->contar($i0, $i0->copy()->endOfMonth());
        }
        $promCre = round(collect($m3)->avg('creados'), 1);
        $promCer = round(collect($m3)->avg('cerrados'), 1);
        $pendientes = $ev->where('cerrado', false)->count();

        return [
            'por_mes'          => $meses,
            'por_dia_ultimos_30' => $dias,
            'por_semana_ultimas_12' => $semanas,
            'por_trimestre'    => $trimestres,
            'por_dia_semana'   => $this->porDiaSemana(),
            'por_hora'         => $this->porHora(),
            'heatmap_dia_hora' => $this->cruzar($ev, fn($e) => $e->creado->dayOfWeekIso, fn($e) => (int) $e->creado->format('G')),
            'comparativas'     => $comparativas,
            'proyeccion'       => [
                'promedio_creados_mes_3m'  => $promCre,
                'promedio_cerrados_mes_3m' => $promCer,
                'balance_mensual'          => round($promCre - $promCer, 1),
                'backlog_crece'            => $promCre > $promCer,
                'meses_para_vaciar_backlog' => $promCer > 0 ? round($pendientes / $promCer, 1) : null,
            ],
        ];
    }

    private function porDiaSemana(): array
    {
        $c = $this->eventos->countBy(fn($e) => $e->creado->dayOfWeekIso);
        return collect(self::DIAS_SEMANA)->map(fn($n, $i) => ['dia' => $n, 'creados' => $c[$i] ?? 0])->values()->all();
    }

    private function porHora(): array
    {
        $c = $this->eventos->countBy(fn($e) => (int) $e->creado->format('G'));
        return collect(range(0, 23))->map(fn($h) => ['hora' => $h, 'creados' => $c[$h] ?? 0])->all();
    }

    private function contar(Carbon $desde, Carbon $hasta): array
    {
        return [
            'creados'  => $this->eventos->filter(fn($e) => $e->creado->between($desde, $hasta))->count(),
            'cerrados' => $this->eventos->filter(fn($e) => $e->cierre && $e->cierre->between($desde, $hasta))->count(),
        ];
    }

    private function comparar(string $nombre, Carbon $a1, Carbon $a2, Carbon $b1, Carbon $b2): array
    {
        $act = $this->contar($a1, $a2);
        $ant = $this->contar($b1, $b2);
        return [
            'periodo'  => $nombre,
            'actual'   => $act,
            'anterior' => $ant,
            'var_creados_pct'  => $this->variacion($act['creados'], $ant['creados']),
            'var_cerrados_pct' => $this->variacion($act['cerrados'], $ant['cerrados']),
        ];
    }

    /* ===================================================================
     |  SECCIÓN: TIEMPOS DE CIERRE (en días)
     * =================================================================== */

    private function tiempos(): array
    {
        $k = $this->claves();
        $cerr = $this->eventos->filter(fn($e) => $e->dias_cierre !== null);
        $n = $cerr->count();

        return [
            'eventos_medidos'  => $n,
            'global'           => $this->resumenNumerico($cerr->pluck('dias_cierre')),
            'sla'              => [
                'dias'    => $this->sla,
                'cumplen' => $cerr->filter(fn($e) => $e->dias_cierre <= $this->sla)->count(),
                'pct'     => $this->pct($cerr->filter(fn($e) => $e->dias_cierre <= $this->sla)->count(), $n),
            ],
            'cerrados_mismo_dia_pct' => $this->pct($cerr->filter(fn($e) => $e->dias_cierre < 1)->count(), $n),
            'distribucion'     => $this->histograma($cerr->pluck('dias_cierre'), self::CORTES_CIERRE),
            'por_tipo'         => $this->statsPor($cerr, $k['tipo']),
            'por_area'         => $this->statsPor($cerr, $k['area']),
            'por_proyecto'     => $this->statsPor($cerr, $k['proyecto']),
            'por_supervisor'   => $this->statsPor($cerr, $k['supervisor']),
            'por_categoria'    => $this->statsPor($cerr, $k['categoria']),
            'por_mes_de_cierre' => collect($this->statsPor($cerr, fn($e) => $e->cierre_real->format('Y-m')))
                ->sortBy('clave')->values()->all(),
        ];
    }

    /* ===================================================================
     |  SECCIÓN: ANTIGÜEDAD DE PENDIENTES
     * =================================================================== */

    private function aging(): array
    {
        $k = $this->claves();
        $pend = $this->eventos->where('cerrado', false);
        $bucket = fn($e) => $this->etiquetaRango($e->edad_dias, self::CORTES_EDAD);
        $estancados = $pend->filter(fn($e) => $e->dias_sin_actualizar > self::UMBRAL_ESTANCADO_DIAS);

        return [
            'pendientes'    => $pend->count(),
            'edad'          => $this->resumenNumerico($pend->pluck('edad_dias')),
            'distribucion'  => $this->histograma($pend->pluck('edad_dias'), self::CORTES_EDAD),
            'por_estado'    => $this->cruzar($pend, $bucket, $k['estado']),
            'por_area'      => $this->cruzar($pend, $bucket, $k['area']),
            'por_proyecto'  => $this->cruzar($pend, $bucket, $k['proyecto']),
            'dias_sin_actualizar' => $this->resumenNumerico($pend->pluck('dias_sin_actualizar')),
            'estancados'    => [
                'umbral_dias' => self::UMBRAL_ESTANCADO_DIAS,
                'total'       => $estancados->count(),
                'pct_de_pendientes' => $this->pct($estancados->count(), $pend->count()),
                'lista'       => $estancados->sortByDesc('dias_sin_actualizar')->take(10)->map(fn($e) => $this->ficha($e))->values()->all(),
            ],
            'mas_antiguos'  => $pend->sortByDesc('edad_dias')->take(10)->map(fn($e) => $this->ficha($e))->values()->all(),
        ];
    }

    /* ===================================================================
     |  SECCIÓN: TRABAJADORES (usa la tabla evento_trabajador)
     * =================================================================== */

    private function trabajadores(): array
    {
        $k = $this->claves();
        $f = $this->filas;

        $ranking = collect($this->agrupar($f, $k['trabajador']))->map(function ($row) use ($f, $k) {
            $mis = $f->filter(fn($e) => (string) $e->id_trabajador === (string) $row['clave']);
            $row['tipo_mas_frecuente'] = $this->moda($mis, $k['tipo']);
            $row['area_mas_frecuente'] = $this->moda($mis, $k['area']);
            $row['ultimo_evento']      = $mis->max(fn($e) => $e->creado->timestamp)
                ? Carbon::createFromTimestamp($mis->max(fn($e) => $e->creado->timestamp))->toDateTimeString() : null;
            return $row;
        })->all();

        $multiples = $this->eventos->filter(fn($e) => ($this->trabajadoresPorEvento[$e->id_evento] ?? collect())->count() > 1);

        $cr = [];
        foreach (['tipo', 'area', 'proyecto', 'estado', 'mes', 'categoria'] as $dim) {
            $cr["trabajador_{$dim}"] = $this->cruzar($f, $k['trabajador'], $k[$dim]);
        }

        return [
            'resumen' => [
                'trabajadores_distintos' => $f->pluck('id_trabajador')->unique()->count(),
                'eventos_sin_trabajador' => $this->eventos->filter(fn($e) => !isset($this->trabajadoresPorEvento[$e->id_evento]))->count(),
                'eventos_con_varios_trabajadores' => $multiples->count(),
                'promedio_trabajadores_por_evento' => round($f->count() / max(1, $this->eventos->count()), 2),
                'promedio_eventos_por_trabajador'  => round($f->count() / max(1, $f->pluck('id_trabajador')->unique()->count()), 1),
            ],
            'ranking' => $ranking,
            'distribucion_trabajadores_por_evento' => $this->eventos
                ->countBy(fn($e) => ($this->trabajadoresPorEvento[$e->id_evento] ?? collect())->count())
                ->map(fn($n, $c) => ['trabajadores' => (int) $c, 'eventos' => $n])->sortKeys()->values()->all(),
            'eventos_con_varios_trabajadores' => $multiples->take(20)->map(fn($e) => $this->ficha($e) + [
                'trabajadores' => $this->trabajadoresPorEvento[$e->id_evento]->all(),
            ])->values()->all(),
            'cruces' => $cr,
        ];
    }

    /* ===================================================================
     |  SECCIÓN: HALLAZGOS (descripciones y categorías)
     * =================================================================== */

    private function hallazgos(): array
    {
        $k = $this->claves();
        $total = $this->eventos->count();

        $acum = 0;
        $porDescripcion = collect($this->agrupar($this->eventos, $k['descripcion']))->map(function ($r) use (&$acum, $total) {
            $acum += $r['total'];
            $r['acumulado_pct'] = $this->pct($acum, $total); // Pareto
            return $r;
        })->all();

        return [
            'descripciones_distintas' => count($porDescripcion),
            'por_descripcion' => $porDescripcion,
            'por_categoria'   => $this->agrupar($this->eventos, $k['categoria']),
            'menor_tasa_cierre' => collect($porDescripcion)->filter(fn($r) => $r['total'] >= 5)->sortBy('tasa_cierre')->take(5)->values()->all(),
        ];
    }

    /* ===================================================================
     |  SECCIÓN: CALIDAD DEL CIERRE
     * =================================================================== */

    private function cierre(): array
    {
        $k = $this->claves();
        $cerr = $this->eventos->where('cerrado', true);
        $n = $cerr->count();

        $diaCierre = $cerr->countBy(fn($e) => $e->cierre->dayOfWeekIso);

        return [
            'cerrados'                 => $n,
            'con_justificacion_pct'    => $this->pct($cerr->filter(fn($e) => filled($e->justificacion))->count(), $n),
            'con_evidencia_cierre_pct' => $this->pct($cerr->where('tiene_evidencia_cierre', true)->count(), $n),
            'con_fecha_cierre_pct'     => $this->pct($cerr->filter(fn($e) => $e->cierre_real)->count(), $n),
            'justificaciones'          => $this->agrupar($cerr->filter(fn($e) => filled($e->justificacion)), fn($e) => $e->justificacion),
            'cierres_por_dia_semana'   => collect(self::DIAS_SEMANA)->map(fn($nom, $i) => ['dia' => $nom, 'cerrados' => $diaCierre[$i] ?? 0])->values()->all(),
            'cierres_por_supervisor'   => $this->agrupar($cerr, $k['supervisor']),
        ];
    }

    /* ===================================================================
     |  SECCIÓN: CALIDAD DE DATOS
     * =================================================================== */

    private function calidadDatos(): array
    {
        $ev = $this->eventos;
        $n = $ev->count();

        $reglas = [
            'cerrados_sin_fecha_cierre'      => ['Cerrados sin fecha de cierre', fn($e) => $e->cerrado && !$e->cierre_real],
            'cerrados_sin_justificacion'     => ['Cerrados sin justificación', fn($e) => $e->cerrado && blank($e->justificacion)],
            'cerrados_sin_evidencia_cierre'  => ['Cerrados sin evidencia de cierre', fn($e) => $e->cerrado && !$e->tiene_evidencia_cierre],
            'no_cerrados_con_datos_cierre'   => ['No cerrados con datos de cierre', fn($e) => !$e->cerrado && ($e->cierre_real || filled($e->justificacion))],
            'cierre_anterior_a_creacion'     => ['Fecha de cierre anterior a la creación', fn($e) => $e->cierre_real && $e->cierre_real < $e->creado],
            'actualizacion_anterior_a_creacion' => ['Actualización anterior a la creación', fn($e) => $e->actualizado < $e->creado],
            'sin_evidencia'                  => ['Sin evidencia inicial', fn($e) => !$e->tiene_evidencia],
            'sin_condicion'                  => ['Sin condición', fn($e) => blank($e->condicion)],
            'sin_referencia'                 => ['Sin referencia', fn($e) => blank($e->referencia)],
            'sin_supervisor'                 => ['Sin supervisor', fn($e) => blank($e->id_supervisor)],
            'sin_trabajador_asignado'        => ['Sin trabajador asignado', fn($e) => !isset($this->trabajadoresPorEvento[$e->id_evento])],
        ];

        $chequeos = [];
        foreach ($reglas as $id => [$etiqueta, $fn]) {
            $malos = $ev->filter($fn);
            $chequeos[] = [
                'id'        => $id,
                'etiqueta'  => $etiqueta,
                'total'     => $malos->count(),
                'pct'       => $this->pct($malos->count(), $n),
                'ejemplos'  => $malos->take(15)->pluck('id_evento')->all(),
            ];
        }

        $avisos = [];
        if ($ev->pluck('severidad')->unique()->count() === 1) {
            $avisos[] = 'Todos los eventos tienen la misma severidad ("' . $ev->first()->severidad . '"): las estadísticas por severidad no aportan información.';
        }

        // Completitud = promedio de "campos clave bien llenos" por evento.
        $completitud = $ev->avg(function ($e) {
            $ok = [
                $e->tiene_evidencia, filled($e->condicion), filled($e->referencia), filled($e->id_supervisor),
                !$e->cerrado || ($e->cierre_real && filled($e->justificacion) && $e->tiene_evidencia_cierre),
            ];
            return count(array_filter($ok)) / count($ok);
        });

        return [
            'completitud_pct' => round($completitud * 100, 1),
            'avisos'          => $avisos,
            'chequeos'        => $chequeos,
        ];
    }

    /* ===================================================================
     |  SECCIÓN: DESTACADOS (insights automáticos)
     * =================================================================== */

    private function destacados(): array
    {
        $k = $this->claves();
        $ev = $this->eventos;
        $min = 5;

        $area  = $this->agrupar($ev, $k['area']);
        $proy  = $this->agrupar($ev, $k['proyecto']);
        $tipo  = $this->agrupar($ev, $k['tipo']);
        $sup   = $this->agrupar($ev, $k['supervisor']);
        $trab  = $this->agrupar($this->filas, $k['trabajador']);
        $mes   = $this->agrupar($ev, $k['mes']);
        $desc  = $this->agrupar($ev, $k['descripcion']);
        $cat   = $this->agrupar($ev, $k['categoria']);
        $dia   = collect($this->porDiaSemana())->sortByDesc('creados')->first();
        $hora  = collect($this->porHora())->sortByDesc('creados')->first();

        $items = [
            $this->dest('Área con más eventos', 'area', $this->extremo($area, 'total'), 'total', 'eventos'),
            $this->dest('Área con mejor tasa de cierre', 'area', $this->extremo($area, 'tasa_cierre', 'max', $min), 'tasa_cierre', '% cerrado'),
            $this->dest('Área con peor tasa de cierre', 'area', $this->extremo($area, 'tasa_cierre', 'min', $min), 'tasa_cierre', '% cerrado'),
            $this->dest('Proyecto con más pendientes', 'proyecto', $this->extremo($proy, 'pendientes'), 'pendientes', 'pendientes'),
            $this->dest('Tipo de evento más frecuente', 'tipo', $this->extremo($tipo, 'total'), 'total', 'eventos'),
            $this->dest('Tipo de evento más lento de cerrar', 'tipo', $this->extremo($tipo, 'dias_prom_cierre', 'max', $min), 'dias_prom_cierre', 'días promedio'),
            $this->dest('Supervisor con mejor tasa de cierre', 'supervisor', $this->extremo($sup, 'tasa_cierre', 'max', $min), 'tasa_cierre', '% cerrado'),
            $this->dest('Supervisor con más pendientes', 'supervisor', $this->extremo($sup, 'pendientes'), 'pendientes', 'pendientes'),
            $this->dest('Trabajador con más eventos', 'trabajador', $this->extremo($trab, 'total'), 'total', 'eventos'),
            $this->dest('Trabajador con más pendientes', 'trabajador', $this->extremo($trab, 'pendientes'), 'pendientes', 'pendientes'),
            $this->dest('Mes con más eventos', 'mes', $this->extremo($mes, 'total'), 'total', 'eventos'),
            $this->dest('Hallazgo más repetido', 'descripcion', $this->extremo($desc, 'total'), 'total', 'veces'),
            $this->dest('Categoría más frecuente', 'categoria', $this->extremo($cat, 'total'), 'total', 'eventos'),
            $dia  ? ['titulo' => 'Día de la semana con más eventos', 'dimension' => 'dia', 'clave' => $dia['dia'], 'texto' => $dia['creados'] . ' eventos'] : null,
            $hora ? ['titulo' => 'Hora con más eventos', 'dimension' => 'hora', 'clave' => $hora['hora'] . ':00', 'texto' => $hora['creados'] . ' eventos'] : null,
        ];

        return array_values(array_filter($items));
    }

    private function extremo(array $rows, string $campo, string $dir = 'max', int $min = 0): ?array
    {
        $c = collect($rows)->filter(fn($r) => $r[$campo] !== null && $r['total'] >= $min);
        return ($dir === 'max' ? $c->sortByDesc($campo) : $c->sortBy($campo))->first();
    }

    private function dest(string $titulo, string $dimension, ?array $fila, string $campo, string $unidad): ?array
    {
        if (!$fila) {
            return null;
        }
        return [
            'titulo'    => $titulo,
            'dimension' => $dimension,
            'clave'     => $fila['clave'],
            'texto'     => "{$fila[$campo]} {$unidad}",
        ];
    }

    /* ===================================================================
     |  SECCIÓN: ACTIVIDAD RECIENTE
     * =================================================================== */

    private function actividadReciente(): array
    {
        $ev = $this->eventos;
        return [
            'ultimos_creados'      => $ev->sortByDesc(fn($e) => $e->creado->timestamp)->take(10)->map(fn($e) => $this->ficha($e))->values()->all(),
            'ultimos_cerrados'     => $ev->where('cerrado', true)->sortByDesc(fn($e) => $e->cierre->timestamp)->take(10)->map(fn($e) => $this->ficha($e))->values()->all(),
            'ultimos_actualizados' => $ev->sortByDesc(fn($e) => $e->actualizado->timestamp)->take(10)->map(fn($e) => $this->ficha($e))->values()->all(),
        ];
    }

    /* ===================================================================
     |  HELPERS GENÉRICOS
     * =================================================================== */

    private function claves(): array
    {
        return [
            'tipo'          => fn($e) => $e->id_tipo_evento,
            'area'          => fn($e) => $e->id_area,
            'proyecto'      => fn($e) => $e->id_proyecto,
            'estado'        => fn($e) => $e->estado,
            'severidad'     => fn($e) => $e->severidad,
            'condicion'     => fn($e) => $e->condicion,
            'supervisor'    => fn($e) => $e->id_supervisor,
            'administrador' => fn($e) => $e->id_administrador,
            'mes'           => fn($e) => $e->creado->format('Y-m'),
            'categoria'     => fn($e) => $e->categoria,
            'descripcion'   => fn($e) => $e->descripcion,
            'trabajador'    => fn($e) => $e->id_trabajador,
        ];
    }

    /** Agrupa y devuelve total, estados, tasa de cierre y tiempos por grupo. */
    private function agrupar(Collection $items, callable $clave, string $orden = 'total'): array
    {
        $total = $items->count();

        $rows = $items
            ->groupBy(fn($e) => (string) ($clave($e) ?? 'sin_dato'))
            ->map(function ($g, $k) use ($total) {
                $cerr = $g->where('cerrado', true)->count();
                $dias = $g->pluck('dias_cierre')->filter(fn($v) => $v !== null);
                $pend = $g->where('cerrado', false);

                return [
                    'clave'          => (string) $k,
                    'total'          => $g->count(),
                    'abiertos'       => $g->where('estado', 'abierto')->count(),
                    'en_revision'    => $g->where('estado', 'en_revision')->count(),
                    'cerrados'       => $cerr,
                    'pendientes'     => $g->count() - $cerr,
                    'pct_del_total'  => $this->pct($g->count(), $total),
                    'tasa_cierre'    => $this->pct($cerr, $g->count()),
                    'dias_prom_cierre'      => $dias->isEmpty() ? null : round($dias->avg(), 1),
                    'edad_prom_pendientes'  => $pend->isEmpty() ? null : round($pend->avg('edad_dias'), 1),
                ];
            });

        $rows = $orden === 'clave' ? $rows->sortBy('clave', SORT_NATURAL) : $rows->sortByDesc('total');

        return $rows->values()->all();
    }

    /** Cruce de dos dimensiones como lista plana [{a, b, total}]. */
    private function cruzar(Collection $items, callable $a, callable $b): array
    {
        return $items
            ->groupBy(fn($e) => ($a($e) ?? 'sin_dato') . '||' . ($b($e) ?? 'sin_dato'))
            ->map(fn($g) => [
                'a'     => (string) ($a($g->first()) ?? 'sin_dato'),
                'b'     => (string) ($b($g->first()) ?? 'sin_dato'),
                'total' => $g->count(),
            ])
            ->sortByDesc('total')->values()->all();
    }

    private function statsPor(Collection $items, callable $clave, string $campo = 'dias_cierre'): array
    {
        return $items
            ->groupBy(fn($e) => (string) ($clave($e) ?? 'sin_dato'))
            ->map(fn($g, $k) => ['clave' => (string) $k] + $this->resumenNumerico($g->pluck($campo)))
            ->sortByDesc('n')->values()->all();
    }

    private function resumenNumerico(Collection $numeros): array
    {
        $v = $numeros->filter(fn($x) => $x !== null)->sort()->values();
        if ($v->isEmpty()) {
            return ['n' => 0, 'promedio' => null, 'mediana' => null, 'p75' => null, 'p90' => null, 'min' => null, 'max' => null];
        }
        return [
            'n'        => $v->count(),
            'promedio' => round($v->avg(), 2),
            'mediana'  => round($this->percentil($v, 50), 2),
            'p75'      => round($this->percentil($v, 75), 2),
            'p90'      => round($this->percentil($v, 90), 2),
            'min'      => round($v->first(), 2),
            'max'      => round($v->last(), 2),
        ];
    }

    private function percentil(Collection $ordenados, float $p): float
    {
        $n = $ordenados->count();
        if ($n === 1) {
            return (float) $ordenados[0];
        }
        $rank = ($p / 100) * ($n - 1);
        $lo = (int) floor($rank);
        $hi = (int) ceil($rank);
        return $ordenados[$lo] + ($ordenados[$hi] - $ordenados[$lo]) * ($rank - $lo);
    }

    private function histograma(Collection $valores, array $cortes): array
    {
        $conteo = array_fill_keys(array_column($cortes, 1), 0);
        $total = 0;
        foreach ($valores->filter(fn($v) => $v !== null) as $v) {
            $conteo[$this->etiquetaRango($v, $cortes)]++;
            $total++;
        }
        return collect($conteo)->map(fn($n, $r) => [
            'rango' => $r, 'total' => $n, 'pct' => $this->pct($n, $total),
        ])->values()->all();
    }

    private function etiquetaRango(float $valor, array $cortes): string
    {
        foreach ($cortes as [$limite, $etiqueta]) {
            if ($valor < $limite) {
                return $etiqueta;
            }
        }
        return end($cortes)[1];
    }

    private function moda(Collection $items, callable $clave): ?array
    {
        $c = $items->countBy(fn($e) => (string) ($clave($e) ?? 'sin_dato'))->sortDesc();
        return $c->isEmpty() ? null : ['clave' => (string) $c->keys()->first(), 'total' => $c->first()];
    }

    private function ficha($e): array
    {
        return [
            'id_evento'    => $e->id_evento,
            'referencia'   => $e->referencia,
            'id_tipo_evento' => $e->id_tipo_evento,
            'id_area'      => $e->id_area,
            'id_proyecto'  => $e->id_proyecto,
            'estado'       => $e->estado,
            'descripcion'  => $e->descripcion,
            'fecha_creacion' => $e->creado->toDateTimeString(),
            'fecha_actualizacion' => $e->actualizado->toDateTimeString(),
            'fecha_cierre' => $e->cierre_real?->toDateTimeString(),
            'edad_dias'    => $e->edad_dias === null ? null : round($e->edad_dias, 1),
            'dias_sin_actualizar' => $e->dias_sin_actualizar === null ? null : round($e->dias_sin_actualizar, 1),
        ];
    }

    private function categoria(?string $descripcion): string
    {
        $t = mb_strtolower((string) $descripcion);
        foreach (self::CATEGORIAS as $nombre => $palabras) {
            foreach ($palabras as $p) {
                if (str_contains($t, $p)) {
                    return $nombre;
                }
            }
        }
        return 'Otros';
    }

    private function pct($parte, $total): float
    {
        return $total > 0 ? round($parte * 100 / $total, 1) : 0.0;
    }

    private function variacion($actual, $anterior): ?float
    {
        return $anterior == 0 ? null : round(($actual - $anterior) * 100 / $anterior, 1);
    }
}