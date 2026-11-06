export interface Cliente {
    id_cliente: number;
    nombre: string | null;
    rut?: string;
    razon_social: string;
    email?: string | null;
    telefono?: string | null;
    direccion?: string | null;
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
    id_proyecto_intrava?: number | null;
    centro_costo?: string | null;
    alias?: string | null;
    num_contrato?: string | null;
    fecha_inicio?: string | null;
    fecha_termino?: string | null;
    estado: string;
    cliente?: Cliente | null;
    faena?: Faena | null;
}
