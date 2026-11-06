<?php

namespace Database\Factories;

use App\Models\Administrativo;
use App\Models\Cuadrilla;
use App\Models\Proyecto;
use Illuminate\Database\Eloquent\Factories\Factory;

class AsignacionFactory extends Factory
{
    public function definition(): array
    {
        $inicio = $this->faker->dateTimeBetween('-1 year', 'now');

        return [
            'id_administrador' => Administrativo::factory(),
            'id_proyecto' => Proyecto::factory(),
            'id_cuadrilla' => Cuadrilla::factory(),
            'fecha_inicio' => $inicio->format('Y-m-d'),
            'fecha_termino' => $this->faker->optional(0.65)->dateTimeBetween($inicio, '+1 year')?->format('Y-m-d'),
        ];
    }
}
