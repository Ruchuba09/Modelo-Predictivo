<?php

namespace Database\Factories;

use App\Models\Faena;
use Database\Factories\Providers\SeguridadProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

class AreaFactory extends Factory
{
    public function definition(): array
    {
        $this->faker->addProvider(new SeguridadProvider($this->faker));

        return [
            'id_faena' => Faena::factory(),
            'codigo_area' => strtoupper($this->faker->unique()->bothify('AREA-##')),
            'descripcion' => $this->faker->randomElement(SeguridadProvider::AREAS)[1],
        ];
    }
}
