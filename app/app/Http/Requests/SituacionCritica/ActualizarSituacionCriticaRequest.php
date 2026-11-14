<?php

namespace App\Http\Requests\SituacionCritica;

use Illuminate\Foundation\Http\FormRequest;

/**
 * RF-15.2: edición manual. El evento asociado no se puede cambiar.
 * Los campos son parciales ('sometimes') para que la API acepte PATCH.
 */
class ActualizarSituacionCriticaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_trabajador' => ['sometimes', 'required', 'integer', 'exists:trabajadores,id_trabajador'],
            'id_supervisor' => ['sometimes', 'nullable', 'integer', 'exists:supervisores,id_trabajador'],
            'referencia' => ['sometimes', 'required', 'string', 'max:255'],
            'condicion' => ['sometimes', 'required', 'integer', 'between:1,10'],
        ];
    }

    public function messages(): array
    {
        return [
            'exists' => 'El registro seleccionado no es válido.',
            'required' => 'Este campo es obligatorio.',
            'referencia.max' => 'La referencia no puede superar los 255 caracteres.',
            'condicion.between' => 'La condición debe ser un valor del catálogo PARE (1 a 10).',
            'condicion.integer' => 'La condición debe ser un valor del catálogo PARE (1 a 10).',
        ];
    }
}
