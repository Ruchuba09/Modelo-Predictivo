<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Usuario para el portal (RF-29) y la API de consulta. */
class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $persona = $this->trabajador?->persona;

        return [
            'id_user' => $this->id_user,
            'id_trabajador' => $this->id_trabajador,
            'rut' => $persona?->rut,
            'nombre' => $persona
                ? trim(implode(' ', array_filter([$persona->nombre_1, $persona->nombre_2, $persona->apellido_1, $persona->apellido_2])))
                : null,
            'email' => $this->email,
            'roles' => $this->roles->map(fn ($rol) => [
                'id_rol' => $rol->id_rol,
                'nombre' => $rol->nombre,
                'estado' => $rol->estado,
            ]),
            // RF-30.2: eventos que perderán su autor si se elimina la cuenta.
            'eventos_registrados_count' => $this->whenCounted('eventosRegistrados'),
            'es_propio' => (bool) $request->user()?->is($this->resource),
            // Permisos efectivos (CA-1), solo para el propio usuario: evita
            // calcularlos por cada fila de un listado.
            'permisos' => $this->when(
                $request->user()?->is($this->resource),
                fn () => $this->permisosArray(),
            ),
        ];
    }
}
