<?php

namespace App\Http\Services;

use App\DataTransferObjects\PermisoData;
use App\Models\Permiso;
use Illuminate\Database\Eloquent\Collection;

class PermisoService
{
    public function listarConRoles(): Collection
    {
        return Permiso::with('roles')->orderBy('id_permiso', 'desc')->get();
    }

    public function obtenerConRoles(Permiso $permiso): Permiso
    {
        return $permiso->load('roles');
    }

    public function crear(PermisoData $datos): Permiso
    {
        return Permiso::create($datos->toArray());
    }

    public function actualizar(Permiso $permiso, PermisoData $datos): Permiso
    {
        $permiso->update($datos->toArray());

        return $permiso;
    }

    public function eliminar(Permiso $permiso): void
    {
        $permiso->roles()->detach();
        $permiso->delete();
    }
}