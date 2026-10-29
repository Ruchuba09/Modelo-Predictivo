<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class PersonaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'rut' => $this->faker->unique()->numerify('##.###.###-#'),
            'nombre_1' => $this->faker->firstName(),
            'nombre_2' => $this->faker->optional()->firstName(),
            'apellido_1' => $this->faker->lastName(),
            'apellido_2' => $this->faker->optional()->lastName(),
        ];
    }
}
