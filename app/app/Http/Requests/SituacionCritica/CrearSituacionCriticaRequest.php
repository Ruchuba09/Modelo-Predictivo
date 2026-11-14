<?php

namespace App\Http\Requests\SituacionCritica;

use App\Models\Evento;
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
                    if ($mensaje = app(SituacionCriticaService::class)->motivoNoRegistrable(Evento::find($valor))) {
                        $falla($mensaje);
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'id_evento.required' => 'Debe seleccionar una Tarjeta PARE.',
            'id_evento.exists' => SituacionCriticaService::MENSAJE_REGISTRO_INVALIDO,
            'id_evento.integer' => SituacionCriticaService::MENSAJE_REGISTRO_INVALIDO,
        ];
    }

    public function idEvento(): int
    {
        return (int) $this->validated('id_evento');
    }
}
