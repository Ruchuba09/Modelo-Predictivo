<?php

namespace App\Services;

use App\DataTransferObjects\PermisoData;
use App\Exceptions\PermisoNoEliminableException;
use App\Models\Permiso;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/** Catálogo de Permisos (RF-23 a RF-26). */
class PermisoService
{
    public const MENSAJE_PERMISO_SISTEMA = 'Este permiso es parte del sistema y no se puede eliminar.';

    /** RF-25.2: listado alfabético con la cantidad de Roles; opcionalmente filtrado por nombre o descripción. */
    public function listar(?string $busqueda = null): Collection
    {
        $busqueda = trim((string) $busqueda);
        $patron = '%'.addcslashes($busqueda, '%_\\').'%';

        return Permiso::query()
            ->withCount('roles')
            ->when($busqueda !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('nombre', 'ilike', $patron)
                ->orWhere('descripcion', 'ilike', $patron)))
            ->orderByRaw('LOWER(nombre)')
            ->get();
    }

    /** RF-25.3: detalle con los Roles que lo otorgan. */
    public function obtenerConRoles(Permiso $permiso): Permiso
    {
        return $permiso->load(['roles' => fn ($q) => $q->orderByRaw('LOWER(nombre)')]);
    }

    /** RF-23.4 */
    public function crear(PermisoData $datos): Permiso
    {
        return DB::transaction(fn () => Permiso::create($datos->toArray()));
    }

    /** RF-24.4: los Roles que lo tienen lo otorgan con los nuevos datos de inmediato. */
    public function actualizar(Permiso $permiso, PermisoData $datos): Permiso
    {
        return DB::transaction(function () use ($permiso, $datos) {
            $permiso->update($datos->toArray());

            return $permiso;
        });
    }

    /**
     * RF-26.4: lo desvincula de sus Roles y lo elimina en una sola operación.
     * Devuelve cuántos Roles lo tenían.
     *
     * @throws PermisoNoEliminableException
     */
    public function eliminar(Permiso $permiso): int
    {
        return DB::transaction(function () use ($permiso) {
            $vigente = Permiso::whereKey($permiso->getKey())->lockForUpdate()->firstOrFail();

            if ($vigente->es_sistema) {
                throw new PermisoNoEliminableException(self::MENSAJE_PERMISO_SISTEMA);
            }

            $roles = $vigente->roles()->detach();
            $vigente->delete();

            return $roles;
        });
    }
}
