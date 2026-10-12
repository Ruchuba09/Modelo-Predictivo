<?php

namespace App\Http\Requests;

use App\DataTransferObjects\TrabajadorData;
use App\Models\Trabajador;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TrabajadorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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
            'id_tipo_trabajador' => ['required', 'string', 'in:obrero,supervisor,administrativo'],
            'id_tipo_obrero' => [
                'nullable',
                'required_if:id_tipo_trabajador,obrero',
                'integer',
                'exists:tipo_obreros,id_tipo_obrero',
            ],
            'rut' => [
                'required',
                'string',
                'max:20',
                Rule::unique('personas', 'rut')->ignore($trabajador?->id_persona, 'id_persona'),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($trabajador?->usuario?->id_user, 'id_user'),
            ],
        ];
    }

    public function toData(): TrabajadorData
    {
        return TrabajadorData::fromArray($this->validated());
    }
}