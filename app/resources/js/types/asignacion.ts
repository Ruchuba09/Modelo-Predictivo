export interface Cuadrilla {
    id_cuadrilla: number;
    nombre: string;
}

export interface Asignacion {
    id_asignacion: number; // AJUSTAR si tu PK se llama distinto
    id_administrador: number;
    id_proyecto: number;
    id_cuadrilla: number;
    fecha_inicio: string;
    fecha_termino: string | null;
    cuadrilla?: Cuadrilla;
}

export interface CrearAsignacion {
    id_administrador: number;
    id_proyecto: number;
    id_cuadrilla: number;
    fecha_inicio: string;
    fecha_termino?: string | null;
}