<?php

namespace Database\Factories;

use App\Models\Asignacion;
use Illuminate\Database\Eloquent\Factories\Factory;

class ActividadFactory extends Factory
{
    public function definition(): array
    {
        $inicio = $this->faker->dateTimeBetween('-6 months', '+1 month');

        return [
            'id_asignacion' => Asignacion::factory(),
            'nombre' => ucfirst($this->faker->words(3, true)),
            'descripcion' => $this->faker->optional()->paragraph(),
            'fecha_inicio' => $inicio->format('Y-m-d'),
            'fecha_termino' => $this->faker->optional(0.7)->dateTimeBetween($inicio, '+6 months')?->format('Y-m-d'),
            'estado' => $this->faker->randomElement(['pendiente', 'en_progreso', 'completada']),
        ];
    }
}
