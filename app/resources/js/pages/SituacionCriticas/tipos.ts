export interface Trabajador {
    id_trabajador: number;
    nombre_1: string;
    apellido_1: string;
}

export interface Supervisor {
    id_trabajador: number;
    trabajador?: Trabajador | null;
}

export interface EventoResumen {
    id_evento: number;
    descripcion: string;
}

export interface SituacionCritica {
    id: number;
    id_trabajador: number;
    id_supervisor: number | null;
    id_evento: number;
    referencia: string;
    condicion: number | string;
    trabajador?: Trabajador | null;
    supervisor?: Supervisor | null;
    evento?: EventoResumen | null;
}

export function nombreTrabajador(trabajador?: Trabajador | null, vacio = '—'): string {
    if (!trabajador) return vacio;
    return `${trabajador.nombre_1} ${trabajador.apellido_1}`;
}

export function nombreSupervisor(supervisores: Supervisor[], id: number | string | null | undefined): string {
    if (id === null || id === undefined || id === '') return 'Sin supervisor';
    return nombreTrabajador(supervisores.find((s) => String(s.id_trabajador) === String(id))?.trabajador, `#${id}`);
}

export const inputClass =
    'mt-1 block w-full rounded-lg border border-verde-3 bg-white px-3 py-2 text-sm text-gris-2 placeholder:text-gris-1 focus:border-verde-5/50 focus:outline-none focus:ring-1 focus:ring-verde-5/50';
export const labelClass = 'block text-sm font-medium text-gris-1';
export const botonPrimario =
    'rounded-lg bg-verde-5 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-verde-5/10 transition-colors hover:bg-verde-6 disabled:opacity-50';
