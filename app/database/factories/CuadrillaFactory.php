<?php

namespace Database\Factories;

use App\Models\Supervisor;
use Illuminate\Database\Eloquent\Factories\Factory;

class CuadrillaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id_supervisor' => Supervisor::factory(),
            'numero_cuadrilla' => strtoupper($this->faker->unique()->bothify('C-####')),
        ];
    }
}
