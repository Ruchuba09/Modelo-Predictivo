<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FiltroEventoRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'id_evento' => $this->input('id_evento', $this->input('id')),
            'fecha_inicio' => $this->input('fecha_inicio', $this->input('desde')),
            'fecha_fin' => $this->input('fecha_fin', $this->input('hasta')),
        ]);
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_evento' => ['sometimes', 'nullable', 'regex:/^[0-9]+$/'],
            'id' => ['sometimes', 'nullable', 'regex:/^[0-9]+$/'],
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
            'desde' => ['sometimes', 'nullable', 'date'],
            'hasta' => ['sometimes', 'nullable', 'date'],
        ];
    }

    public function filtros(): array
    {
        return array_filter([
            'id_evento' => $this->input('id_evento'),
            'id_proyecto' => $this->input('id_proyecto'),
            'condicion' => $this->input('condicion'),
            'estado' => $this->input('estado'),
            'fecha_inicio' => $this->input('fecha_inicio'),
            'fecha_fin' => $this->input('fecha_fin'),
        ], static fn ($value) => $value !== null && $value !== '');
    }

    public function filtrosGrafico(): array
    {
        return array_filter([
            'id_proyecto' => $this->input('id_proyecto'),
            'fecha_inicio' => $this->input('fecha_inicio'),
            'fecha_fin' => $this->input('fecha_fin'),
        ], static fn ($value) => $value !== null && $value !== '');
    }
}
