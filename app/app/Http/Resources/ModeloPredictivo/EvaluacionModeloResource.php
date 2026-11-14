<?php

namespace App\Http\Resources\ModeloPredictivo;

use App\Enums\ObjetivoPrediccion;
use Illuminate\Http\Request;

/**
 * Aciertos de lo publicado para un nivel, objetivo y plazo (en semanas): riesgo medio predicho
 * frente a la proporción de entidades en que ocurrió un evento.
 */
class EvaluacionModeloResource extends RecursoModelo
{
    public function toArray(Request $request): array
    {
        $datos = $this->campos(['nivel', 'tipo_objetivo', 'horizonte', 'predicciones', 'ocurrieron', 'riesgo_predicho',
            'tasa_real', 'brier', 'auc_roc']);
        $datos['etiqueta_objetivo'] = ObjetivoPrediccion::tryFrom((string) ($datos['tipo_objetivo'] ?? ''))?->etiqueta();

        return $datos;
    }
}
