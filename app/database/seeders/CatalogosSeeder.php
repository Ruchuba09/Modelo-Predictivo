<?php

namespace Database\Seeders;

use App\Models\Departamento;
use App\Models\TipoEvento;
use App\Models\tipo_obrero;
use Illuminate\Database\Seeder;

class CatalogosSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['nombre' => 'Tarjeta PARE'],
            ['nombre' => 'Incidente'],
            ['nombre' => 'Observación de seguridad'],
        ] as $tipoEvento) {
            TipoEvento::firstOrCreate($tipoEvento);
        }

        foreach ([
            ['nombre' => 'General', 'descripcion' => 'Trabajo general en terreno.'],
            ['nombre' => 'Mecánico', 'descripcion' => 'Mantenimiento y reparación mecánica.'],
            ['nombre' => 'Eléctrico', 'descripcion' => 'Instalaciones y mantenimiento eléctrico.'],
        ] as $tipoObrero) {
            tipo_obrero::firstOrCreate(['nombre' => $tipoObrero['nombre']], $tipoObrero + ['estado' => 'activo']);
        }

        foreach (['Operaciones', 'Prevención de Riesgos', 'Mantenimiento'] as $nombre) {
            Departamento::firstOrCreate(
                ['nombre' => $nombre],
                ['descripcion' => "Departamento de {$nombre}.", 'estado' => 'activo']
            );
        }
    }
}
