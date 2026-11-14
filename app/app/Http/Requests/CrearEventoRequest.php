<?php

namespace App\Http\Requests;

use App\Models\TipoEvento;
use Illuminate\Validation\Rule;

/**
 * Registro de un evento de un tipo distinto a Tarjeta PARE (RF-10).
 * Las Tarjetas PARE se registran con CrearTarjetaPareRequest (RF-9).
 */
class CrearEventoRequest extends RegistrarEventoRequest
{
    protected function idTipoEvento(): ?int
    {
        return $this->filled('id_tipo_evento') ? $this->integer('id_tipo_evento') : null;
    }

    protected function mensajeGeneral(): string
    {
        return 'Información mal ingresada, no se completó el registro del evento.';
    }

    protected function reglasPropias(): array
    {
        $idTipoPare = $this->idTipoPare();
        $esIncidente = (bool) TipoEvento::whereKey($this->idTipoEvento())->value('es_incidente');

        return [
            'id_tipo_evento' => [
                'bail',
                'required',
                'integer',
                'exists:tipo_eventos,id_tipo_evento',
                Rule::notIn(array_filter([$idTipoPare])),
            ],
            'id_severidad' => ['nullable', 'integer', 'exists:cat_severidad,id_severidad'],
            'id_categoria_evento' => ['nullable', 'integer', 'exists:cat_categoria_evento,id_categoria_evento'],
            // La clasificación solo aplica a incidentes; en otro tipo se descarta.
            'id_clasificacion_incidente' => $esIncidente
                ? ['nullable', 'integer', 'exists:cat_clasificacion_incidente,id_clasificacion_incidente']
                : ['exclude'],
            // Campo de texto heredado que aún envían clientes antiguos y usan las estadísticas.
            'severidad' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            ...parent::messages(),
            'id_tipo_evento.required' => 'Debe seleccionar el tipo de evento.',
            'id_tipo_evento.not_in' => 'Las Tarjetas PARE se registran desde su propio formulario.',
        ];
    }
}
