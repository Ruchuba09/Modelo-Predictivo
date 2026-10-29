<?php

namespace App\Http\Requests;

use App\Models\Persona;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PersonaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // las Policies llegan en la Fase 4
    }

    public function rules(): array
    {
        $persona = $this->route('persona');

        return [
            // Rule::unique(Persona::class) toma tabla y conexión desde el modelo
            'rut'       => ['required', 'string', 'max:12',
                            Rule::unique(Persona::class, 'rut')->ignore($persona?->id_persona, 'id_persona')],
            'nombre_1'   => ['required', 'string', 'max:100'],
            'nombre_2'   => ['nullable', 'string', 'max:100'],
            'apellido_1' => ['required', 'string', 'max:100'],
            'apellido_2' => ['nullable', 'string', 'max:100'],
        ];
    }
}