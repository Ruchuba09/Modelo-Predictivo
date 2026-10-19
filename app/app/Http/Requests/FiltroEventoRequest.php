<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FiltroEventoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_proyecto' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:proyectos,id_proyecto',
            ],
            'condicion' => [
                'sometimes',
                'nullable',
                'integer',
                'between:1,10',
            ],
            'estado' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',
            ],
            'fecha_inicio' => [
                'sometimes',
                'nullable',
                'date',
            ],
            'fecha_fin' => [
                'sometimes',
                'nullable',
                'date',
                'after_or_equal:fecha_inicio',
            ],
        ];
    }

    public function filtros(): array
    {
        return $this->only([
            'id_proyecto',
            'condicion',
            'estado',
            'fecha_inicio',
            'fecha_fin',
        ]);
    }

    public function filtrosGrafico(): array
    {
        return $this->only([
            'id_proyecto',
            'fecha_inicio',
            'fecha_fin',
        ]);
    }
}
