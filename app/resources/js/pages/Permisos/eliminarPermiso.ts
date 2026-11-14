import { router } from '@inertiajs/react';
import type { Permiso } from './PermisoForm';

/** Motivo por el que el Permiso no se puede eliminar (RF-26.3), o null si se puede. */
export function motivoNoEliminable(permiso: Permiso): string | null {
    return permiso.es_sistema ? 'Este permiso es parte del sistema y no se puede eliminar.' : null;
}

/**
 * RF-26.2: pide confirmación indicando cuántos roles lo pierden. El servidor
 * vuelve a comprobar las condiciones; si rechaza, el aviso llega como mensaje flash.
 */
export function eliminarPermiso(permiso: Permiso): void {
    const roles = permiso.roles_count ?? permiso.roles?.length ?? 0;
    const aviso = roles > 0
        ? `\n\nLo tiene${roles === 1 ? '' : 'n'} asignado ${roles} ${roles === 1 ? 'rol, que dejará' : 'roles, que dejarán'} de otorgarlo.`
        : '';

    if (confirm(`¿Eliminar el permiso "${permiso.nombre}"?${aviso}\n\nEsta acción no se puede deshacer.`)) {
        router.delete(`/permisos/${permiso.id_permiso}`, { preserveScroll: true });
    }
}
