<?php

namespace Database\Factories;

use App\Models\Trabajador;
use App\Models\TipoObrero;
use Illuminate\Database\Eloquent\Factories\Factory;

class ObreroFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id_trabajador' => Trabajador::factory(['cargo' => 'Obrero']),
            'id_tipo_obrero' => TipoObrero::factory(),
            'id_cuadrilla' => null,
        ];
    }
}
