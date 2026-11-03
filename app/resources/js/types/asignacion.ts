import type { Cuadrilla } from './cuadrilla';

export interface ProyectoResumen {
    id_proyecto: number;
    nombre: string;
}

export interface PersonaResumen {
    nombre_1: string;
    nombre_2?: string | null;
    apellido_1: string;
    apellido_2?: string | null;
}

export interface Asignacion {
    id_asignacion: number;
    id_administrador: number;
    id_proyecto: number;
    id_cuadrilla: number;
    fecha_inicio: string;
    fecha_termino: string | null;
    proyecto?: ProyectoResumen;
    cuadrilla?: Cuadrilla;
    administrador?: { trabajador?: { persona?: PersonaResumen } };
}

export interface CrearAsignacion {
    id_proyecto: number;
    id_cuadrilla: number;
    fecha_inicio: string;
    fecha_termino?: string | null;
}
