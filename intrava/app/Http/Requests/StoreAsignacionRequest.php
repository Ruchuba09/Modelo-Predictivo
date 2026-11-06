<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAsignacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_proyecto' => [
                'required',
                'integer',
                'exists:proyectos,id_proyecto',
            ],
            'id_cuadrilla' => [
                'required',
                'integer',
                'exists:cuadrillas,id_cuadrilla',
            ],
            'fecha_inicio' => [
                'required',
                'date',
            ],
            'fecha_termino' => [
                'nullable',
                'date',
                'after_or_equal:fecha_inicio',
            ],
        ];
    }
}