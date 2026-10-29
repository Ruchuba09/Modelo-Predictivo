<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PersonaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_persona'      => $this->id_persona,
            'rut'             => $this->rut,
            'nombre_1'        => $this->nombre_1,
            'nombre_2'        => $this->nombre_2,
            'apellido_1'      => $this->apellido_1,
            'apellido_2'      => $this->apellido_2,
            'nombre_completo' => collect([$this->nombre_1, $this->nombre_2, $this->apellido_1, $this->apellido_2])
                                    ->filter()->implode(' '),
        ];
    }
}