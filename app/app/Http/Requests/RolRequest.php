<?php

namespace App\Http\Requests;

use App\DataTransferObjects\RolData;
use App\Models\Rol;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Rol|null $rol */
        $rol = $this->route('rol');

        return [
            'nombre' => [
                'required',
                'string',
                Rule::unique('usuarios.roles', 'nombre')->ignore($rol?->id_rol, 'id_rol'),
            ],
            'permisos' => ['nullable', 'array'],
            'permisos.*' => ['exists:usuarios.permisos,id_permiso'],
        ];
    }

    public function toData(): RolData
    {
        return RolData::fromArray($this->validated());
    }
}