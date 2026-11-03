<?php

namespace Database\Factories;

use App\Models\Proyecto;
use Illuminate\Database\Eloquent\Factories\Factory;

class HallazgoIntravaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id_intrava' => $this->faker->unique()->uuid(),
            'id_proyecto' => Proyecto::factory(),
            'id_proyecto_intrava' => null,
            'id_subproceso_intrava' => $this->faker->optional()->numberBetween(1, 999999),
            'id_responsable_intrava' => $this->faker->optional()->numberBetween(1, 999999),
            'id_segundo_responsable_intrava' => null,
            'id_creador_intrava' => $this->faker->optional()->numberBetween(1, 999999),
            'id_administrador_intrava' => null,
            'correlativo' => $this->faker->numberBetween(1, 99999),
            'correlativo_corporativo' => $this->faker->optional()->numberBetween(1, 999999),
            'tipo' => $this->faker->word(),
            'origen' => $this->faker->randomElement(['Auditoría', 'Inspección', 'Reporte']),
            'requisito_incumplido' => $this->faker->sentence(),
            'fecha_creacion' => $this->faker->date(),
            'fecha_deteccion' => $this->faker->date(),
            'fecha_cierre' => null,
            'estado' => $this->faker->randomElement(['Abierto', 'En tratamiento', 'Cerrado']),
            'estado_inmediata' => 0,
            'estado_analisis' => 0,
            'estado_correctiva' => 0,
            'estado_recursos' => 0,
            'estado_evidencia' => 0,
            'estado_resultado' => 0,
            'estado_riesgos' => 0,
            'tratamiento_completo' => 0,
            'razon_no_tratamiento' => null,
            'prioridad' => $this->faker->randomFloat(3, 0, 10),
            'url' => $this->faker->optional()->url(),
            'proyecto' => ['nombre' => $this->faker->company()],
            'datos' => ['descripcion' => $this->faker->paragraph()],
            'causa_raiz' => ['detalle' => $this->faker->sentence()],
            'payload' => ['origen' => 'faker', 'detalle' => $this->faker->sentence()],
            'sincronizado_en' => now(),
        ];
    }
}
