<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_user' => $this->id_user,
            'rut' => $this->rut,
            'email' => $this->email,
            'roles' => $this->roles->map(fn ($rol) => [
                'id_rol' => $rol->id_rol,
                'nombre' => $rol->nombre,
            ]),
        ];
    }
}