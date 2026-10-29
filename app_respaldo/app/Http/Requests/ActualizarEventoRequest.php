<?php

namespace App\Http\Requests;

use App\DataTransferObjects\ActualizarEventoData;
use Illuminate\Foundation\Http\FormRequest;

class ActualizarEventoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
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
        ];
    }

    public function toData(): ActualizarEventoData
    {
        return ActualizarEventoData::fromArray(
            $this->validated()
        );
    }
}
