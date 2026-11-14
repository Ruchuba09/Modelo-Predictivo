<?php

namespace App\Http\Resources\ModeloPredictivo;

use App\Enums\ObjetivoPrediccion;
use Illuminate\Http\Request;

/**
 * Respuesta de GET /modelo-predictivo/predicciones y /proyectos/{id}/predicciones: ranking de
 * proyectos, calidad por nivel y, con proyecto, el análisis de sus entidades y su próximo evento.
 */
class PrediccionesResource extends RecursoModelo
{
    public function toArray(Request $request): array
    {
        $datos = $this->campos([
            'tipo_objetivo', 'horizonte_dias', 'horizonte_semanas', 'semanas_modelo', 'horizonte_derivado',
            'unidad_analisis', 'evento', 'modelo', 'validacion', 'analisis_entidades', 'analisis_global',
            'diagnostico', 'advertencia_modelo', 'coherencia',
        ]);

        return [
            ...$datos,
            'etiqueta_objetivo' => ObjetivoPrediccion::tryFrom((string) ($datos['tipo_objetivo'] ?? ''))?->etiqueta(),
            'modelos' => CalidadModeloResource::lista($this->resource['modelos'] ?? []),
            'predicciones' => PrediccionProyectoResource::lista($this->resource['predicciones'] ?? []),
            'historial' => null,
        ];
    }
}
