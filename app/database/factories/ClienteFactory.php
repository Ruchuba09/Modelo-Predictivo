<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ClienteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'rut' => $this->faker->unique()->numerify('##.###.###-#'),
            'razon_social' => $this->faker->company(),
            'nombre' => $this->faker->optional()->name(),
            'email' => $this->faker->optional()->companyEmail(),
            'telefono' => $this->faker->optional()->phoneNumber(),
            'direccion' => $this->faker->optional()->address(),
            'estado' => 'activo',
        ];
    }
}
