<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Faker\Factory as Faker;

class DatosDemoSeeder extends Seeder
{
    private const PROB_BASE_DIA = 0.006;   // sube/baja para tener mas/menos eventos
    private const T_MEMBRESIAS = 'trabajadores_cuadrillas';
    private const T_CLIENTES     = 'clientes';
    private const T_FAENAS       = 'faenas';
    private const T_PERSONAS     = 'personas';
    private const T_TRABAJADORES = 'trabajadores';
    private const T_CUADRILLAS   = 'cuadrillas';
    private const T_PROYECTOS    = 'proyectos';
    private const T_ASIGNACIONES = 'asignaciones';
    private const T_EVENTOS      = 'eventos';

    // Valores para eventos (segun tu fila de ejemplo)
    private const EVENTO_ESTADOS        = ['abierto', 'abierto', 'cerrado'];
    private const EVENTO_ESTADO_CIERRE  = 'cerrado';
    private const EVENTO_SEVERIDADES    = ['Baja', 'Media', 'Alta'];

    private array $rutsUsados  = [];
    private array $siguienteId = [];

    public function run(): void
    {
        DB::statement('SET search_path TO public'); 
        $faker = Faker::create('es_ES');
        $now   = now();

        DB::transaction(function () use ($faker, $now) {

            // ---------- 5 CLIENTES ----------
            $clientes = [];
            for ($i = 1; $i <= 5; $i++) {
                $empresa = $faker->company();
                $clientes[] = $this->insertar(self::T_CLIENTES, 'id_cliente', [
                    'rut'          => $this->rutUnico(76000000 + $i * 1000 + random_int(1, 999)),
                    'razon_social' => $empresa . ' S.A.',
                    'nombre'       => $empresa,
                    'email'        => 'contacto' . $i . '@' . $faker->unique()->domainName(),
                    'telefono'     => '+569' . random_int(10000000, 99999999),
                    'direccion'    => $faker->city() . ', Chile',
                    'estado'       => 'activo',
                ]);
            }

            // ---------- 10 FAENAS ----------
            $nombresFaena = ['Minera Norte', 'Planta Pacifico', 'Puerto Sur', 'Refineria Central',
                'Cantera Andes', 'Parque Eolico', 'Planta Celulosa', 'Fundicion Costa',
                'Terminal Maritimo', 'Planta Quimica'];

            // Continuar la numeracion de corridas anteriores (FAE-D001, FAE-D002, ...)
            $maxFaena = (int) DB::table(self::T_FAENAS)
                ->where('codigo_faena', 'like', 'FAE-D%')
                ->selectRaw("COALESCE(MAX(SUBSTRING(codigo_faena FROM 6)::int), 0) AS m")
                ->value('m');

            $faenas = [];
            foreach ($nombresFaena as $i => $nombre) {
                $faenas[] = $this->insertar(self::T_FAENAS, 'id_faena', [
                    'codigo_faena' => sprintf('FAE-D%03d', $maxFaena + $i + 1),
                    'nombre'       => 'Faena ' . $nombre,
                ]);
            }

            // ---------- 100 PERSONAS + 100 TRABAJADORES ----------
            $cargos = ['Mecanico', 'Electricista', 'Soldador', 'Prevencionista', 'Operador',
                'Ayudante', 'Capataz', 'Instrumentista', 'Supervisor', 'Tecnico'];
            $trabajadores = [];
            for ($i = 0; $i < 100; $i++) {
                $idPersona = $this->insertar(self::T_PERSONAS, 'id_persona', [
                    'rut'        => $this->rutUnico(random_int(8000000, 25000000)),
                    'nombre_1'   => $faker->firstName(),
                    'nombre_2'   => $faker->firstName(),
                    'apellido_1' => $faker->lastName(),
                    'apellido_2' => $faker->lastName(),
                ]);

                $trabajadores[] = $this->insertar(self::T_TRABAJADORES, 'id_trabajador', [
                    'id_persona'           => $idPersona,
                    'cargo'                => $faker->randomElement($cargos),
                    'estado'               => 'activo',
                    'fecha_creacion'       => $now,
                    'ultima_actualizacion' => $now,
                ]);
            }

            // ---------- 15 CUADRILLAS ----------
            $supervisores = collect($trabajadores)->shuffle()->take(15)->values();

            // Cada supervisor debe existir primero en la tabla de subtipo (supervisores)
            [$tablaSup, $pkSup] = $this->destinoFk(self::T_CUADRILLAS, 'id_supervisor');
            foreach ($supervisores as $idSup) {
                if (!DB::table($tablaSup)->where($pkSup, $idSup)->exists()) {
                    DB::table($tablaSup)->insert($this->soloColumnas($tablaSup, [$pkSup => $idSup]));
                }
            }
            $maxCuad = (int) DB::table(self::T_CUADRILLAS)
                ->where('numero_cuadrilla', 'like', 'C-D%')
                ->selectRaw("COALESCE(MAX(SUBSTRING(numero_cuadrilla FROM 4)::int), 0) AS m")
                ->value('m');

            $cuadrillas = [];          // id_cuadrilla => id_supervisor
            foreach ($supervisores as $i => $idSup) {
                $idCuad = $this->insertar(self::T_CUADRILLAS, 'id_cuadrilla', [
                    'id_supervisor'    => $idSup,
                    'numero_cuadrilla' => sprintf('C-D%03d', $maxCuad + $i + 1),   // <- cambio
                ]);
                $cuadrillas[$idCuad] = $idSup;
            }

            // ---------- 20 PROYECTOS ----------
            $estados = ['activo', 'activo', 'activo', 'pausado', 'finalizado'];
            $proyectos = [];
            for ($i = 1; $i <= 20; $i++) {
                $inicio  = Carbon::create(2026, 1, 1)->addDays(random_int(0, 330));
                $termino = (clone $inicio)->addMonths(random_int(3, 12));

                $id = $this->insertar(self::T_PROYECTOS, 'id_proyecto', [
                    'id_faena'      => $faker->randomElement($faenas),
                    'id_cliente'    => $faker->randomElement($clientes),
                    'nombre'        => 'Proyecto ' . $faker->words(2, true) . " #$i",
                    'descripcion'   => $faker->randomElement([
                        'Mantenimiento preventivo y correctivo',
                        'Montaje de estructuras',
                        'Inspeccion y reparacion de equipos',
                        'Parada de planta programada',
                    ]),
                    'ubicacion'     => $faker->city(),
                    'fecha_inicio'  => $inicio->toDateString(),
                    'fecha_termino' => $termino->toDateString(),
                    'estado'        => $faker->randomElement($estados),
                ]);

                $proyectos[$i] = ['id' => $id, 'inicio' => $inicio, 'termino' => $termino];
            }

            // ---------- 14 ASIGNACIONES (14 de 15 cuadrillas, proyectos distintos) ----------
            $idAdmin = (int) DB::table('administrativos')->value('id_trabajador');
            if (!$idAdmin) {
                throw new \RuntimeException('La tabla administrativos esta vacia: no hay un administrador valido para asignaciones/eventos.');
            }
            $cuadrillasAsignadas = collect(array_keys($cuadrillas))->shuffle()->take(14)->values();
            $proyectosElegidos   = collect($proyectos)->shuffle()->take(14)->values();

            $asignaciones = [];
            $infoCuad     = [];   // id_cuadrilla => ['inicio' => Carbon, 'termino' => Carbon]
            foreach ($cuadrillasAsignadas as $i => $idCuadrilla) {
                $p = $proyectosElegidos[$i];
                $this->insertar(self::T_ASIGNACIONES, 'id_asignacion', [
                    'id_administrador' => $idAdmin,
                    'id_proyecto'      => $p['id'],
                    'id_cuadrilla'     => $idCuadrilla,
                    'fecha_creacion'   => $now,
                    'fecha_inicio'     => $p['inicio']->toDateString(),
                    'fecha_termino'    => $p['termino']->toDateString(),
                ]);

                $infoCuad[$idCuadrilla] = ['inicio' => $p['inicio'], 'termino' => $p['termino']];

                $asignaciones[] = [
                    'cuadrilla'  => $idCuadrilla,
                    'proyecto'   => $p['id'],
                    'supervisor' => $cuadrillas[$idCuadrilla],
                    'inicio'     => $p['inicio'],
                    'termino'    => $p['termino'],
                ];
            }

            // ---------- MEMBRESIAS TRABAJADOR <-> CUADRILLA ----------
            // Cada cuadrilla parte el dia que inicia su asignacion (o el 2026-01-01 si no tiene).
            $idsCuad    = array_keys($cuadrillas);
            $inicioBase = Carbon::create(2026, 1, 1);
            $inicioDe   = fn (int $idCuad) => ($infoCuad[$idCuad]['inicio'] ?? $inicioBase)->copy();

            $membresias = [];   // cada item: ['trabajador','cuadrilla','inicio'=>Carbon,'fin'=>Carbon|null]

            // 1) Cada supervisor es miembro vigente de su propia cuadrilla
            foreach ($cuadrillas as $idCuad => $idSup) {
                $membresias[] = [
                    'trabajador' => $idSup, 'cuadrilla' => $idCuad,
                    'inicio' => $inicioDe($idCuad), 'fin' => null,
                ];
            }

            // 2) Resto de trabajadores: reparto rotativo + casos realistas
            $resto = collect($trabajadores)->diff($supervisores)->shuffle()->values();
            foreach ($resto as $i => $idTrab) {
                $cuadA = $idsCuad[$i % count($idsCuad)];
                $ini   = $inicioDe($cuadA);
                $r     = random_int(1, 100);

                if ($r <= 15 && count($idsCuad) > 1) {
                    // Rotacion: pasa a otra cuadrilla despues de un tiempo
                    $finA  = $ini->copy()->addDays(random_int(30, 120));
                    $otras = array_values(array_diff($idsCuad, [$cuadA]));
                    $cuadB = $otras[array_rand($otras)];

                    $membresias[] = ['trabajador' => $idTrab, 'cuadrilla' => $cuadA, 'inicio' => $ini, 'fin' => $finA];
                    $membresias[] = ['trabajador' => $idTrab, 'cuadrilla' => $cuadB, 'inicio' => $finA->copy()->addDay(), 'fin' => null];
                } elseif ($r <= 25) {
                    // Se incorpora tarde
                    $membresias[] = ['trabajador' => $idTrab, 'cuadrilla' => $cuadA,
                        'inicio' => $ini->copy()->addDays(random_int(15, 90)), 'fin' => null];
                } elseif ($r <= 30) {
                    // Se desvincula de la cuadrilla
                    $membresias[] = ['trabajador' => $idTrab, 'cuadrilla' => $cuadA,
                        'inicio' => $ini, 'fin' => $ini->copy()->addDays(random_int(60, 150))];
                } else {
                    $membresias[] = ['trabajador' => $idTrab, 'cuadrilla' => $cuadA, 'inicio' => $ini, 'fin' => null];
                }
            }

            foreach ($membresias as $m) {
                $this->insertar(self::T_MEMBRESIAS, 'id_trabajador_cuadrilla', [
                    'id_trabajador'  => $m['trabajador'],
                    'id_cuadrilla'   => $m['cuadrilla'],
                    'fecha_inicio'   => $m['inicio']->toDateString(),
                    'fecha_fin'      => $m['fin']?->toDateString(),
                    'fecha_creacion' => $now,
                ]);
            }

                        // ---------- EVENTOS CON SEÑAL (simulacion diaria) ----------
            $tiposEvento = $this->idsReferenciados(self::T_EVENTOS, 'id_tipo_evento');
            $areas       = $this->idsReferenciados(self::T_EVENTOS, 'id_area');
            $hoy         = Carbon::today();

            // Factor por cargo (algunos cargos tienen mas exposicion al riesgo)
            $factorCargo = [
                'Ayudante' => 1.5, 'Soldador' => 1.6, 'Electricista' => 1.3, 'Mecanico' => 1.2,
                'Operador' => 1.1, 'Instrumentista' => 1.0, 'Tecnico' => 1.0,
                'Capataz' => 0.8, 'Supervisor' => 0.6, 'Prevencionista' => 0.5,
            ];
            $cargoDe = DB::table(self::T_TRABAJADORES)
                ->whereIn('id_trabajador', $trabajadores)
                ->pluck('cargo', 'id_trabajador')->all();

            // Riesgo latente por trabajador: 20% "alto riesgo" (x4) * factor de cargo
            $riesgo = []; $altoRiesgo = [];
            foreach ($trabajadores as $idTrab) {
                $alto = random_int(1, 100) <= 20;
                $altoRiesgo[$idTrab] = $alto;
                $riesgo[$idTrab] = ($alto ? 4.0 : 1.0) * ($factorCargo[$cargoDe[$idTrab] ?? ''] ?? 1.0);
            }

            // Asignacion por cuadrilla y multiplicador por proyecto (proyectos mas/menos riesgosos)
            $asigPorCuad = []; $multProy = [];
            foreach ($asignaciones as $a) {
                $asigPorCuad[$a['cuadrilla']] = $a;
                $multProy[$a['proyecto']]     = random_int(60, 180) / 100;
            }

            $idEvento     = (int) DB::table(self::T_EVENTOS)->max('id_evento') + 1;
            $ultimoEvento = [];   // trabajador => Carbon del ultimo evento (para el efecto "racha")
            $filas        = [];

            // Las membresias de un mismo trabajador estan en orden cronologico
            foreach ($membresias as $m) {
                $a = $asigPorCuad[$m['cuadrilla']] ?? null;
                if (!$a) {
                    continue;   // cuadrilla sin asignacion: no esta expuesta
                }
                $trab  = $m['trabajador'];
                $desde = $m['inicio']->greaterThan($a['inicio']) ? $m['inicio']->copy() : $a['inicio']->copy();
                $hasta = $a['termino']->copy();
                if ($m['fin'] && $m['fin']->lessThan($hasta)) { $hasta = $m['fin']->copy(); }
                if ($hoy->lessThan($hasta))                   { $hasta = $hoy->copy(); }   // sin eventos futuros

                $duracion = max(1, abs($a['inicio']->diffInDays($a['termino'])));

                for ($d = $desde->copy(); $d->lessThanOrEqualTo($hasta); $d->addDay()) {
                    $p = self::PROB_BASE_DIA * $riesgo[$trab] * $multProy[$a['proyecto']];

                    if ($d->isWeekend())                                         { $p *= 0.3; }  // obra casi parada
                    if (abs($m['inicio']->diffInDays($d)) < 30)                  { $p *= 2.0; }  // nuevo en la cuadrilla
                    if (abs($a['inicio']->diffInDays($d)) / $duracion < 0.2)     { $p *= 1.5; }  // arranque del proyecto
                    if (isset($ultimoEvento[$trab])
                        && abs($ultimoEvento[$trab]->diffInDays($d)) <= 14)      { $p *= 4.0; }  // racha tras un evento

                    $p = min($p, 0.5);
                    if (random_int(1, 1000000) > (int) ($p * 1000000)) {
                        continue;
                    }

                    $ultimoEvento[$trab] = $d->copy();
                    $fecha = $d->copy()->setTime(random_int(7, 19), random_int(0, 59));

                    // Severidad ligada al riesgo del trabajador
                    $pAlta = $altoRiesgo[$trab] ? 0.40 : 0.15;
                    $r     = random_int(1, 100) / 100;
                    $sev   = $r <= $pAlta ? 'Alta' : ($r <= $pAlta + 0.35 ? 'Media' : 'Baja');

                    // Estado coherente: no se puede haber cerrado en el futuro
                    $estado  = $faker->randomElement(self::EVENTO_ESTADOS);
                    $cierre  = null;
                    if ($estado === self::EVENTO_ESTADO_CIERRE) {
                        $cierre = $fecha->copy()->addDays(random_int(1, 10));
                        if ($cierre->greaterThan($hoy)) {
                            $estado = 'abierto';
                            $cierre = null;
                        }
                    }

                    $filas[] = [
                        'id_evento'           => $idEvento++,
                        'id_tipo_evento'      => $faker->randomElement($tiposEvento),
                        'id_administrador'    => $idAdmin,
                        'id_area'             => $faker->randomElement($areas),
                        'id_proyecto'         => $a['proyecto'],
                        'fecha_creacion'      => $fecha,
                        'fecha_actualizacion' => $fecha,
                        'descripcion'         => $faker->sentence(10),
                        'estado'              => $estado,
                        'condicion'           => null,
                        'evidencia'           => null,
                        'referencia'          => null,
                        'id_trabajador'       => $trab,
                        'id_supervisor'       => $a['supervisor'],
                        'fecha_cierre'        => $cierre,
                        'justificacion'       => $cierre ? $faker->sentence(8) : null,
                        'evidencia_cierre'    => null,
                        'severidad'           => $sev,
                    ];
                }
            }

            foreach (array_chunk($filas, 100) as $chunk) {
                DB::table(self::T_EVENTOS)->insert(
                    array_map(fn ($f) => $this->soloColumnas(self::T_EVENTOS, $f), $chunk)
                );
            }
            $this->command?->info('Eventos generados: ' . count($filas));
        });

        $this->resincronizarSecuencias();
    }

    /** Inserta con id explicito (MAX+1) y devuelve ese id. No depende de la secuencia. */
    private function insertar(string $tabla, string $pk, array $datos): int
    {
        if (!isset($this->siguienteId[$tabla])) {
            $this->siguienteId[$tabla] = (int) DB::table($tabla)->max($pk) + 1;
        }
        $id = $this->siguienteId[$tabla]++;

        DB::table($tabla)->insert($this->soloColumnas($tabla, [$pk => $id] + $datos));

        return $id;
    }

    private function idsReferenciados(string $tabla, string $columna): array
    {
        $fk = DB::selectOne(
            "SELECT ccu.table_name AS tabla, ccu.column_name AS pk
               FROM information_schema.table_constraints tc
               JOIN information_schema.key_column_usage kcu
                 ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
               JOIN information_schema.constraint_column_usage ccu
                 ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
              WHERE tc.constraint_type = 'FOREIGN KEY'
                AND kcu.table_name = ? AND kcu.column_name = ?
              LIMIT 1",
            [$tabla, $columna]
        );

        if (!$fk) {
            throw new \RuntimeException(
                "No encontre una FK para {$tabla}.{$columna}. Dime a que tabla apunta y lo ajusto."
            );
        }

        $ids = DB::table($fk->tabla)->pluck($fk->pk)->all();

        if (empty($ids)) {
            throw new \RuntimeException(
                "La tabla {$fk->tabla} (referenciada por {$tabla}.{$columna}) esta vacia. " .
                "Crea al menos un registro ahi y vuelve a correr el seeder."
            );
        }

        return $ids;
    }

    private function soloColumnas(string $tabla, array $datos): array
    {
        $cols = Schema::getColumnListing($tabla);
        return array_intersect_key($datos, array_flip($cols));
    }

    private function rutUnico(int $base): string
    {
        while (true) {
            $rut = $this->formatRut($base);

            if (!isset($this->rutsUsados[$base])
                && !DB::table(self::T_PERSONAS)->where('rut', $rut)->exists()
                && !DB::table(self::T_CLIENTES)->where('rut', $rut)->exists()) {
                $this->rutsUsados[$base] = true;
                return $rut;
            }
            $base++;
        }
    }

    private function formatRut(int $num): string
    {
        $suma = 0; $mult = 2;
        foreach (array_reverse(str_split((string) $num)) as $d) {
            $suma += (int) $d * $mult;
            $mult = $mult === 7 ? 2 : $mult + 1;
        }
        $resto = 11 - ($suma % 11);
        $dv = $resto === 11 ? '0' : ($resto === 10 ? 'K' : (string) $resto);
        return $num . '-' . $dv;
    }
    private function destinoFk(string $tabla, string $columna): array
    {
        $fk = DB::selectOne(
            "SELECT ccu.table_name AS tabla, ccu.column_name AS pk
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu
                ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND kcu.table_name = ? AND kcu.column_name = ?
            LIMIT 1",
            [$tabla, $columna]
        );

        if (!$fk) {
            throw new \RuntimeException("No encontre una FK para {$tabla}.{$columna}.");
        }

        return [$fk->tabla, $fk->pk];
    }

    /** Sincroniza las secuencias con el MAX(id) real para que la app siga insertando sin chocar. */
    private function resincronizarSecuencias(): void
    {
        $tablas = [
            self::T_CLIENTES => 'id_cliente', self::T_FAENAS => 'id_faena',
            self::T_PERSONAS => 'id_persona', self::T_TRABAJADORES => 'id_trabajador',
            self::T_CUADRILLAS => 'id_cuadrilla', self::T_PROYECTOS => 'id_proyecto',
            self::T_ASIGNACIONES => 'id_asignacion', self::T_EVENTOS => 'id_evento',
            self::T_ASIGNACIONES => 'id_asignacion', self::T_EVENTOS => 'id_evento',
            self::T_MEMBRESIAS => 'id_trabajador_cuadrilla',
        ];

        foreach ($tablas as $tabla => $pk) {
            if (!Schema::hasTable($tabla) || !Schema::hasColumn($tabla, $pk)) {
                continue;
            }
            DB::statement(
                "SELECT setval(pg_get_serial_sequence('{$tabla}', '{$pk}'),
                               COALESCE((SELECT MAX({$pk}) FROM {$tabla}), 0) + 1, false)
                 WHERE pg_get_serial_sequence('{$tabla}', '{$pk}') IS NOT NULL"
            );
        }
    }
}