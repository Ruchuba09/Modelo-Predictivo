<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_faena' => [
                'required',
                'integer',
                'exists:faenas,id_faena',
            ],
            'codigo_area' => [
                'required',
                'string',
                'max:50',
                Rule::unique('areas', 'codigo_area')
                    ->where('id_faena', $this->input('id_faena')),
            ],
            'descripcion' => [
                'nullable',
                'string',
            ],
        ];
    }
}