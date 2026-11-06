<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IntravaReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $proyecto = $this->resource->relationLoaded('proyecto')
            ? $this->resource->getRelation('proyecto')
            : ($this->resource->relationLoaded('proyectoLocal')
                ? $this->resource->getRelation('proyectoLocal')
                : null);

        return [
            ...$this->resource->toArray(),
            'proyecto_local' => $proyecto,
        ];
    }
}
