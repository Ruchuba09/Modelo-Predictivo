import { api } from '../lib/api';

export interface Actividad {
    id_actividad: number;
    id_asignacion: number;
    nombre: string;
    descripcion: string | null;
    fecha_inicio: string | null;
    fecha_termino: string | null;
    estado: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
    asignacion?: { id_asignacion: number; proyecto?: { id_proyecto: number; nombre: string } };
}

export type ActividadInput = Pick<Actividad, 'id_asignacion' | 'nombre' | 'estado'> &
    Partial<Pick<Actividad, 'descripcion' | 'fecha_inicio' | 'fecha_termino'>>;

interface ResourceCollection<T> { data: T[] }
interface Resource<T> { data: T }

export async function obtenerActividades(idAsignacion?: number): Promise<Actividad[]> {
    const response = await api.get<ResourceCollection<Actividad>>('/actividades', {
        params: idAsignacion ? { id_asignacion: idAsignacion } : undefined,
    });
    return response.data.data;
}

export async function crearActividad(datos: ActividadInput): Promise<Actividad> {
    const response = await api.post<Resource<Actividad>>('/actividades', datos);
    return response.data.data;
}

export async function actualizarActividad(id: number, datos: Partial<ActividadInput>): Promise<Actividad> {
    const response = await api.put<Resource<Actividad>>(`/actividades/${id}`, datos);
    return response.data.data;
}

export async function eliminarActividad(id: number): Promise<void> {
    await api.delete(`/actividades/${id}`);
}
