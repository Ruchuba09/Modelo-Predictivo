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
            'id_trabajador' => $this->id_trabajador,
            'rut' => $this->trabajador?->persona?->rut,
            'email' => $this->email,
            'roles' => $this->roles->map(fn ($rol) => [
                'id_rol' => $rol->id_rol,
                'nombre' => $rol->nombre,
            ]),
            // Permisos efectivos (CA-1), solo para el propio usuario: evita
            // calcularlos por cada fila de un listado.
            'permisos' => $this->when(
                $request->user()?->is($this->resource),
                fn () => $this->permisosArray(),
            ),
        ];
    }
}
