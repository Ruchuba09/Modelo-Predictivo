<?php

namespace App\Http\Requests;

use App\DataTransferObjects\TipoObreroData;
use Illuminate\Foundation\Http\FormRequest;

class TipoObreroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string'],
            'estado' => ['nullable', 'string', 'max:30'],
        ];
    }

    public function toData(): TipoObreroData
    {
        return TipoObreroData::fromArray($this->validated());
    }
    public function toArray(Request $request): array
    {
        return [
            'id_tipo_obrero' => $this->getKey(), // funciona sea cual sea el nombre real de la PK
            'nombre'         => $this->nombre,
            'descripcion'    => $this->descripcion,
            'estado'         => $this->estado,
        ];
    }
}