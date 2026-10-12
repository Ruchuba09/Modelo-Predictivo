<?php

namespace App\Http\Requests;

use App\DataTransferObjects\PermisoData;
use App\Models\Permiso;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PermisoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Permiso|null $permiso */
        $permiso = $this->route('permiso');

        return [
            'nombre' => [
                'required',
                'string',
                Rule::unique('usuarios.permisos', 'nombre')->ignore($permiso?->id_permiso, 'id_permiso'),
            ],
            'nivel' => ['nullable', 'string'],
        ];
    }

    public function toData(): PermisoData
    {
        return PermisoData::fromArray($this->validated());
    }
}