<?php

namespace Database\Factories;

use App\Models\Persona;
use Illuminate\Database\Eloquent\Factories\Factory;

class TrabajadorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id_persona' => Persona::factory(),
            'cargo' => $this->faker->jobTitle(),
            'estado' => 'activo',
        ];
    }
}
