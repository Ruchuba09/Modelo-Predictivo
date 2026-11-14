<?php

namespace App\Http\Resources\ModeloPredictivo;

use Illuminate\Http\Request;

/** Riesgo de un proyecto en el plazo: probabilidad, tasa semanal y factores que la mueven. */
class PrediccionProyectoResource extends RecursoModelo
{
    public function toArray(Request $request): array
    {
        return $this->campos([
            'id_proyecto', 'nombre_proyecto', 'semana', 'prob_evento', 'tasa_semanal', 'metodo',
            'factores_principales', 'variables',
        ]);
    }
}
