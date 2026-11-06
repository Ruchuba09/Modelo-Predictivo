<?php

namespace App\Http\Requests;

use App\DataTransferObjects\CerrarEventoData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;

class CerrarEventoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $evento = $this->route('evento');
        $conDetencion = in_array($evento?->tipo_detencion, ['parcial', 'total'], true);

        return [
            // No se reinicia sin dejar constancia de cuándo se reanudó el trabajo.
            'fecha_reinicio' => [
                $conDetencion ? 'required' : 'nullable',
                'date',
                'before:+1 day',
                // La base de datos también lo exige; así se responde con un error claro.
                function (string $campo, mixed $valor, \Closure $falla) use ($evento) {
                    if ($evento?->fecha_detencion && Carbon::parse($valor)->lt($evento->fecha_detencion)) {
                        $falla('El reinicio no puede ser anterior a la detención ('.$evento->fecha_detencion->toIso8601String().').');
                    }
                },
            ],
            'id_clasificacion_incidente' => ['nullable', 'integer', 'exists:cat_clasificacion_incidente,id_clasificacion_incidente'],
            'id_severidad' => ['nullable', 'integer', 'exists:cat_severidad,id_severidad'],
            'id_potencial_severidad' => ['nullable', 'integer', 'exists:cat_severidad,id_severidad'],
            'id_causa_inmediata' => ['nullable', 'integer', 'exists:cat_causa,id_causa'],
            'id_causa_basica' => ['nullable', 'integer', 'exists:cat_causa,id_causa'],
            'justificacion' => [
                'required',
                'string',
                'max:500',
            ],
            'evidencia_cierre' => [
                'nullable',
                'array',
                'max:3',
            ],
            'evidencia_cierre.*' => [
                'file',
                'mimes:jpg,jpeg,png,pdf,doc,docx',
                'max:5120',
            ],
        ];
    }

    public function toData(): CerrarEventoData
    {
        $datos = $this->validated();

        $datos['evidencia_cierre'] =
            $this->file('evidencia_cierre', []);

        return CerrarEventoData::fromArray($datos);
    }
}
