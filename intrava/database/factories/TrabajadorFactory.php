<?php

namespace Database\Factories;

use App\Models\Persona;
use Database\Factories\Providers\SeguridadProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

class TrabajadorFactory extends Factory
{
    public function definition(): array
    {
        $this->faker->addProvider(new SeguridadProvider($this->faker));

        return [
            'id_persona' => Persona::factory(),
            'cargo' => $this->faker->cargoTerreno(),
            'estado' => 'activo',
        ];
    }

    public function enTerreno(): static
    {
        return $this->state(fn () => ['cargo' => $this->faker->cargoTerreno()]);
    }
}
