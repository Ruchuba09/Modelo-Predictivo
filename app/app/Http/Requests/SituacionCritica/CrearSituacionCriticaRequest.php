<?php

namespace App\Http\Requests\SituacionCritica;

use App\Models\Evento;
use App\Models\SituacionCritica;
use App\Services\SituacionCriticaService;
use Illuminate\Foundation\Http\FormRequest;

/** RF-14.2: registro manual; solo se elige la Tarjeta PARE, el resto se copia de ella. */
class CrearSituacionCriticaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_evento' => [
                'bail',
                'required',
                'integer',
                'exists:eventos,id_evento',
                function (string $campo, mixed $valor, \Closure $falla) {
                    $idTipoPare = app(SituacionCriticaService::class)->idTipoPare();
                    if ((int) Evento::whereKey($valor)->value('id_tipo_evento') !== (int) $idTipoPare) {
                        $falla('El evento seleccionado no es una Tarjeta PARE.');
                    } elseif (SituacionCritica::where('id_evento', $valor)->exists()) {
                        $falla('La Tarjeta PARE ya tiene una Situación Crítica asociada.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'id_evento.required' => 'Debe seleccionar una Tarjeta PARE.',
            'id_evento.exists' => 'El registro seleccionado no es válido.',
        ];
    }

    public function evento(): Evento
    {
        return Evento::findOrFail($this->integer('id_evento'));
    }
}
