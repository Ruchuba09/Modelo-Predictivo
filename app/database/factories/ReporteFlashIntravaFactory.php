<?php

namespace Database\Factories;

use App\Models\Proyecto;
use Database\Factories\Providers\SeguridadProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReporteFlashIntravaFactory extends Factory
{
    public function definition(): array
    {
        $this->faker->addProvider(new SeguridadProvider($this->faker));

        return [
            'id_intrava' => $this->faker->unique()->numberBetween(100000, 999999999),
            'id_proyecto' => Proyecto::factory(),
            'id_proyecto_intrava' => null,
            'proyecto_alias' => $this->faker->optional()->company(),
            'area' => $this->faker->optional()->word(),
            'fecha' => $this->faker->date(),
            'hora' => $this->faker->time(),
            'turno' => $this->faker->randomElement(['Día', 'Noche']),
            'clasificacion' => $this->faker->randomElement(['Daño material', 'Lesión sin tiempo perdido', 'Falla operacional', 'Cuasi accidente']),
            'casuistica' => null,
            'descripcion' => $this->faker->descripcionIncidente(),
            'reportado_por' => $this->faker->name(),
            'cargo' => $this->faker->cargoTerreno(),
            'hora_reporte' => $this->faker->time(),
            'payload' => ['origen' => 'faker', 'detalle' => $this->faker->sentence()],
            'sincronizado_en' => now(),
        ];
    }
}
