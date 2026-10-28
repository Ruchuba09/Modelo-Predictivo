import { api } from "../lib/api";

const API_URL = "/cuadrillas";

export interface Persona {
    nombre_1: string;
    nombre_2?: string | null;
    apellido_1: string;
    apellido_2?: string | null;
}

export interface Trabajador {
    id_trabajador: number;
    persona?: Persona;
}

export interface Supervisor {
    id_trabajador: number;
    trabajador?: Trabajador;
}

export interface Obrero {
    id_trabajador: number;
    id_cuadrilla: number | null;
    trabajador?: Trabajador;
}

export interface Cuadrilla {
    id_cuadrilla: number;
    id_supervisor: number;
    numero_cuadrilla: string;
    supervisor?: Supervisor;
    obreros?: Obrero[];
}

export interface CrearCuadrilla {
    id_supervisor: number;
    numero_cuadrilla: string;
}

export interface OpcionSupervisor {
    id_trabajador: number;
    nombre: string;
}

export async function obtenerCuadrillas(): Promise<Cuadrilla[]> {
    const response = await api.get<Cuadrilla[]>(API_URL);
    return response.data;
}

export async function obtenerCuadrilla(id: number): Promise<Cuadrilla> {
    const response = await api.get<Cuadrilla>(`${API_URL}/${id}`);
    return response.data;
}

export async function obtenerSupervisores(): Promise<OpcionSupervisor[]> {
    const response = await api.get<OpcionSupervisor[]>(`${API_URL}/supervisores`);
    return response.data;
}

export async function crearCuadrilla(
    cuadrilla: CrearCuadrilla
): Promise<Cuadrilla> {
    const response = await api.post<Cuadrilla>(API_URL, cuadrilla);
    return response.data;
}

export async function actualizarCuadrilla(
    id: number,
    cuadrilla: Partial<CrearCuadrilla>
): Promise<Cuadrilla> {
    const response = await api.put<Cuadrilla>(`${API_URL}/${id}`, cuadrilla);
    return response.data;
}

export async function eliminarCuadrilla(id: number): Promise<void> {
    await api.delete(`${API_URL}/${id}`);
}
