import { usePage } from '@inertiajs/react';

/** Condiciones de la Tarjeta PARE, según el catálogo único del backend (App\Support\CondicionesPare). */
export function useCondicionesPare(): Record<number, string> {
    const { condicionesPare } = usePage().props as unknown as { condicionesPare?: Record<number, string> };

    return condicionesPare ?? {};
}

/** "N. texto" de una condición PARE, o el valor tal cual si no está en el catálogo. */
export function etiquetaCondicion(condiciones: Record<number, string>, valor: number | string | null | undefined): string {
    if (valor === null || valor === undefined || valor === '') return '—';
    const texto = condiciones[Number(valor)];
    return texto ? `${valor}. ${texto}` : String(valor);
}
