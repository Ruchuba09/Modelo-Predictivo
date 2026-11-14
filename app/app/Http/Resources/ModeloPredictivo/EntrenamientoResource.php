<?php

namespace App\Http\Resources\ModeloPredictivo;

use Illuminate\Http\Request;

/** Resultado de POST /modelo-predictivo/entrenar: semana base y calidad de los tres objetivos. */
class EntrenamientoResource extends RecursoModelo
{
    public function toArray(Request $request): array
    {
        $calidad = is_array($this->resource['calidad'] ?? null) ? $this->resource['calidad'] : [];

        return [
            'message' => 'Modelos reentrenados con los datos actuales.',
            ...$this->campos(['semana_base']),
            'calidad' => array_map(fn ($niveles) => CalidadModeloResource::lista($niveles), $calidad),
        ];
    }
}
