<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCuadrillaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $cuadrilla = $this->route('cuadrilla');

        return [
            'id_supervisor' => [
                'sometimes',
                'required',
                'integer',
                'exists:supervisores,id_trabajador',
                // Un supervisor lidera una sola cuadrilla.
                Rule::unique('cuadrillas', 'id_supervisor')->ignore($this->route('cuadrilla')?->id_cuadrilla, 'id_cuadrilla'),
            ],
            'id_jefe_zona' => [
                'nullable',
                'integer',
                'exists:jefes_zona,id_trabajador',
            ],
            'numero_cuadrilla' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('cuadrillas', 'numero_cuadrilla')
                    ->ignore($cuadrilla?->id_cuadrilla, 'id_cuadrilla'),
            ],
        ];
    }
}