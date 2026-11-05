<?php

namespace Database\Factories;

use App\Models\Asignacion;
use Database\Factories\Providers\SeguridadProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

class ActividadFactory extends Factory
{
    public function definition(): array
    {
        $this->faker->addProvider(new SeguridadProvider($this->faker));

        $inicio = $this->faker->dateTimeBetween('-6 months', '+1 month');

        return [
            'id_asignacion' => Asignacion::factory(),
            'nombre' => $this->faker->nombreActividad(),
            'descripcion' => null,
            'fecha_inicio' => $inicio->format('Y-m-d'),
            'fecha_termino' => $this->faker->optional(0.7)->dateTimeBetween($inicio, '+6 months')?->format('Y-m-d'),
            'estado' => $this->faker->randomElement(['pendiente', 'en_progreso', 'completada']),
        ];
    }
}
