<?php

namespace App\Services;

use App\DataTransferObjects\RolData;
use App\Exceptions\RolNoEliminableException;
use App\Models\Permiso;
use App\Models\Rol;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/** Roles y sus Permisos (RF-19 a RF-22). */
class RolService
{
    public const MENSAJE_ROL_SISTEMA = 'Este rol es parte del sistema y no se puede eliminar.';

    public const MENSAJE_CON_USUARIOS = 'No se puede eliminar: existen usuarios con este rol asignado.';

    /** RF-21.2: listado alfabético con conteos; opcionalmente filtrado por nombre. */
    public function listar(?string $busqueda = null): Collection
    {
        $busqueda = trim((string) $busqueda);

        return Rol::query()
            ->withCount(['permisos', 'usuarios'])
            ->when($busqueda !== '', fn ($q) => $q->where('nombre', 'ilike', '%'.addcslashes($busqueda, '%_\\').'%'))
            ->orderByRaw('LOWER(nombre)')
            ->get();
    }

    /** RF-21.3: detalle con sus Permisos y la cantidad de usuarios. */
    public function obtenerConPermisos(Rol $rol): Rol
    {
        return $rol->load(['permisos' => fn ($q) => $q->orderBy('nombre')])->loadCount('usuarios');
    }

    public function listarPermisosDisponibles(): Collection
    {
        return Permiso::orderBy('nombre')->get(['id_permiso', 'nombre', 'descripcion', 'nivel']);
    }

    /** RF-19.4: el Rol y sus Permisos en una sola operación. */
    public function crear(RolData $datos): Rol
    {
        return DB::transaction(function () use ($datos) {
            $rol = Rol::create($datos->campos());
            $rol->permisos()->sync($datos->permisos);

            return $rol;
        });
    }

    /**
     * RF-20.4: reemplaza los datos y los Permisos en una sola operación. Los
     * Permisos del Administrador no se tocan: los tiene todos (CA-2).
     */
    public function actualizar(Rol $rol, RolData $datos): Rol
    {
        return DB::transaction(function () use ($rol, $datos) {
            $rol->update($datos->campos());
            if (! $rol->todos_los_permisos) {
                $rol->permisos()->sync($datos->permisos);
            }

            return $rol;
        });
    }

    /**
     * RF-22: elimina un Rol sin usuarios que no sea del sistema, desvinculando
     * sus Permisos. La fila se bloquea antes de contar los usuarios: una
     * asignación simultánea espera y luego falla, o se completa antes y la
     * eliminación se rechaza (RF-22.4.1).
     *
     * @throws RolNoEliminableException
     */
    public function eliminar(Rol $rol): void
    {
        DB::transaction(function () use ($rol) {
            $vigente = Rol::whereKey($rol->getKey())->lockForUpdate()->firstOrFail();

            if ($vigente->es_sistema) {
                throw new RolNoEliminableException(self::MENSAJE_ROL_SISTEMA);
            }
            if ($vigente->usuarios()->exists()) {
                throw new RolNoEliminableException(self::MENSAJE_CON_USUARIOS);
            }

            $vigente->permisos()->detach();
            $vigente->delete();
        });
    }
}
