<?php

namespace Database\Factories;

use App\Models\Administrativo;
use App\Models\Area;
use App\Models\Proyecto;
use App\Models\TipoEvento;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventoFactory extends Factory
{
    public function definition(): array
    {
        // Por defecto un evento recién reportado: abierto y sin administrador ni área asignados
        return [
            'id_tipo_evento' => TipoEvento::factory(),
            'id_administrador' => null,
            'id_area' => null,
            'id_proyecto' => Proyecto::factory(),
            'descripcion' => $this->faker->paragraph(),
            'referencia' => $this->faker->sentence(3),
            'condicion' => $this->faker->numberBetween(1, 9),
            'estado' => 'abierto',
        ];
    }

    public function abierto(): static
    {
        return $this->state(fn () => ['estado' => 'abierto']);
    }

    public function cerrado(): static
    {
        return $this->state(fn () => [
            'estado' => 'cerrado',
            'id_administrador' => Administrativo::factory(),
            'id_area' => Area::factory(),
        ]);
    }
}
