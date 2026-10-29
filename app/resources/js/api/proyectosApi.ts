import { api } from "../lib/api";

const API_URL = "/proyectos";

export interface Faena {
    id_faena: number;
    nombre: string;
}

export interface Cliente {
    id_cliente: number;
    nombre: string;
}

export interface Proyecto {
    id_proyecto: number;
    id_faena: number;
    id_cliente: number;
    nombre: string;
    descripcion: string | null;
    ubicacion: string | null;
    fecha_inicio: string | null;
    fecha_termino: string | null;
    estado: string;
    faena?: Faena;
    cliente?: Cliente;
}

export interface CrearProyecto {
    id_faena: number;
    id_cliente: number;
    nombre: string;
    descripcion?: string;
    ubicacion?: string;
    fecha_inicio?: string;
    fecha_termino?: string;
    estado: string;
}

export async function obtenerProyectos(): Promise<Proyecto[]> {
    const response = await api.get<Proyecto[]>(API_URL);
    return response.data;
}

export async function obtenerProyecto(
    id: number
): Promise<Proyecto> {
    const response = await api.get<Proyecto>(`${API_URL}/${id}`);
    return response.data;
}

export async function crearProyecto(
    proyecto: CrearProyecto
): Promise<Proyecto> {
    const response = await api.post<{ data: Proyecto }>(API_URL, proyecto);
    return response.data.data;
}

export async function actualizarProyecto(
    id: number,
    proyecto: Partial<CrearProyecto>
): Promise<Proyecto> {
    const response = await api.put<{ data: Proyecto }>(`${API_URL}/${id}`, proyecto);
    return response.data.data;
}

export async function eliminarProyecto(
    id: number
): Promise<void> {
    await api.delete(`${API_URL}/${id}`);
}
