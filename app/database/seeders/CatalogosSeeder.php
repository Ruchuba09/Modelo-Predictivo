<?php

namespace Database\Seeders;

use App\Models\Departamento;
use App\Models\TipoEvento;
use App\Models\TipoObrero;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CatalogosSeeder extends Seeder
{
    /** Categorías del formato de investigación de incidentes de AVA (FG-08-02). */
    private const PARTES_CUERPO = ['Cabeza', 'Cara', 'Ojos', 'Brazos', 'Manos', 'Tronco', 'Piernas', 'Pies', 'Múltiples', 'Lesiones internas'];

    private const TIPOS_LESION = [
        'Herida', 'Contusión', 'Fractura', 'Amputación', 'Lumbago', 'Conjuntivitis química', 'Conjuntivitis actínica',
        'Quemaduras', 'Asfixia', 'Colapso', 'Torcedura', 'Otros',
    ];

    private const SISTEMAS_TRABAJO = [['14x14', 14, 14], ['10x10', 10, 10], ['7x7', 7, 7], ['20x20', 20, 20], ['8x6', 8, 6], ['4x3', 4, 3]];

    public function run(): void
    {
        foreach (['Tarjeta PARE', 'Incidente', 'Accidente', 'Hallazgo', 'No conformidad', 'Observacion preventiva'] as $nombre) {
            TipoEvento::firstOrCreate(['nombre' => $nombre]);
        }

        foreach ([
            ['nombre' => 'General', 'descripcion' => 'Trabajo general en terreno.'],
            ['nombre' => 'Mecánico', 'descripcion' => 'Mantenimiento y reparación mecánica.'],
            ['nombre' => 'Eléctrico', 'descripcion' => 'Instalaciones y mantenimiento eléctrico.'],
        ] as $tipoObrero) {
            TipoObrero::firstOrCreate(['nombre' => $tipoObrero['nombre']], $tipoObrero + ['estado' => 'activo']);
        }

        foreach (['Operaciones', 'Prevención de Riesgos', 'Mantenimiento'] as $nombre) {
            Departamento::firstOrCreate(
                ['nombre' => $nombre],
                ['descripcion' => "Departamento de {$nombre}.", 'estado' => 'activo']
            );
        }

        $this->agregarNombres('cat_parte_cuerpo', self::PARTES_CUERPO);
        $this->agregarNombres('cat_tipo_lesion', self::TIPOS_LESION);
        if (Schema::hasTable('cat_sistema_trabajo')) {
            foreach (self::SISTEMAS_TRABAJO as [$nombre, $trabajo, $descanso]) {
                DB::table('cat_sistema_trabajo')->insertOrIgnore([
                    'nombre' => $nombre, 'dias_trabajo' => $trabajo, 'dias_descanso' => $descanso,
                ]);
            }
        }
    }

    private function agregarNombres(string $tabla, array $nombres): void
    {
        if (Schema::hasTable($tabla)) {
            DB::table($tabla)->insertOrIgnore(array_map(fn ($nombre) => ['nombre' => $nombre], $nombres));
        }
    }
}
