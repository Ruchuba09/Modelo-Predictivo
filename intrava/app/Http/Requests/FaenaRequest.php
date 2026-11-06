<?php

namespace App\Http\Requests;

use App\DataTransferObjects\FaenaData;
use App\Models\Faena;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FaenaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Faena|null $faena */
        $faena = $this->route('faena');

        return [
            'codigo_faena' => [
                'required',
                'string',
                'max:50',
                Rule::unique('faenas', 'codigo_faena')
                    ->ignore($faena?->id_faena, 'id_faena'),
            ],
            'nombre' => [
                'required',
                'string',
                'max:255',
            ],
        ];
    }

    public function toData(): FaenaData
    {
        return FaenaData::fromArray($this->validated());
    }
}
