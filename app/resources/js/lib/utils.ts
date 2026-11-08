import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const ETIQUETAS_TIPO_OBJETIVO: Record<string, string> = {
    incidentes_reales: 'Incidentes reales',
    lesiones: 'Incidentes con lesión',
    todos: 'Todos los eventos',
};

/** Tipos que avisan de un peligro: se predicen, pero no hacen más riesgosa a una entidad. */
const TIPOS_AVISO = new Set(['tarjeta_pare']);

export function esAviso(tipo: string): boolean {
    return TIPOS_AVISO.has(tipo);
}

export function etiquetaTipo(tipo: string): string {
    return ETIQUETAS_TIPO_OBJETIVO[tipo] ?? tipo.replace(/_/g, ' ');
}
