<?php

namespace Database\Factories;

use App\Models\Proyecto;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReportePrevieneIntravaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id_intrava' => $this->faker->unique()->numberBetween(100000, 999999999),
            'id_proyecto' => Proyecto::factory(),
            'id_proyecto_intrava' => null,
            'identificador' => $this->faker->optional()->numberBetween(1, 999999),
            'proyecto_alias' => $this->faker->optional()->company(),
            'fecha' => $this->faker->date(),
            'hora' => $this->faker->time(),
            'area' => $this->faker->optional()->word(),
            'descripcion' => $this->faker->paragraph(),
            'acciones_inmediatas' => $this->faker->optional()->sentence(),
            'urgencia' => $this->faker->numberBetween(1, 5),
            'aviso_jefatura' => $this->faker->randomElement(['SI', 'NO']),
            'estado' => $this->faker->randomElement(['Abierto', 'Cerrado', 'En proceso']),
            'evidencias_creacion' => $this->faker->numberBetween(0, 3),
            'cierre_comentario' => null,
            'cierre_fecha' => null,
            'cierre_hora' => null,
            'cerrado_por' => null,
            'evidencias_cierre' => 0,
            'payload' => ['origen' => 'faker', 'detalle' => $this->faker->sentence()],
            'sincronizado_en' => now(),
        ];
    }
}
