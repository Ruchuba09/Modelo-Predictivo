<?php

namespace Database\Factories;

use App\Models\Proyecto;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReporteFlashIntravaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id_intrava' => $this->faker->unique()->numberBetween(100000, 999999999),
            'id_proyecto' => Proyecto::factory(),
            'id_proyecto_intrava' => null,
            'proyecto_alias' => $this->faker->optional()->company(),
            'area' => $this->faker->optional()->word(),
            'fecha' => $this->faker->date(),
            'hora' => $this->faker->time(),
            'turno' => $this->faker->randomElement(['Día', 'Noche']),
            'clasificacion' => $this->faker->word(),
            'casuistica' => $this->faker->word(),
            'descripcion' => $this->faker->paragraph(),
            'reportado_por' => $this->faker->name(),
            'cargo' => $this->faker->jobTitle(),
            'hora_reporte' => $this->faker->time(),
            'payload' => ['origen' => 'faker', 'detalle' => $this->faker->sentence()],
            'sincronizado_en' => now(),
        ];
    }
}
