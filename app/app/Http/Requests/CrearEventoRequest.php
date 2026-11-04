<?php

namespace App\Http\Requests;

use App\DataTransferObjects\CrearEventoData;
use App\Models\Area;
use App\Models\Proyecto;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CrearEventoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $esParaMi = $this->boolean('es_para_mi', true);

        // El área es obligatoria solo si la faena del proyecto tiene áreas definidas.
        $idFaena = Proyecto::whereKey($this->integer('id_proyecto'))->value('id_faena');
        $faenaConAreas = $idFaena && Area::where('id_faena', $idFaena)->exists();

        return [
            'id_area' => [
                $faenaConAreas ? 'required' : 'nullable',
                'integer',
                Rule::exists('areas', 'id_area')->where('id_faena', $idFaena),
            ],
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
                'max:100',
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
            'id_area.required' => 'Debe seleccionar el área donde ocurrió el evento.',
            'id_area.exists' => 'El área seleccionada no pertenece a la faena del proyecto.',
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
