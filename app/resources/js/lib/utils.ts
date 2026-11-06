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

export function etiquetaTipo(tipo: string): string {
    return ETIQUETAS_TIPO_OBJETIVO[tipo] ?? tipo.replace(/_/g, ' ');
}
