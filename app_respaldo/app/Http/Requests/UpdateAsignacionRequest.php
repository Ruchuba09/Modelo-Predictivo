<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAsignacionRequest extends FormRequest
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
                'required',
                'integer',
                'exists:proyectos,id_proyecto',
            ],
            'id_cuadrilla' => [
                'sometimes',
                'required',
                'integer',
                'exists:cuadrillas,id_cuadrilla',
            ],
            'fecha_inicio' => [
                'sometimes',
                'required',
                'date',
            ],
            'fecha_termino' => [
                'sometimes',
                'nullable',
                'date',
                'after_or_equal:fecha_inicio',
            ],
        ];
    }
}