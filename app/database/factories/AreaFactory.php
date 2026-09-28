<?php

namespace Database\Factories;

use App\Models\Faena;
use Illuminate\Database\Eloquent\Factories\Factory;

class AreaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id_faena' => Faena::factory(),
            'codigo_area' => strtoupper($this->faker->unique()->bothify('AREA-##')),
            'descripcion' => $this->faker->optional()->sentence(),
        ];
    }
}
