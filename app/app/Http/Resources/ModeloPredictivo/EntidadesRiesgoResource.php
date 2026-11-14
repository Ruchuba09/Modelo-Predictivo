<?php

namespace App\Http\Resources\ModeloPredictivo;

use Illuminate\Http\Request;

/** Respuesta de GET /modelo-predictivo/entidades: todas las entidades vigentes, por nivel. */
class EntidadesRiesgoResource extends RecursoModelo
{
    public function toArray(Request $request): array
    {
        return [
            ...$this->campos([
                'tipo_objetivo', 'semana', 'horizonte_dias', 'horizonte_semanas', 'semanas_modelo', 'horizonte_derivado',
                'coherencia',
            ]),
            'niveles' => array_map(
                fn ($entidades) => EntidadRiesgoResource::lista($entidades),
                is_array($this->resource['niveles'] ?? null) ? $this->resource['niveles'] : [],
            ),
            'modelos' => CalidadModeloResource::lista($this->resource['modelos'] ?? []),
            'historial' => null,
        ];
    }
}
