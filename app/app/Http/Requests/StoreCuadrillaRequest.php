<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCuadrillaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_supervisor' => [
                'required',
                'integer',
                'exists:supervisores,id_trabajador',
            ],
            'numero_cuadrilla' => [
                'required',
                'string',
                'max:50',
                Rule::unique('cuadrillas', 'numero_cuadrilla'),
            ],
        ];
    }
}