<?php

namespace App\Http\Requests;

use App\Models\Faena;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Policies en la Fase 4
    }

    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'id_faena'    => [$required, 'integer', Rule::exists(Faena::class, 'id_faena')],
            'codigo_area' => [$required, 'string', 'max:20'],
            'descripcion' => ['nullable', 'string', 'max:255'],
        ];
    }
}