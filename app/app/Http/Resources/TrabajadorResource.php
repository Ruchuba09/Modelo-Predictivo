<?php

namespace App\Http\Resources;

use App\Services\TrabajadorService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrabajadorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return app(TrabajadorService::class)->formatear($this->resource);
    }
}
