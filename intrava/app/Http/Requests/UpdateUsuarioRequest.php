<?php

namespace App\Http\Requests;

use App\DataTransferObjects\UsuarioData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Edición de usuario; lo usan UserController (web) y Api\V1\UsuarioController. */
class UpdateUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // El acceso lo controla el middleware role:Administrador.
    }

    public function rules(): array
    {
        $usuario = $this->route('usuario');

        return [
            'rut' => ['required', 'string', 'max:20', 'exists:personas,rut'],
            'email' => [
                'required', 'email', 'max:255',
                Rule::unique('usuarios.users', 'email')->ignore($usuario?->id_user, 'id_user'),
            ],
            'password' => ['nullable', 'confirmed', 'min:8'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['integer', 'distinct', 'exists:usuarios.roles,id_rol'],
        ];
    }

    public function toData(): UsuarioData
    {
        return UsuarioData::fromArray($this->validated());
    }
}
