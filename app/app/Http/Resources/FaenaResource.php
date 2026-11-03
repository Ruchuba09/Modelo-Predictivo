<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FaenaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_faena'     => $this->id_faena,
            'codigo_faena' => $this->codigo_faena,
            'nombre'       => $this->nombre,
            'areas_count'  => $this->whenCounted('areas'),
        ];
    }
}