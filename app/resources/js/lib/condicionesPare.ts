import { usePage } from '@inertiajs/react';

/** Condiciones de la Tarjeta PARE, según el catálogo único del backend (App\Support\CondicionesPare). */
export function useCondicionesPare(): Record<number, string> {
    const { condicionesPare } = usePage().props as unknown as { condicionesPare?: Record<number, string> };

    return condicionesPare ?? {};
}
