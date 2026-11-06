import { api } from "../lib/api";
import type { Asignacion, CrearAsignacion } from "../types/asignacion";

const API_URL = "/asignaciones";

export interface FiltrosAsignacion {
    id_proyecto?: number;
    id_cuadrilla?: number;
}

export async function obtenerAsignaciones(
    filtros?: FiltrosAsignacion
): Promise<Asignacion[]> {
    const response = await api.get<Asignacion[]>(API_URL, { params: filtros });
    return response.data;
}

export async function obtenerAsignacion(id: number): Promise<Asignacion> {
    const response = await api.get<Asignacion>(`${API_URL}/${id}`);
    return response.data;
}

export async function crearAsignacion(
    asignacion: CrearAsignacion
): Promise<Asignacion> {
    const response = await api.post<Asignacion>(API_URL, asignacion);
    return response.data;
}

export async function actualizarAsignacion(
    id: number,
    asignacion: Partial<CrearAsignacion>
): Promise<Asignacion> {
    const response = await api.put<Asignacion>(`${API_URL}/${id}`, asignacion);
    return response.data;
}

export async function eliminarAsignacion(id: number): Promise<void> {
    await api.delete(`${API_URL}/${id}`);
}
