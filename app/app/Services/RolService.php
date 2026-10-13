<?php

namespace App\Services;

use App\DataTransferObjects\RolData;
use App\Models\Permiso;
use App\Models\Rol;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class RolService
{
    public function listarConPermisos(): Collection
    {
        return Rol::with('permisos')->latest('id_rol')->get();
    }

    public function obtenerConPermisos(Rol $rol): Rol
    {
        return $rol->load('permisos');
    }

    public function listarPermisosDisponibles(): Collection
    {
        return Permiso::select('id_permiso', 'nombre')->get();
    }

    public function crear(RolData $datos): Rol
    {
        return DB::transaction(function () use ($datos) {
            $rol = Rol::create(['nombre' => $datos->nombre]);

            $rol->permisos()->sync($datos->permisos);

            return $rol;
        });
    }

    public function actualizar(Rol $rol, RolData $datos): Rol
    {
        return DB::transaction(function () use ($rol, $datos) {
            $rol->nombre = $datos->nombre;
            $rol->save();

            $rol->permisos()->sync($datos->permisos);

            return $rol;
        });
    }

    public function eliminar(Rol $rol): void
    {
        DB::transaction(function () use ($rol) {
            $rol->permisos()->detach();
            $rol->usuarios()->detach();
            $rol->delete();
        });
    }
}