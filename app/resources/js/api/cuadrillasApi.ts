const API_URL = "/api/cuadrillas";

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
    const response = await fetch(API_URL, {
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new Error("No se pudieron obtener las cuadrillas");
    }

    return response.json();
}

export async function obtenerCuadrilla(id: number): Promise<Cuadrilla> {
    const response = await fetch(`${API_URL}/${id}`, {
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new Error("No se pudo obtener la cuadrilla");
    }

    return response.json();
}

export async function obtenerSupervisores(): Promise<OpcionSupervisor[]> {
    const response = await fetch(`${API_URL}/supervisores`, {
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new Error("No se pudieron obtener los supervisores");
    }

    return response.json();
}

export async function crearCuadrilla(
    cuadrilla: CrearCuadrilla
): Promise<Cuadrilla> {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(cuadrilla),
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}

export async function actualizarCuadrilla(
    id: number,
    cuadrilla: Partial<CrearCuadrilla>
): Promise<Cuadrilla> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(cuadrilla),
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}

export async function eliminarCuadrilla(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        // El backend responde 409 con un mensaje si hay asignaciones asociadas
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? "No se pudo eliminar la cuadrilla");
    }
}