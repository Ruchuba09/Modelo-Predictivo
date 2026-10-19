<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartamentoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_departamento'    => $this->id_departamento,
            'nombre'             => $this->nombre,
            'descripcion'        => $this->descripcion,
            'estado'             => $this->estado,
            'trabajadores_count' => $this->whenCounted('trabajadores'),
        ];
    }
}