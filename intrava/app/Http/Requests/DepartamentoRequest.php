<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DepartamentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'nombre'      => [$required, 'string', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'estado'      => ['nullable', 'string', 'max:30'],
        ];
    }
}
