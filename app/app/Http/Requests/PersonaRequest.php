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

    /** RUT sin puntos, con guion y K mayúscula, como lo buscan RF-27 E-1 y RF-31.2. */
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('rut'))) {
            $this->merge(['rut' => \App\Support\Rut::clean($this->input('rut'))]);
        }
    }

    public function rules(): array
    {
        $persona = $this->route('persona');

        return [
            // Rule::unique(Persona::class) toma tabla y conexión desde el modelo
            'rut'       => ['required', 'string', 'max:20',
                            Rule::unique(Persona::class, 'rut')->ignore($persona?->id_persona, 'id_persona')],
            'nombre_1'   => ['required', 'string', 'max:100'],
            'nombre_2'   => ['nullable', 'string', 'max:100'],
            'apellido_1' => ['required', 'string', 'max:100'],
            'apellido_2' => ['nullable', 'string', 'max:100'],
        ];
    }
}
