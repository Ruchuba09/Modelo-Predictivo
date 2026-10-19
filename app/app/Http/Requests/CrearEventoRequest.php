<?php

namespace App\Http\Requests;

use App\DataTransferObjects\CrearEventoData;
use Illuminate\Foundation\Http\FormRequest;

class CrearEventoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $esParaMi = $this->boolean('es_para_mi', true);

        return [
            'id_tipo_evento' => [
                'required',
                'integer',
                'exists:tipo_eventos,id_tipo_evento',
            ],
            'condicion' => [
                'required',
                'integer',
                'between:1,10',
            ],
            'descripcion' => [
                'required',
                'string',
                'max:500',
            ],
            'referencia' => [
                'required',
                'string',
                'max:255',
            ],
            'id_proyecto' => [
                'required',
                'integer',
                'exists:proyectos,id_proyecto',
            ],
            'es_para_mi' => [
                'nullable',
                'boolean',
            ],
            'id_trabajador' => $esParaMi
                ? [
                    'nullable',
                    'integer',
                    'exists:trabajadores,id_trabajador',
                ]
                : [
                    'required',
                    'integer',
                    'exists:trabajadores,id_trabajador',
                ],
            'severidad' => [
                'nullable',
                'string',
                'max:50',
            ],
            'evidencia' => [
                'nullable',
                'array',
                'max:3',
            ],
            'evidencia.*' => [
                'file',
                'mimes:jpg,jpeg,png,pdf,doc,docx',
                'max:5120',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'id_proyecto.required' => 'Debe seleccionar un proyecto.',
            'id_trabajador.required' => 'Debe seleccionar a la persona reportada.',
            'condicion.between' => 'Por favor seleccione una condición válida.',
        ];
    }

    public function toData(): CrearEventoData
    {
        $datos = $this->validated();

        $datos['evidencia'] = $this->file('evidencia', []);

        return CrearEventoData::fromArray($datos);
    }
}
