<?php

namespace App\Http\Requests;

use App\DataTransferObjects\PermisoData;
use App\Models\Permiso;
use App\Support\Permisos;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * RF-23 (registrar) y RF-24 (modificar) Permiso. El acceso lo controla el
 * middleware permission:permisos.gestionar.
 */
class PermisoRequest extends FormRequest
{
    public const MENSAJE_DUPLICADO = 'Ya existe un permiso con ese nombre.';

    public const MENSAJE_FORMATO = 'El nombre solo puede contener letras minúsculas, números, puntos, guiones y guiones bajos, sin espacios.';

    public const MENSAJE_PERMISO_SISTEMA = 'Este permiso es parte del sistema y no se puede cambiar su nombre.';

    /** Identificador: segmentos de minúsculas o números unidos por ".", "-" o "_" (p. ej. eventos.ver). */
    public const FORMATO_NOMBRE = '/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/';

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('nombre'))) {
            $this->merge(['nombre' => trim($this->input('nombre'))]);
        }
    }

    private function permisoEditado(): ?Permiso
    {
        $permiso = $this->route('permiso');

        return $permiso instanceof Permiso ? $permiso : null;
    }

    public function rules(): array
    {
        $permiso = $this->permisoEditado();

        return [
            'nombre' => [
                'bail',
                'required',
                'string',
                'max:100',
                'regex:'.self::FORMATO_NOMBRE,
                // Único sin distinguir mayúsculas (RF-23.3.2): los nombres antiguos pueden tenerlas.
                function (string $campo, mixed $valor, \Closure $falla) use ($permiso) {
                    $existe = Permiso::query()
                        ->whereRaw('LOWER(TRIM(nombre)) = ?', [mb_strtolower($valor)])
                        ->when($permiso, fn ($q) => $q->whereKeyNot($permiso->getKey()))
                        ->exists();
                    if ($existe) {
                        $falla(self::MENSAJE_DUPLICADO);
                    }
                },
            ],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'nivel' => ['nullable', 'integer', Rule::in(array_keys(Permisos::NIVELES))],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'Debe ingresar el nombre del permiso.',
            'nombre.string' => 'El nombre no es válido.',
            'nombre.max' => 'El nombre no puede superar los 100 caracteres.',
            'nombre.regex' => self::MENSAJE_FORMATO,
            'descripcion.string' => 'La descripción no es válida.',
            'descripcion.max' => 'La descripción no puede superar los 500 caracteres.',
            'nivel.integer' => 'El nivel debe ser Básico, Intermedio o Crítico.',
            'nivel.in' => 'El nivel debe ser Básico, Intermedio o Crítico.',
        ];
    }

    public function after(): array
    {
        return [
            // RF-24.3.3: el código depende del nombre de los permisos del sistema.
            function (Validator $validator) {
                $permiso = $this->permisoEditado();
                if (! $permiso?->es_sistema || $validator->errors()->has('nombre')) {
                    return;
                }
                if ($this->input('nombre') !== $permiso->nombre) {
                    $validator->errors()->add('nombre', self::MENSAJE_PERMISO_SISTEMA);
                }
            },
        ];
    }

    public function toData(): PermisoData
    {
        return PermisoData::fromArray($this->validated());
    }
}
