<?php

namespace App\Http\Requests;

use App\DataTransferObjects\CrearEventoData;
use App\Models\Area;
use App\Models\Proyecto;
use App\Models\TipoEvento;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
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

        $idTipoPare = TipoEvento::where('nombre', 'Tarjeta PARE')->value('id_tipo_evento');

        return [
            'id_severidad' => ['nullable', 'integer', 'exists:cat_severidad,id_severidad'],
            'id_potencial_severidad' => ['nullable', 'integer', 'exists:cat_severidad,id_severidad'],
            'fecha_ocurrencia' => ['nullable', 'date', 'before:+1 day'],
            'id_turno' => ['nullable', 'integer', 'exists:cat_turno,id_turno'],
            'id_categoria_evento' => ['nullable', 'integer', 'exists:cat_categoria_evento,id_categoria_evento'],
            'id_clasificacion_incidente' => ['nullable', 'integer', 'exists:cat_clasificacion_incidente,id_clasificacion_incidente'],
            'tipo_detencion' => ['nullable', 'string', Rule::in(['sin_detencion', 'parcial', 'total'])],
            'dia_ciclo' => ['nullable', 'integer', 'between:1,30'],
            'id_actividad' => [
                'nullable',
                'integer',
                function (string $campo, mixed $valor, \Closure $falla) {
                    $delProyecto = DB::table('actividades as ac')
                        ->join('asignaciones as a', 'a.id_asignacion', '=', 'ac.id_asignacion')
                        ->where('ac.id_actividad', $valor)
                        ->where('a.id_proyecto', $this->integer('id_proyecto'))
                        ->exists();
                    if (! $delProyecto) {
                        $falla('La actividad no pertenece al proyecto seleccionado.');
                    }
                },
            ],
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
                Rule::requiredIf((int) $this->input('id_tipo_evento') === (int) $idTipoPare),
                'nullable',
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
