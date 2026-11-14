<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/** Registro de una Tarjeta PARE (RF-9). El tipo de evento lo fija el servidor. */
class CrearTarjetaPareRequest extends RegistrarEventoRequest
{
    private ?int $idTipoPareCache = null;

    protected function idTipoEvento(): ?int
    {
        return $this->idTipoPareCache ??= $this->idTipoPare();
    }

    protected function mensajeGeneral(): string
    {
        return 'Información mal ingresada, no se completó el registro de la Tarjeta PARE.';
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('tipo_detencion')) {
            $this->merge(['tipo_detencion' => 'sin_detencion']);
        }
    }

    protected function reglasPropias(): array
    {
        return [
            'condicion' => ['required', 'integer', 'between:1,10'],
            'tipo_detencion' => ['required', 'string', Rule::in(['sin_detencion', 'parcial', 'total'])],
        ];
    }

    public function messages(): array
    {
        return [
            ...parent::messages(),
            'condicion.required' => 'Debe seleccionar una condición.',
            'condicion.between' => 'Por favor seleccione una condición válida.',
            'condicion.integer' => 'Por favor seleccione una condición válida.',
            'tipo_detencion.in' => 'El tipo de detención no es válido.',
        ];
    }

    protected function validarAdicional(Validator $validator): void
    {
        if (! $this->idTipoEvento()) {
            $validator->errors()->add('general', 'El tipo de evento "Tarjeta PARE" no está configurado. Contacte al administrador.');
        }
    }
}
