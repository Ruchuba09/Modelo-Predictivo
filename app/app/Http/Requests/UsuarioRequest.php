<?php

namespace App\Http\Requests;

use App\DataTransferObjects\UsuarioData;
use App\Models\Rol;
use App\Models\Trabajador;
use App\Models\User;
use App\Support\Rut;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * RF-27 (registrar) y RF-28 (modificar) Usuario. El acceso lo controla el
 * middleware permission:usuarios.gestionar. En la edición el RUT no cambia.
 */
class UsuarioRequest extends FormRequest
{
    public const MENSAJE_SIN_TRABAJADOR = 'No existe un trabajador con ese RUT.';

    public const MENSAJE_CON_CUENTA = 'Este trabajador ya tiene una cuenta.';

    public const MENSAJE_CORREO_DUPLICADO = 'Ya existe un usuario con ese correo electrónico.';

    public const MENSAJE_COMPLEJIDAD = 'La contraseña debe tener al menos una mayúscula, una minúscula y un dígito.';

    public const MENSAJE_SIN_ROLES = 'Debe asignar al menos un rol.';

    public const MENSAJE_ULTIMO_ROL = 'El usuario debe mantener al menos un rol asignado.';

    public const MENSAJE_ROL_INACTIVO = 'No se puede asignar un rol inactivo.';

    public const MENSAJE_REGISTRO_INVALIDO = 'El registro seleccionado no es válido.';

    public function authorize(): bool
    {
        return true;
    }

    private function usuarioEditado(): ?User
    {
        $usuario = $this->route('usuario');

        return $usuario instanceof User ? $usuario : null;
    }

    /** RF-27 E-1 y E-2: RUT sin puntos con guion; correo sin espacios y en minúsculas. */
    protected function prepareForValidation(): void
    {
        $normalizado = [];
        if (is_string($this->input('rut'))) {
            $normalizado['rut'] = Rut::clean($this->input('rut'));
        }
        if (is_string($this->input('email'))) {
            $normalizado['email'] = mb_strtolower(trim($this->input('email')));
        }
        $this->merge($normalizado);
    }

    public function rules(): array
    {
        $usuario = $this->usuarioEditado();

        $reglas = [
            'email' => [
                'bail', 'required', 'string', 'max:255', 'email',
                function (string $campo, mixed $valor, \Closure $falla) use ($usuario) {
                    $existe = User::query()
                        ->whereRaw('LOWER(email) = ?', [$valor])
                        ->when($usuario, fn ($q) => $q->whereKeyNot($usuario->getKey()))
                        ->exists();
                    if ($existe) {
                        $falla(self::MENSAJE_CORREO_DUPLICADO);
                    }
                },
            ],
            'password' => [
                $usuario ? 'nullable' : 'required',
                'bail', 'string', 'min:8', 'max:64',
                'regex:/\p{Lu}/u', 'regex:/\p{Ll}/u', 'regex:/\d/',
                'confirmed',
            ],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => [
                // Misma conexión que el modelo Rol, que usa también la regla siguiente.
                'bail', 'integer', 'distinct', Rule::exists(Rol::class, 'id_rol'),
                // RF-27.3.5: un rol inactivo no otorga acceso. Los que el usuario ya tenía se conservan.
                function (string $campo, mixed $valor, \Closure $falla) use ($usuario) {
                    $yaAsignado = $usuario?->roles()->whereKey($valor)->exists();
                    if (! $yaAsignado && Rol::whereKey($valor)->value('estado') !== Rol::ESTADO_ACTIVO) {
                        $falla(self::MENSAJE_ROL_INACTIVO);
                    }
                },
            ],
        ];

        // RF-28 E-1: el RUT identifica a la persona dueña de la cuenta y no se modifica.
        if (! $usuario) {
            $reglas['rut'] = [
                'bail', 'required', 'string', 'max:20',
                function (string $campo, mixed $valor, \Closure $falla) {
                    $trabajador = Trabajador::whereHas('persona', fn ($q) => $q->where('rut', $valor))->first();
                    if (! $trabajador) {
                        $falla(self::MENSAJE_SIN_TRABAJADOR);
                    } elseif (User::where('id_trabajador', $trabajador->id_trabajador)->exists()) {
                        $falla(self::MENSAJE_CON_CUENTA);
                    }
                },
            ];
        }

        return $reglas;
    }

    public function messages(): array
    {
        $sinRoles = $this->usuarioEditado() ? self::MENSAJE_ULTIMO_ROL : self::MENSAJE_SIN_ROLES;

        return [
            'rut.required' => 'Debe ingresar el RUT.',
            'rut.string' => 'El RUT no es válido.',
            'rut.max' => 'El RUT no puede superar los 20 caracteres.',
            'email.required' => 'Debe ingresar el correo electrónico.',
            'email.string' => 'El correo electrónico no es válido.',
            'email.max' => 'El correo electrónico no puede superar los 255 caracteres.',
            'email.email' => 'El correo electrónico no tiene un formato válido.',
            'password.required' => 'Debe ingresar la contraseña.',
            'password.string' => 'La contraseña no es válida.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.max' => 'La contraseña no puede superar los 64 caracteres.',
            'password.regex' => self::MENSAJE_COMPLEJIDAD,
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',
            'roles.required' => $sinRoles,
            'roles.array' => self::MENSAJE_REGISTRO_INVALIDO,
            'roles.min' => $sinRoles,
            'roles.*.integer' => self::MENSAJE_REGISTRO_INVALIDO,
            'roles.*.distinct' => 'Un rol está repetido.',
            'roles.*.exists' => self::MENSAJE_REGISTRO_INVALIDO,
        ];
    }

    public function toData(): UsuarioData
    {
        return UsuarioData::fromArray($this->validated());
    }
}
