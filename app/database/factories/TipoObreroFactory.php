<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class TipoObreroFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nombre' => ucfirst($this->faker->unique()->word()),
            'descripcion' => $this->faker->optional()->sentence(),
            'estado' => 'activo',
        ];
    }
}
