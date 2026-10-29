import axios from 'axios';
import { api } from '@/lib/api';
import type { Cuadrilla, CrearCuadrilla, SupervisorOpcion } from '@/types/cuadrilla';

const BASE = '/cuadrillas';

export class ApiError extends Error {
    status: number;
    errors?: Record<string, string[]>;

    constructor(message: string, status: number, errors?: Record<string, string[]>) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
    }
}

async function request<T>(path: string, options: { method?: 'POST' | 'PUT' | 'DELETE'; data?: unknown } = {}): Promise<T> {
    try {
        const response = await api.request<T>({
            url: path,
            method: options.method ?? 'GET',
            data: options.data,
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
            throw new ApiError(
                error.response?.data?.message ?? error.message ?? 'Error inesperado',
                error.response?.status ?? 0,
                error.response?.data?.errors,
            );
        }
        throw error;
    }
}

export const cuadrillasApi = {
    listar: () => request<Cuadrilla[]>(BASE),
    obtener: (id: number) => request<Cuadrilla>(`${BASE}/${id}`),
    crear: (datos: CrearCuadrilla) => request<Cuadrilla>(BASE, { method: 'POST', data: datos }),
    actualizar: (id: number, datos: Partial<CrearCuadrilla>) =>
        request<Cuadrilla>(`${BASE}/${id}`, { method: 'PUT', data: datos }),
    eliminar: (id: number) => request<void>(`${BASE}/${id}`, { method: 'DELETE' }),
    supervisores: () => request<SupervisorOpcion[]>(`${BASE}/supervisores`),
};
