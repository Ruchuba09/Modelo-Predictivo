<?php

namespace App\Http\Resources\ModeloPredictivo;

use Illuminate\Http\Request;

/**
 * Respuesta de GET /modelo-predictivo/modelos: los tres objetivos con su modelo publicado, su calidad
 * por nivel y el riesgo total esperado, más el modelo de lesión (B) que usan las lesiones.
 */
class ResumenModelosResource extends RecursoModelo
{
    public function toArray(Request $request): array
    {
        $objetivos = is_array($this->resource['objetivos'] ?? null) ? $this->resource['objetivos'] : [];
        $lesion = is_array($this->resource['modelo_lesion'] ?? null) ? $this->resource['modelo_lesion'] : [];

        return [
            ...$this->campos(['version', 'semana_base', 'entrenado_en', 'proyectos_vigentes', 'horizontes_dias']),
            'objetivos' => array_map(fn (array $objetivo) => [
                ...array_filter(
                    array_intersect_key($objetivo, array_flip(['tipo_objetivo', 'nombre', 'clave', 'predice',
                        'tasa_semanal_total', 'eventos_esperados_30_dias'])),
                    fn ($valor) => $valor !== null,
                ),
                'calidad' => CalidadModeloResource::lista($objetivo['calidad'] ?? []),
            ], $objetivos),
            'modelo_lesion' => [
                ...array_filter(
                    array_intersect_key($lesion, array_flip(['nombre', 'clave', 'predice', 'probabilidad_media'])),
                    fn ($valor) => $valor !== null,
                ),
                'calidad' => new CalidadModeloResource($lesion['calidad'] ?? []),
            ],
        ];
    }
}
