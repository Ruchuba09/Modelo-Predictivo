<?php

namespace App\Http\Requests;

use App\DataTransferObjects\CrearEventoData;
use App\Models\Area;
use App\Models\Proyecto;
use App\Models\TipoEvento;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

/**
 * Reglas comunes al registro de una Tarjeta PARE (RF-9) y de un evento de
 * otro tipo (RF-10): quién es el reportado, dónde ocurrió y la evidencia.
 */
abstract class RegistrarEventoRequest extends FormRequest
{
    public const MENSAJE_REGISTRO_INVALIDO = 'El registro seleccionado no es válido.';

    public const MENSAJE_SIN_TRABAJADOR = 'Su usuario no tiene un trabajador asociado, debe reportar para un tercero.';

    /** Mensaje general que acompaña a cualquier error de validación. */
    abstract protected function mensajeGeneral(): string;

    /** Reglas propias de cada formulario, que se suman a las comunes. */
    abstract protected function reglasPropias(): array;

    /** Tipo de evento que se registra. */
    abstract protected function idTipoEvento(): ?int;

    public function authorize(): bool
    {
        return true;
    }

    protected function idTipoPare(): ?int
    {
        return TipoEvento::where('nombre', 'Tarjeta PARE')->value('id_tipo_evento');
    }

    public function rules(): array
    {
        $esParaMi = $this->boolean('es_para_mi', true);

        // El área es obligatoria solo si la faena del proyecto tiene áreas definidas.
        $idFaena = Proyecto::whereKey($this->integer('id_proyecto'))->value('id_faena');
        $faenaConAreas = $idFaena && Area::where('id_faena', $idFaena)->exists();

        return [
            'id_proyecto' => ['required', 'integer', 'exists:proyectos,id_proyecto'],
            'es_para_mi' => ['nullable', 'boolean'],
            'id_trabajador' => [
                $esParaMi ? 'nullable' : 'required',
                'integer',
                'exists:trabajadores,id_trabajador',
            ],
            'id_area' => [
                'bail',
                $faenaConAreas ? 'required' : 'nullable',
                'integer',
                'exists:areas,id_area',
                function (string $campo, mixed $valor, \Closure $falla) use ($idFaena) {
                    if ($idFaena && ! Area::whereKey($valor)->where('id_faena', $idFaena)->exists()) {
                        $falla('El área seleccionada no pertenece a la faena del proyecto.');
                    }
                },
            ],
            'id_actividad' => [
                'bail',
                'nullable',
                'integer',
                'exists:actividades,id_actividad',
                function (string $campo, mixed $valor, \Closure $falla) {
                    $delProyecto = DB::table('actividades as ac')
                        ->join('asignaciones as a', 'a.id_asignacion', '=', 'ac.id_asignacion')
                        ->where('ac.id_actividad', $valor)
                        ->where('a.id_proyecto', $this->integer('id_proyecto'))
                        ->exists();
                    if (! $delProyecto) {
                        $falla('La actividad seleccionada no pertenece al proyecto.');
                    }
                },
            ],
            'referencia' => ['required', 'string', 'max:255'],
            'descripcion' => ['required', 'string', 'max:500'],
            'fecha_ocurrencia' => [
                'nullable',
                'date',
                'before_or_equal:'.now()->addDay()->endOfDay()->toDateTimeString(),
            ],
            // Sin fecha de ocurrencia no hay de dónde sacar el turno: se descarta.
            'id_turno' => ['exclude_without:fecha_ocurrencia', 'nullable', 'integer', 'exists:cat_turno,id_turno'],
            'id_potencial_severidad' => ['nullable', 'integer', 'exists:cat_severidad,id_severidad'],
            'dia_ciclo' => ['nullable', 'integer', 'between:1,30'],
            'evidencia' => ['nullable', 'array', 'max:3'],
            'evidencia.*' => ['file', 'mimes:jpg,jpeg,png,pdf,doc,docx', 'max:5120'],
            ...$this->reglasPropias(),
        ];
    }

    public function messages(): array
    {
        return [
            'exists' => self::MENSAJE_REGISTRO_INVALIDO,
            'required' => 'Este campo es obligatorio.',
            'id_proyecto.required' => 'Debe seleccionar un proyecto.',
            'id_area.required' => 'Debe seleccionar el área donde ocurrió el evento.',
            'id_trabajador.required' => 'Debe seleccionar a la persona reportada.',
            'referencia.max' => 'La referencia no puede superar los 255 caracteres.',
            'descripcion.max' => 'La descripción no puede superar los 500 caracteres.',
            'fecha_ocurrencia.date' => 'La fecha de ocurrencia no es válida.',
            'fecha_ocurrencia.before_or_equal' => 'La fecha de ocurrencia no puede ser posterior al día siguiente a la fecha actual.',
            'dia_ciclo.between' => 'El día de ciclo debe estar entre 1 y 30.',
            'evidencia.max' => 'Puede adjuntar un máximo de 3 archivos.',
            'evidencia.*.mimes' => 'Los archivos deben ser jpg, jpeg, png, pdf, doc o docx.',
            'evidencia.*.max' => 'Cada archivo puede pesar como máximo 5 MB.',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                // users.id_trabajador es NOT NULL, así que no debería pasar;
                // se deja como resguardo ante datos inconsistentes.
                if ($this->boolean('es_para_mi', true) && ! $this->user()?->trabajador) {
                    $validator->errors()->add('es_para_mi', self::MENSAJE_SIN_TRABAJADOR);
                }
                $this->validarAdicional($validator);
                if ($validator->errors()->isNotEmpty()) {
                    $validator->errors()->add('general', $this->mensajeGeneral());
                }
            },
        ];
    }

    /** Validaciones que dependen de cada formulario; se ejecutan tras las reglas. */
    protected function validarAdicional(Validator $validator): void {}

    public function toData(): CrearEventoData
    {
        $datos = $this->validated();

        $datos['id_tipo_evento'] = $this->idTipoEvento();
        $datos['evidencia'] = $this->file('evidencia', []);

        return CrearEventoData::fromArray($datos);
    }
}
