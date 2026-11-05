import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { CalidadNivel, Historial } from '@/components/CalidadModelos';

export type Factor = { variable: string; etiqueta: string; valor?: number | null; efecto: number };

export type EntidadRiesgo = {
    id: number;
    nombre: string;
    detalle?: string | null;
    id_proyecto: number | null;
    proyecto: string | null;
    cliente: string | null;
    faena: string | null;
    prob_evento: number;
    metodo: string;
    modelo: string;
    factores: Factor[];
    indicadores: Record<string, number | null | undefined>;
};

export type RespuestaEntidades = {
    tipo_objetivo: string;
    horizonte_semanas: number;
    semana: string;
    niveles: Record<string, EntidadRiesgo[]>;
    modelos: Record<string, CalidadNivel>;
    historial?: Historial | null;
};

export const NIVELES_ENTIDAD: Array<{ clave: string; singular: string; plural: string }> = [
    { clave: 'proyecto', singular: 'Proyecto', plural: 'Proyectos' },
    { clave: 'area', singular: 'Área', plural: 'Áreas' },
    { clave: 'cuadrilla', singular: 'Cuadrilla', plural: 'Cuadrillas' },
    { clave: 'trabajador', singular: 'Trabajador', plural: 'Trabajadores' },
    { clave: 'actividad', singular: 'Actividad', plural: 'Actividades' },
    { clave: 'cliente', singular: 'Cliente', plural: 'Clientes' },
    { clave: 'faena', singular: 'Faena', plural: 'Faenas' },
];

export const HORIZONTES_MODELO = [1, 4, 12];

export type BandaRiesgo = 'alto' | 'medio' | 'bajo';

/** Bandas orientativas sobre la probabilidad del horizonte elegido. */
export function bandaRiesgo(probabilidad: number): BandaRiesgo {
    if (probabilidad >= 0.35) return 'alto';
    return probabilidad >= 0.15 ? 'medio' : 'bajo';
}

export const ESTILO_BANDA: Record<BandaRiesgo, { etiqueta: string; chip: string; barra: string }> = {
    alto: { etiqueta: 'Alto', chip: 'bg-red-100 text-red-800', barra: 'bg-rojo-1' },
    medio: { etiqueta: 'Medio', chip: 'bg-amber-100 text-amber-900', barra: 'bg-amber-400' },
    bajo: { etiqueta: 'Bajo', chip: 'bg-verde-2 text-verde-6', barra: 'bg-verde-5' },
};

export const porcentaje = (valor: number | null | undefined) => `${Math.round((valor ?? 0) * 100)}%`;

const CLAVE_FILTROS = 'ava.modelo.filtros';

function filtrosGuardados(): { tipo: string; horizonte: number } {
    try {
        const guardado = JSON.parse(window.localStorage.getItem(CLAVE_FILTROS) ?? '{}');
        return { tipo: guardado.tipo ?? 'incidentes_reales', horizonte: Number(guardado.horizonte) || 4 };
    } catch {
        return { tipo: 'incidentes_reales', horizonte: 4 };
    }
}

/** Objetivo y horizonte compartidos entre las vistas del modelo. */
export function useFiltrosModelo() {
    const [filtros, setFiltros] = useState(filtrosGuardados);
    const [tipos, setTipos] = useState<string[]>(['incidentes_reales', 'lesiones', 'todos']);

    useEffect(() => {
        api.get<{ tipos: string[] }>('/modelo-predictivo/tipos')
            .then(({ data }) => data.tipos?.length && setTipos(data.tipos))
            .catch(() => undefined);
    }, []);

    const cambiar = useCallback((cambios: Partial<{ tipo: string; horizonte: number }>) => {
        setFiltros((actuales) => {
            const nuevos = { ...actuales, ...cambios };
            try {
                window.localStorage.setItem(CLAVE_FILTROS, JSON.stringify(nuevos));
            } catch {
                // Sin almacenamiento, los filtros valen solo para esta vista.
            }
            return nuevos;
        });
    }, []);

    return { ...filtros, tipos, cambiar };
}

export function useEntidades(tipo: string, horizonte: number) {
    const [datos, setDatos] = useState<RespuestaEntidades | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let vigente = true;
        setCargando(true);
        setError('');
        api.get<RespuestaEntidades>('/modelo-predictivo/entidades', { params: { tipo_objetivo: tipo, horizonte } })
            .then(({ data }) => vigente && setDatos(data))
            .catch((err) => {
                if (vigente) {
                    setDatos(null);
                    setError(err.response?.data?.detail ?? err.response?.data?.message ?? 'No fue posible cargar las predicciones.');
                }
            })
            .finally(() => vigente && setCargando(false));
        return () => { vigente = false; };
    }, [tipo, horizonte]);

    return { datos, cargando, error };
}
