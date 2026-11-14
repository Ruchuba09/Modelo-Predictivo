<?php

namespace App\Http\Requests;

use App\DataTransferObjects\RolData;
use App\Models\Rol;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/** RF-19 (registrar) y RF-20 (modificar) Rol. El acceso lo controla el middleware permission:roles.gestionar. */
class RolRequest extends FormRequest
{
    public const MENSAJE_DUPLICADO = 'Ya existe un rol con ese nombre.';

    public const MENSAJE_RESERVADO = 'El nombre ingresado está reservado por el sistema.';

    public const MENSAJE_ROL_SISTEMA = 'Este rol es parte del sistema y no se puede cambiar su nombre ni su estado.';

    public const MENSAJE_REGISTRO_INVALIDO = 'El registro seleccionado no es válido.';

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('estado')) {
            $this->merge(['estado' => Rol::ESTADO_ACTIVO]);
        }
    }

    private function rolEditado(): ?Rol
    {
        $rol = $this->route('rol');

        return $rol instanceof Rol ? $rol : null;
    }

    public function rules(): array
    {
        $rol = $this->rolEditado();

        return [
            'nombre' => [
                'bail',
                'required',
                'string',
                'max:100',
                // Único sin distinguir mayúsculas (RF-19.3.1).
                function (string $campo, mixed $valor, \Closure $falla) use ($rol) {
                    $existe = Rol::query()
                        ->whereRaw('LOWER(TRIM(nombre)) = ?', [mb_strtolower(trim($valor))])
                        ->when($rol, fn ($q) => $q->whereKeyNot($rol->getKey()))
                        ->exists();
                    if ($existe) {
                        $falla(self::MENSAJE_DUPLICADO);
                    }
                },
                // Un alias como "admin" daría el acceso de un rol del sistema (RF-19.3.2).
                function (string $campo, mixed $valor, \Closure $falla) use ($rol) {
                    if (Rol::nombreDeSistema($valor) && ! $rol?->es_sistema) {
                        $falla(self::MENSAJE_RESERVADO);
                    }
                },
            ],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'estado' => ['required', Rule::in(Rol::ESTADOS)],
            'permisos' => ['nullable', 'array'],
            'permisos.*' => ['integer', 'distinct', 'exists:usuarios.permisos,id_permiso'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'Debe ingresar el nombre del rol.',
            'nombre.string' => 'El nombre no es válido.',
            'nombre.max' => 'El nombre no puede superar los 100 caracteres.',
            'descripcion.string' => 'La descripción no es válida.',
            'descripcion.max' => 'La descripción no puede superar los 500 caracteres.',
            'estado.required' => 'Debe seleccionar el estado.',
            'estado.in' => 'El estado debe ser activo o inactivo.',
            'permisos.array' => self::MENSAJE_REGISTRO_INVALIDO,
            'permisos.*.integer' => self::MENSAJE_REGISTRO_INVALIDO,
            'permisos.*.distinct' => 'Un permiso está repetido.',
            'permisos.*.exists' => self::MENSAJE_REGISTRO_INVALIDO,
        ];
    }

    public function after(): array
    {
        return [
            // RF-20.3.3: los roles del sistema conservan su nombre y su estado.
            function (Validator $validator) {
                $rol = $this->rolEditado();
                if (! $rol?->es_sistema || $validator->errors()->isNotEmpty()) {
                    return;
                }
                if (trim((string) $this->input('nombre')) !== $rol->nombre) {
                    $validator->errors()->add('nombre', self::MENSAJE_ROL_SISTEMA);
                }
                if ($this->input('estado') !== Rol::ESTADO_ACTIVO) {
                    $validator->errors()->add('estado', self::MENSAJE_ROL_SISTEMA);
                }
            },
        ];
    }

    public function toData(): RolData
    {
        return RolData::fromArray($this->validated());
    }
}
