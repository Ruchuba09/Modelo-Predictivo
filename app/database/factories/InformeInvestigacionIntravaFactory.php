<?php

namespace Database\Factories;

use App\Models\Proyecto;
use Illuminate\Database\Eloquent\Factories\Factory;

class InformeInvestigacionIntravaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id_intrava' => $this->faker->unique()->numberBetween(100000, 999999999),
            'uuid_intrava' => $this->faker->optional()->unique()->uuid(),
            'id_reporte_flash_intrava' => null,
            'id_proyecto' => Proyecto::factory(),
            'id_proyecto_intrava' => null,
            'proyecto_alias' => $this->faker->optional()->company(),
            'general' => ['fecha' => $this->faker->date(), 'resumen' => $this->faker->sentence()],
            'analisis_causal' => [['causa' => $this->faker->sentence()]],
            'causa_raiz' => $this->faker->sentence(),
            'accidentado' => ['nombre' => $this->faker->name(), 'cargo' => $this->faker->jobTitle()],
            'payload' => ['origen' => 'faker', 'detalle' => $this->faker->sentence()],
            'sincronizado_en' => now(),
        ];
    }
}
