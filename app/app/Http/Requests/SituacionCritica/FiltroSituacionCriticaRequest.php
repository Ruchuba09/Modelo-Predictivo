<?php

namespace App\Http\Requests\SituacionCritica;

use Illuminate\Foundation\Http\FormRequest;

/** RF-16.3: filtros opcionales y combinables del listado. */
class FiltroSituacionCriticaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_trabajador' => ['nullable', 'integer', 'exists:trabajadores,id_trabajador'],
            'id_supervisor' => ['nullable', 'integer', 'exists:supervisores,id_trabajador'],
            'id_evento' => ['nullable', 'integer', 'exists:eventos,id_evento'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ];
    }

    public function messages(): array
    {
        return [
            'exists' => 'El registro seleccionado no es válido.',
            'integer' => 'El registro seleccionado no es válido.',
        ];
    }

    public function filtros(): array
    {
        return array_filter(
            $this->safe()->only(['id_trabajador', 'id_supervisor', 'id_evento']),
            fn ($valor) => $valor !== null && $valor !== '',
        );
    }
}
