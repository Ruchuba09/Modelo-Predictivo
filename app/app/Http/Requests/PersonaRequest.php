<?php

namespace App\Http\Requests;

use App\DataTransferObjects\PersonaData;
use App\Models\Persona;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PersonaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Persona|null $persona */
        $persona = $this->route('persona');

        return [
            'rut' => [
                'required',
                'string',
                'max:20',
                Rule::unique('personas', 'rut')->ignore($persona?->id_persona, 'id_persona'),
            ],
            'nombre_1' => ['required', 'string', 'max:100'],
            'nombre_2' => ['nullable', 'string', 'max:100'],
            'apellido_1' => ['required', 'string', 'max:100'],
            'apellido_2' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function toData(): PersonaData
    {
        return PersonaData::fromArray($this->validated());
    }
}