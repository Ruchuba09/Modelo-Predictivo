<?php

namespace App\Http\Resources\ModeloPredictivo;

use Illuminate\Http\Request;

/**
 * Calidad del modelo publicado para un nivel (proyecto, área, cuadrilla, trabajador o actividad):
 * método, métricas en validación temporal, candidatos comparados y variables importantes.
 * En lesiones incluye la calidad de sus dos partes: el modelo de incidentes y el de lesión.
 */
class CalidadModeloResource extends RecursoModelo
{
    public const CAMPOS = [
        'publicado', 'metodo', 'modelo', 'filas', 'positivos', 'entidades', 'prevalencia', 'filas_validacion',
        'metricas', 'candidatos', 'referencia', 'discriminacion', 'mejora_log_loss_pct', 'mejora_devianza_pct',
        'motivo', 'importancia',
    ];

    public function toArray(Request $request): array
    {
        $datos = $this->campos(self::CAMPOS);
        foreach (['modelo_incidentes', 'modelo_lesion'] as $parte) {
            if (is_array($this->resource[$parte] ?? null)) {
                $datos[$parte] = new self($this->resource[$parte]);
            }
        }

        return $datos;
    }
}
