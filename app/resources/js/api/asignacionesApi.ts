const API_URL = "/api/asignaciones";

export interface Persona {
    nombre_1: string;
    nombre_2?: string | null;
    apellido_1: string;
    apellido_2?: string | null;
}

export interface Administrador {
    trabajador?: {
        persona?: Persona;
    };
}

export interface ProyectoResumen {
    id_proyecto: number;
    nombre: string;
}

export interface CuadrillaResumen {
    id_cuadrilla: number;
    numero_cuadrilla: number;
}

export interface Asignacion {
    id_asignacion: number;
    id_administrador: number;
    id_proyecto: number;
    id_cuadrilla: number;
    fecha_inicio: string;
    fecha_termino: string | null;
    administrador?: Administrador;
    proyecto?: ProyectoResumen;
    cuadrilla?: CuadrillaResumen;
}

export interface FiltrosAsignacion {
    id_proyecto?: number;
    id_cuadrilla?: number;
}

export interface CrearAsignacion {
    id_administrador: number;
    id_proyecto: number;
    id_cuadrilla: number;
    fecha_inicio: string;
    fecha_termino?: string | null;
}

export async function obtenerAsignaciones(
    filtros?: FiltrosAsignacion
): Promise<Asignacion[]> {
    const params = new URLSearchParams();

    if (filtros?.id_proyecto) {
        params.append("id_proyecto", String(filtros.id_proyecto));
    }

    if (filtros?.id_cuadrilla) {
        params.append("id_cuadrilla", String(filtros.id_cuadrilla));
    }

    const query = params.toString();

    const response = await fetch(`${API_URL}${query ? `?${query}` : ""}`, {
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new Error("No se pudieron obtener las asignaciones");
    }

    return response.json();
}

export async function obtenerAsignacion(id: number): Promise<Asignacion> {
    const response = await fetch(`${API_URL}/${id}`, {
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new Error("No se pudo obtener la asignación");
    }

    return response.json();
}

export async function crearAsignacion(
    asignacion: CrearAsignacion
): Promise<Asignacion> {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(asignacion),
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}

export async function actualizarAsignacion(
    id: number,
    asignacion: Partial<CrearAsignacion>
): Promise<Asignacion> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(asignacion),
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}

export async function eliminarAsignacion(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new Error("No se pudo eliminar la asignación");
    }
}