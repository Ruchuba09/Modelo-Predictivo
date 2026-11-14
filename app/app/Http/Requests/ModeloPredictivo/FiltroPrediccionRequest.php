<?php

namespace App\Http\Requests\ModeloPredictivo;

use App\DataTransferObjects\FiltroPrediccionData;
use App\Enums\ObjetivoPrediccion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Filtros de las consultas del modelo predictivo. El acceso lo controla el middleware
 * permission:modelo-predictivo.ver; aquí solo se valida el objetivo, el plazo y el proyecto.
 */
class FiltroPrediccionRequest extends FormRequest
{
    public const MENSAJE_OBJETIVO = 'El objetivo debe ser incidentes reales, incidentes con lesión o todos los eventos.';

    public const MENSAJE_HORIZONTE = 'El plazo debe ser de 1, 2, 5, 7, 14, 21, 30, 60 o 90 días.';

    public const MENSAJE_PROYECTO = 'El proyecto seleccionado no existe.';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tipo_objetivo' => ['sometimes', 'string', Rule::enum(ObjetivoPrediccion::class)],
            'horizonte_dias' => ['sometimes', 'integer', Rule::in(FiltroPrediccionData::HORIZONTES_DIAS)],
            'id_proyecto' => ['sometimes', 'integer', 'min:1', Rule::exists('proyectos', 'id_proyecto')],
        ];
    }

    public function messages(): array
    {
        return [
            'tipo_objetivo.*' => self::MENSAJE_OBJETIVO,
            'horizonte_dias.*' => self::MENSAJE_HORIZONTE,
            'id_proyecto.*' => self::MENSAJE_PROYECTO,
        ];
    }

    public function toData(): FiltroPrediccionData
    {
        return FiltroPrediccionData::fromArray($this->validated());
    }
}
