<?php

namespace App\Http\Requests;

use App\DataTransferObjects\CerrarEventoData;
use Illuminate\Foundation\Http\FormRequest;

class CerrarEventoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
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
