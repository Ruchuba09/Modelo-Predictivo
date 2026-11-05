import { api } from '@/lib/api';

export type ProyectoOpcion = { id_proyecto: number; nombre: string };
export type AsignacionOpcion = {
    id_asignacion: number;
    id_cuadrilla: number;
    cuadrilla?: { numero_cuadrilla?: string } | null;
};

/** Las colecciones llegan como arreglo o, si están paginadas, dentro de `data`. */
function lista<T>(respuesta: T[] | { data: T[] }): T[] {
    return Array.isArray(respuesta) ? respuesta : respuesta.data;
}

export async function obtenerLista<T>(ruta: string, params?: object): Promise<T[]> {
    const { data } = await api.get<T[] | { data: T[] }>(ruta, { params });
    return lista(data);
}

export function mensajeError(err: unknown): string {
    const datos = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
    const validacion = datos?.errors && Object.values(datos.errors)[0]?.[0];
    return validacion ?? datos?.message ?? 'No se pudo completar la operación.';
}

export const CAMPO_FORMULARIO = 'mt-1 block w-full rounded-lg border-verde-3 text-sm text-gris-2';
export const BOTON_PRIMARIO = 'px-4 py-2 rounded-lg text-sm font-bold bg-verde-5 hover:bg-verde-6 text-black disabled:opacity-50';
