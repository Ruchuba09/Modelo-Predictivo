<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $area = $this->route('area');

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
                    ->where('id_faena', $this->input('id_faena'))
                    ->ignore($area?->id_area, 'id_area'),
            ],
            'descripcion' => [
                'nullable',
                'string',
            ],
        ];
    }
}