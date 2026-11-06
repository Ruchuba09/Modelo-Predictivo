// resources/js/types/cuadrilla.ts
export interface Persona {
    nombre_1?: string;
    apellido_1?: string;
}

export interface Cuadrilla {
    id_cuadrilla: number;
    id_supervisor: number;
    numero_cuadrilla: string;
    id_jefe_zona?: number | null;
    integrantes_count?: number;
    jefe_zona?: { trabajador?: { persona?: Persona } } | null;
    supervisor?: {
        id_trabajador: number;
        trabajador?: {
            persona?: Persona;
        };
    };
    obreros?: Array<{
        id_trabajador: number;
        trabajador?: { persona?: Persona };
    }>;
}

export interface CrearCuadrilla {
    id_supervisor: number;
    numero_cuadrilla: string;
    id_jefe_zona?: number | null;
}

export interface MiembroOpcion {
    id_trabajador: number;
    nombre: string;
    cargo?: string | null;
    id_cuadrilla: number | null;
    integra: boolean;
}

export interface SupervisorOpcion {
    id_trabajador: number;
    nombre: string;
}
