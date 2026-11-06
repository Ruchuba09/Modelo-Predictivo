<?php

namespace Database\Factories;

use App\Models\Evento;
use App\Models\Supervisor;
use App\Models\Trabajador;
use Illuminate\Database\Eloquent\Factories\Factory;

class SituacionCriticaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id_trabajador' => Trabajador::factory(),
            'id_supervisor' => Supervisor::factory(),
            'id_evento' => Evento::factory(),
            'referencia' => $this->faker->sentence(3),
            'condicion' => $this->faker->randomElement([1, 2]),
        ];
    }
}
