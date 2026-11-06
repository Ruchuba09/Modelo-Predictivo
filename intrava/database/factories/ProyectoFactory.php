<?php

namespace Database\Factories;

use App\Models\Cliente;
use App\Models\Faena;
use Database\Factories\Providers\SeguridadProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProyectoFactory extends Factory
{
    public function definition(): array
    {
        $this->faker->addProvider(new SeguridadProvider($this->faker));

        $inicio = $this->faker->optional()->dateTimeBetween('-1 year', 'now');

        return [
            'id_faena' => Faena::factory(),
            'id_cliente' => Cliente::factory(),
            'nombre' => $this->faker->nombreProyecto().' '.$this->faker->numberBetween(100, 999),
            'descripcion' => 'Proyecto de montaje industrial.',
            'ubicacion' => $this->faker->optional()->city(),
            'id_proyecto_intrava' => $this->faker->optional(0.25)->numberBetween(100000, 999999999),
            'centro_costo' => $this->faker->optional()->bothify('CC-####'),
            'alias' => $this->faker->optional()->words(2, true),
            'num_contrato' => $this->faker->optional()->bothify('CT-########'),
            'fecha_inicio' => $inicio,
            'fecha_termino' => $inicio ? $this->faker->optional()->dateTimeBetween($inicio, '+1 year') : null,
            'estado' => 'activo',
        ];
    }
}
