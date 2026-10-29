<?php

namespace App\Http\Requests;

use App\DataTransferObjects\ProyectoData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProyectoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // En actualizaciones los campos obligatorios solo se validan si vienen en la petición.
        $obligatorio = $this->isMethod('POST') ? 'required' : 'sometimes|required';

        return [
            'id_faena' => [$obligatorio, 'integer', 'exists:faenas,id_faena'],
            'id_cliente' => [$obligatorio, 'integer', 'exists:clientes,id_cliente'],
            'nombre' => [$obligatorio, 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'ubicacion' => ['nullable', 'string', 'max:255'],
            'id_proyecto_intrava' => [
                'nullable',
                'integer',
                'min:1',
                Rule::unique('proyectos', 'id_proyecto_intrava')
                    ->ignore($this->route('proyecto')?->id_proyecto, 'id_proyecto'),
            ],
            'centro_costo' => ['nullable', 'string', 'max:50'],
            'alias' => ['nullable', 'string', 'max:255'],
            'num_contrato' => ['nullable', 'string', 'max:100'],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_termino' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'estado' => [$obligatorio, 'string', 'max:30'],
        ];
    }

    public function toData(): ProyectoData
    {
        return ProyectoData::fromArray($this->validated());
    }
}
