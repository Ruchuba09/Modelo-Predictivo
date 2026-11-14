import { router } from '@inertiajs/react';
import type { Rol } from './RolForm';

/** Motivo por el que el Rol no se puede eliminar (RF-22.3), o null si se puede. */
export function motivoNoEliminable(rol: Rol): string | null {
    if (rol.es_sistema) return 'Este rol es parte del sistema y no se puede eliminar.';
    if ((rol.usuarios_count ?? 0) > 0) return 'No se puede eliminar: existen usuarios con este rol asignado.';
    return null;
}

/**
 * RF-22.2: pide confirmación antes de eliminar. El servidor vuelve a
 * comprobar las condiciones; si rechaza, el aviso llega como mensaje flash.
 */
export function eliminarRol(rol: Rol): void {
    if (confirm(`¿Eliminar el rol "${rol.nombre}"? Esta acción no se puede deshacer.`)) {
        router.delete(`/roles/${rol.id_rol}`, { preserveScroll: true });
    }
}
