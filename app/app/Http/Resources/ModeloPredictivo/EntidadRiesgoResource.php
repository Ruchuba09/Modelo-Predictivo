<?php

namespace App\Http\Resources\ModeloPredictivo;

use Illuminate\Http\Request;

/** Una entidad vigente (proyecto, área, cuadrilla, trabajador, actividad, cliente o faena) con su riesgo. */
class EntidadRiesgoResource extends RecursoModelo
{
    public function toArray(Request $request): array
    {
        return $this->campos([
            'id', 'nombre', 'detalle', 'id_proyecto', 'proyecto', 'cliente', 'faena', 'prob_evento', 'tasa_semanal',
            'metodo', 'modelo', 'factores', 'indicadores',
        ]);
    }
}
