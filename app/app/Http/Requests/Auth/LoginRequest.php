<?php

namespace App\Http\Requests\Auth;

use App\Services\AutenticacionService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/** RF-31: inicio de sesión del portal web. */
class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rut' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'remember' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return self::mensajes();
    }

    /** RF-31.2.1: mensajes comunes al portal web y a la API. */
    public static function mensajes(): array
    {
        return [
            'rut.required' => 'Debe ingresar su RUT o correo electrónico.',
            'rut.string' => 'El RUT o correo electrónico no es válido.',
            'rut.max' => 'El RUT o correo electrónico no puede superar los 255 caracteres.',
            'password.required' => 'Debe ingresar su contraseña.',
            'password.string' => 'La contraseña no es válida.',
            'password.max' => AutenticacionService::MENSAJE_CREDENCIALES,
            'remember.boolean' => 'El valor de "Recordarme" no es válido.',
            'device_name.string' => 'El nombre del dispositivo no es válido.',
            'device_name.max' => 'El nombre del dispositivo no puede superar los 100 caracteres.',
        ];
    }

    /**
     * RF-31.4 y RF-31.5: valida las credenciales e inicia la sesión web.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $usuario = app(AutenticacionService::class)->autenticar(
            (string) $this->input('rut'),
            (string) $this->input('password'),
            (string) $this->ip(),
        );

        Auth::guard('web')->login($usuario, $this->boolean('remember'));
    }
}
