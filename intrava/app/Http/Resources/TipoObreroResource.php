<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TipoObreroResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_tipo_obrero' => $this->id_tipo_obrero,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'estado' => $this->estado,
        ];
    }
}
