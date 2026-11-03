<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActividadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_actividad' => $this->id_actividad,
            'id_asignacion' => $this->id_asignacion,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'fecha_inicio' => $this->fecha_inicio?->toDateString(),
            'fecha_termino' => $this->fecha_termino?->toDateString(),
            'estado' => $this->estado,
            'fecha_creacion' => $this->fecha_creacion?->toISOString(),
            'fecha_actualizacion' => $this->fecha_actualizacion?->toISOString(),
            'asignacion' => $this->whenLoaded('asignacion'),
        ];
    }
}
