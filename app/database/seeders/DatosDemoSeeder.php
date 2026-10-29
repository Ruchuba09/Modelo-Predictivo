<?php

namespace Database\Seeders;

use App\Models\Actividad;
use App\Models\Area;
use App\Models\Asignacion;
use App\Models\Cliente;
use App\Models\Cuadrilla;
use App\Models\Departamento;
use App\Models\Evento;
use App\Models\Faena;
use App\Models\HallazgoIntrava;
use App\Models\InformeInvestigacionIntrava;
use App\Models\Obrero;
use App\Models\Proyecto;
use App\Models\ReporteFlashIntrava;
use App\Models\ReportePrevieneIntrava;
use App\Models\Supervisor;
use App\Models\TipoEvento;
use App\Models\Trabajador;
use App\Models\Administrativo;
use App\Models\tipo_obrero;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatosDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (Proyecto::where('nombre', 'like', 'DEMO-%')->exists()) {
            $this->command?->info('Los datos de demostración ya están cargados.');

            return;
        }

        DB::transaction(function () {
            $administrador = Administrativo::query()->first()
                ?? throw new \RuntimeException('Ejecuta TrabajadorSeeder antes de DatosDemoSeeder.');
            $tipoObrero = tipo_obrero::query()->firstOrFail();
            $tipoPare = TipoEvento::firstOrCreate(['nombre' => 'Tarjeta PARE']);

            $clientes = Cliente::factory()->count(3)->create();
            $faenas = Faena::factory()->count(3)->create();

            $departamento = Departamento::firstOrCreate(
                ['nombre' => 'Operaciones'],
                ['descripcion' => 'Departamento de Operaciones.', 'estado' => 'activo']
            );

            $cuadrillas = collect();
            for ($i = 1; $i <= 3; $i++) {
                $trabajador = Trabajador::factory()->create([
                    'cargo' => 'Supervisor de terreno',
                ]);
                $trabajador->departamentos()->syncWithoutDetaching([$departamento->id_departamento]);
                $supervisor = Supervisor::firstOrCreate(['id_trabajador' => $trabajador->id_trabajador]);
                $cuadrilla = Cuadrilla::factory()->create([
                    'id_supervisor' => $supervisor->id_trabajador,
                ]);

                $cuadrillas->push($cuadrilla);
            }

            $obreros = collect();
            for ($i = 1; $i <= 12; $i++) {
                $trabajador = Trabajador::factory()->create();
                $trabajador->departamentos()->syncWithoutDetaching([$departamento->id_departamento]);
                $obrero = Obrero::create([
                    'id_trabajador' => $trabajador->id_trabajador,
                    'id_tipo_obrero' => $tipoObrero->id_tipo_obrero,
                    'id_cuadrilla' => $cuadrillas[($i - 1) % $cuadrillas->count()]->id_cuadrilla,
                ]);
                $obreros->push($obrero);
            }

            $areas = collect();
            foreach ($faenas as $index => $faena) {
                for ($j = 1; $j <= 2; $j++) {
                    $areas->push(Area::factory()->create([
                        'id_faena' => $faena->id_faena,
                        'codigo_area' => sprintf('D%02d-A%02d', $index + 1, $j),
                    ]));
                }
            }

            $proyectos = collect();
            for ($i = 0; $i < 6; $i++) {
                $proyectos->push(Proyecto::factory()->create([
                    'id_faena' => $faenas[$i % $faenas->count()]->id_faena,
                    'id_cliente' => $clientes[$i % $clientes->count()]->id_cliente,
                    'nombre' => sprintf('DEMO-Proyecto-%02d', $i + 1),
                    'id_proyecto_intrava' => 880000 + $i + 1,
                    'centro_costo' => sprintf('CC-%04d', $i + 1),
                    'alias' => sprintf('Demo INTRAVA %02d', $i + 1),
                    'num_contrato' => sprintf('CT-%04d', $i + 1),
                ]));
            }

            foreach ($proyectos as $index => $proyecto) {
                $asignacion = Asignacion::factory()->create([
                    'id_administrador' => $administrador->id_trabajador,
                    'id_proyecto' => $proyecto->id_proyecto,
                    'id_cuadrilla' => $cuadrillas[$index % $cuadrillas->count()]->id_cuadrilla,
                ]);
                for ($j = 1; $j <= 2; $j++) {
                    Actividad::factory()->create([
                        'id_asignacion' => $asignacion->id_asignacion,
                        'nombre' => sprintf('Actividad %d.%d', $index + 1, $j),
                    ]);
                }
            }

            foreach ($proyectos as $index => $proyecto) {
                $obrero = $obreros[$index % $obreros->count()];
                $evento = Evento::factory()->create([
                    'id_tipo_evento' => $tipoPare->id_tipo_evento,
                    'id_administrador' => $administrador->id_trabajador,
                    'id_area' => $areas[$index % $areas->count()]->id_area,
                    'id_proyecto' => $proyecto->id_proyecto,
                    'id_trabajador' => $obrero->id_trabajador,
                    'id_supervisor' => $cuadrillas[$index % $cuadrillas->count()]->id_supervisor,
                    'estado' => $index % 3 === 0 ? 'cerrado' : 'abierto',
                    'fecha_cierre' => $index % 3 === 0 ? now()->subDays(1) : null,
                    'justificacion' => $index % 3 === 0 ? 'Medida correctiva aplicada.' : null,
                    'referencia' => sprintf('DEMO-REF-%03d', $index + 1),
                    'condicion' => ($index % 10) + 1,
                    'severidad' => ['Baja', 'Media', 'Alta'][$index % 3],
                ]);
                $previeneId = 990000 + $index + 1;
                $flashId = 995000 + $index + 1;
                ReportePrevieneIntrava::factory()->create([
                    'id_intrava' => $previeneId,
                    'id_proyecto' => $proyecto->id_proyecto,
                    'id_proyecto_intrava' => $proyecto->id_proyecto_intrava,
                ]);
                ReporteFlashIntrava::factory()->create([
                    'id_intrava' => $flashId,
                    'id_proyecto' => $proyecto->id_proyecto,
                    'id_proyecto_intrava' => $proyecto->id_proyecto_intrava,
                ]);
                InformeInvestigacionIntrava::factory()->create([
                    'id_intrava' => 996000 + $index + 1,
                    'id_reporte_flash_intrava' => $flashId,
                    'id_proyecto' => $proyecto->id_proyecto,
                    'id_proyecto_intrava' => $proyecto->id_proyecto_intrava,
                ]);
                HallazgoIntrava::factory()->create([
                    'id_proyecto' => $proyecto->id_proyecto,
                    'id_proyecto_intrava' => $proyecto->id_proyecto_intrava,
                ]);
            }
        });

        $this->command?->info('Datos demo creados para proyectos, cuadrillas, actividades, eventos e INTRAVA.');
    }
}
