<?php

namespace Database\Factories;

use App\Models\Administrativo;
use App\Models\Area;
use App\Models\Evento;
use App\Models\Proyecto;
use App\Models\Trabajador;
use App\Models\TipoEvento;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventoFactory extends Factory
{
    public function configure(): static
    {
        return $this->afterCreating(function (Evento $evento): void {
            if ($evento->id_trabajador) {
                $evento->trabajadores()->syncWithoutDetaching([$evento->id_trabajador]);
            }
        });
    }

    public function definition(): array
    {
        // Por defecto un evento recién reportado: abierto y sin administrador ni área asignados
        return [
            'id_tipo_evento' => TipoEvento::factory(),
            'id_administrador' => null,
            'id_area' => null,
            'id_proyecto' => Proyecto::factory(),
            'id_trabajador' => null,
            'id_supervisor' => null,
            'descripcion' => $this->faker->paragraph(),
            'referencia' => $this->faker->sentence(3),
            'condicion' => $this->faker->numberBetween(1, 10),
            'estado' => 'abierto',
            'severidad' => $this->faker->randomElement(['Baja', 'Media', 'Alta']),
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
            'fecha_cierre' => now(),
            'justificacion' => $this->faker->sentence(),
        ]);
    }

    public function reportadoPor(Trabajador $trabajador): static
    {
        return $this->state(fn () => ['id_trabajador' => $trabajador->id_trabajador]);
    }
}
