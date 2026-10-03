<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class FaenaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'codigo_faena' => strtoupper($this->faker->unique()->bothify('FAE-####')),
            'nombre' => $this->faker->words(3, true),
        ];
    }
}
