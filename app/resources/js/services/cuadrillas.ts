// resources/js/services/cuadrillas.ts
import type { Cuadrilla, CrearCuadrilla, SupervisorOpcion } from '@/types/cuadrilla';

const BASE = '/api/cuadrillas';

export class ApiError extends Error {
    status: number;
    errors?: Record<string, string[]>;

    constructor(message: string, status: number, errors?: Record<string, string[]>) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}

function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrfToken(),
            ...(options.headers ?? {}),
        },
    });

    if (res.status === 204) return null as T;

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new ApiError(
            data?.message ?? 'Error inesperado',
            res.status,
            data?.errors
        );
    }

    return data as T;
}

export const cuadrillasApi = {
    listar: () => request<Cuadrilla[]>(BASE),

    obtener: (id: number) => request<Cuadrilla>(`${BASE}/${id}`),

    crear: (datos: CrearCuadrilla) =>
        request<Cuadrilla>(BASE, { method: 'POST', body: JSON.stringify(datos) }),

    actualizar: (id: number, datos: Partial<CrearCuadrilla>) =>
        request<Cuadrilla>(`${BASE}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(datos),
        }),

    eliminar: (id: number) => request<null>(`${BASE}/${id}`, { method: 'DELETE' }),

    supervisores: () => request<SupervisorOpcion[]>(`${BASE}/supervisores`),
};