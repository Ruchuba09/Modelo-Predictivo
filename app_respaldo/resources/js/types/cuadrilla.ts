// resources/js/types/cuadrilla.ts
export interface Persona {
    nombre_1?: string;
    apellido_1?: string;
}

export interface Cuadrilla {
    id_cuadrilla: number;
    id_supervisor: number;
    numero_cuadrilla: string;
    supervisor?: {
        id_trabajador: number;
        trabajador?: {
            persona?: Persona;
        };
    };
}

export interface CrearCuadrilla {
    id_supervisor: number;
    numero_cuadrilla: string;
}

export interface SupervisorOpcion {
    id_trabajador: number;
    nombre: string;
}