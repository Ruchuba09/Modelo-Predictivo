<?php

namespace Database\Factories;

use Database\Factories\Providers\RutProvider;
use Database\Factories\Providers\SeguridadProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClienteFactory extends Factory
{
    public function definition(): array
    {
        $this->faker->addProvider(new SeguridadProvider($this->faker));

        $this->faker->addProvider(new RutProvider($this->faker));

        return [
            'rut' => $this->faker->unique()->rut(),
            'razon_social' => $this->faker->nombreMinera().' SpA',
            'nombre' => $this->faker->nombreMinera(),
            'email' => $this->faker->optional()->companyEmail(),
            'telefono' => $this->faker->optional()->phoneNumber(),
            'direccion' => $this->faker->optional()->address(),
            'estado' => 'activo',
        ];
    }
}
