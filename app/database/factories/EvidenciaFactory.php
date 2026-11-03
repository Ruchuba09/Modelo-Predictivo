<?php

namespace Database\Factories;

use App\Models\Evento;
use Illuminate\Database\Eloquent\Factories\Factory;

class EvidenciaFactory extends Factory
{
    public function definition(): array
    {
        $nombre = $this->faker->uuid() . '.pdf';

        return [
            'id_evento' => Evento::factory(),
            'nombre' => $nombre,
            'ruta' => 'evidencias/' . $nombre,
            'tipo_archivo' => 'application/pdf',
            'fecha_creacion' => now(),
        ];
    }
}
