<?php

namespace App\Http\Requests;

use App\DataTransferObjects\TrabajadorData;
use App\Models\Persona;
use App\Models\Trabajador;
use App\Support\Rut;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Catálogo de trabajadores. La cuenta de acceso (correo, contraseña y roles)
 * se administra en Usuarios (RF-27 a RF-30), no aquí.
 */
class TrabajadorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * El RUT se guarda sin puntos, con guion y K mayúscula, que es como lo
     * buscan el registro de usuarios (RF-27 E-1) y el inicio de sesión (RF-31.2).
     */
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('rut'))) {
            $this->merge(['rut' => Rut::clean($this->input('rut'))]);
        }
    }

    public function rules(): array
    {
        /** @var Trabajador|null $trabajador */
        $trabajador = $this->route('trabajador');

        return [
            'nombre_1' => ['required', 'string', 'max:100'],
            'nombre_2' => ['nullable', 'string', 'max:100'],
            'apellido_1' => ['required', 'string', 'max:100'],
            'apellido_2' => ['nullable', 'string', 'max:100'],
            'cargo' => ['required', 'string', 'max:100'],
            'estado' => ['nullable', 'string', 'max:30'],
            'id_tipo_trabajador' => ['required', 'string', 'in:obrero,supervisor,administrativo,jefe_zona'],
            'id_tipo_obrero' => [
                'nullable',
                'integer',
                'exists:tipo_obreros,id_tipo_obrero',
            ],
            'rut' => [
                'required',
                'string',
                'max:20',
                Rule::unique(Persona::class, 'rut')->ignore($trabajador?->id_persona, 'id_persona'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'rut.required' => 'Debe ingresar el RUT.',
            'rut.max' => 'El RUT no puede superar los 20 caracteres.',
            'rut.unique' => 'Ya existe una persona con ese RUT.',
        ];
    }

    public function toData(): TrabajadorData
    {
        return TrabajadorData::fromArray($this->validated());
    }
}
