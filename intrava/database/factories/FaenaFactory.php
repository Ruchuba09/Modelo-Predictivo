<?php

namespace Database\Factories;

use Database\Factories\Providers\SeguridadProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

class FaenaFactory extends Factory
{
    public function definition(): array
    {
        $this->faker->addProvider(new SeguridadProvider($this->faker));

        return [
            'codigo_faena' => strtoupper($this->faker->unique()->bothify('FAE-####')),
            'nombre' => $this->faker->nombreFaena(),
        ];
    }
}
