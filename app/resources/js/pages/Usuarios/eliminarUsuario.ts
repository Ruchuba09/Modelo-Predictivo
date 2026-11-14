import { router } from '@inertiajs/react';
import type { Usuario } from './UsuarioForm';

/** Motivo visible por el que no se ofrece eliminar el Usuario (RF-30.3.1), o null. */
export function motivoNoEliminable(usuario: Usuario): string | null {
    return usuario.es_propio ? 'No puedes eliminar tu propia cuenta.' : null;
}

/**
 * RF-30.2: pide confirmación advirtiendo los eventos que perderán su autor.
 * El servidor vuelve a comprobar las condiciones; si rechaza, el aviso llega
 * como mensaje flash.
 */
export function eliminarUsuario(usuario: Usuario): void {
    const eventos = usuario.eventos_registrados_count ?? 0;
    const aviso = eventos > 0
        ? `\n\nRegistró ${eventos} ${eventos === 1 ? 'evento, que quedará' : 'eventos, que quedarán'} sin autor.`
        : '';

    if (confirm(`¿Eliminar la cuenta de ${usuario.email}?${aviso}\n\nEsta acción no se puede deshacer.`)) {
        router.delete(`/usuarios/${usuario.id_user}`, { preserveScroll: true });
    }
}
