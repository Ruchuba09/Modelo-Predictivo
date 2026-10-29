export interface Cliente {
    id_cliente: number;
    nombre: string;
    rut?: string;
    razon_social?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    estado?: string;
}

export interface Faena {
    id_faena: number;
    nombre: string;
    codigo_faena?: string;
}

export interface Proyecto {
    id_proyecto: number;
    id_faena: number;
    id_cliente: number;
    nombre: string;
    descripcion?: string | null;
    ubicacion?: string | null;
    fecha_inicio?: string | null;
    fecha_termino?: string | null;
    estado: string;
    cliente?: Cliente | null;
    faena?: Faena | null;
}
