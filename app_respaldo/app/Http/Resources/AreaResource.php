<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AreaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_area'     => $this->id_area,
            'id_faena'    => $this->id_faena,
            'codigo_area' => $this->codigo_area,
            'descripcion' => $this->descripcion,
            'faena'       => new FaenaResource($this->whenLoaded('faena')),
        ];
    }
}