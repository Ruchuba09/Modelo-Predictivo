<?php

namespace App\Http\Requests\Settings;

use App\Http\Requests\UsuarioRequest;
use Illuminate\Foundation\Http\FormRequest;

/**
 * "Mi perfil": el usuario solo cambia su correo, con las reglas de RF-27 E-2.
 * El RUT identifica a la persona dueña de la cuenta y no se modifica (RF-28).
 */
class ProfileUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => mb_strtolower(trim($this->input('email')))]);
        }
    }

    public function rules(): array
    {
        return [
            'email' => [
                'bail', 'required', 'string', 'max:255', 'email',
                function (string $campo, mixed $valor, \Closure $falla) {
                    if (UsuarioRequest::correoEnUso($valor, $this->user())) {
                        $falla(UsuarioRequest::MENSAJE_CORREO_DUPLICADO);
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Debe ingresar el correo electrónico.',
            'email.string' => 'El correo electrónico no es válido.',
            'email.max' => 'El correo electrónico no puede superar los 255 caracteres.',
            'email.email' => 'El correo electrónico no tiene un formato válido.',
        ];
    }
}
