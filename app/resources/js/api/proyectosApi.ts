const API_URL = "/api/proyectos";

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
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error("No se pudieron obtener los proyectos");
    }

    return response.json();
}

export async function obtenerProyecto(
    id: number
): Promise<Proyecto> {
    const response = await fetch(`${API_URL}/${id}`);

    if (!response.ok) {
        throw new Error("No se pudo obtener el proyecto");
    }

    return response.json();
}

export async function crearProyecto(
    proyecto: CrearProyecto
): Promise<Proyecto> {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(proyecto),
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}

export async function actualizarProyecto(
    id: number,
    proyecto: Partial<CrearProyecto>
): Promise<Proyecto> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(proyecto),
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}

export async function eliminarProyecto(
    id: number
): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error("No se pudo eliminar el proyecto");
    }
}
