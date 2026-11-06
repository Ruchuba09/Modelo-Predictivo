<?php

namespace Database\Factories;

use Database\Factories\Providers\RutProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

class PersonaFactory extends Factory
{
    public function definition(): array
    {
        $this->faker->addProvider(new RutProvider($this->faker));

        return [
            'rut' => $this->faker->unique()->rut(),
            'nombre_1' => $this->faker->firstName(),
            'nombre_2' => $this->faker->optional()->firstName(),
            'apellido_1' => $this->faker->lastName(),
            'apellido_2' => $this->faker->optional()->lastName(),
        ];
    }
}
