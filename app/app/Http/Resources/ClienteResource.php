<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClienteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_cliente'   => $this->id_cliente,
            'rut'          => $this->rut,
            'razon_social' => $this->razon_social,
            'nombre'       => $this->nombre,
            'email'        => $this->email,
            'telefono'     => $this->telefono,
            'direccion'    => $this->direccion,
            'estado'       => $this->estado,
        ];
    }
}