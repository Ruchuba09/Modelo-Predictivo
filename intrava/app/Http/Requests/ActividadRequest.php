<?php

namespace App\Http\Requests;

use App\DataTransferObjects\ActividadData;
use Illuminate\Foundation\Http\FormRequest;

class ActividadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'id_asignacion' => [$required, 'integer', 'exists:asignaciones,id_asignacion'],
            'nombre' => [$required, 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_termino' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'estado' => [$required, 'string', 'max:30'],
            'id_riesgo_critico' => ['nullable', 'integer', 'exists:cat_riesgo_critico,id_riesgo_critico'],
        ];
    }

    public function toData(): ActividadData
    {
        return ActividadData::fromArray($this->validated());
    }
}
