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
    coherencia?: { completa: boolean; plazos_pendientes: number[] };
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

/** Plazos disponibles, en días. Los menores a una semana se derivan del modelo de 1 semana. */
export const HORIZONTES_MODELO: Array<{ dias: number; etiqueta: string; plazo: string }> = [
    { dias: 1, etiqueta: '1 día', plazo: 'el próximo día' },
    { dias: 2, etiqueta: '2 días', plazo: 'los próximos 2 días' },
    { dias: 5, etiqueta: '5 días', plazo: 'los próximos 5 días' },
    { dias: 7, etiqueta: '1 semana', plazo: 'la próxima semana' },
    { dias: 14, etiqueta: '2 semanas', plazo: 'las próximas 2 semanas' },
    { dias: 21, etiqueta: '3 semanas', plazo: 'las próximas 3 semanas' },
    { dias: 30, etiqueta: '1 mes', plazo: 'el próximo mes' },
    { dias: 60, etiqueta: '2 meses', plazo: 'los próximos 2 meses' },
    { dias: 90, etiqueta: '3 meses', plazo: 'los próximos 3 meses' },
];

export const HORIZONTE_PREDETERMINADO = 30;
const horizonteDe = (dias: number) => HORIZONTES_MODELO.find((h) => h.dias === dias);
export const etiquetaHorizonte = (dias: number) => horizonteDe(dias)?.etiqueta ?? `${dias} días`;
export const plazoHorizonte = (dias: number) => horizonteDe(dias)?.plazo ?? `los próximos ${dias} días`;
export const horizonteDerivado = (dias: number) => dias < 7;

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

// v3: solo quedan los objetivos incidentes_reales, lesiones y todos; los filtros guardados antes se descartan.
const CLAVE_FILTROS = 'ava.modelo.filtros.v3';

function filtrosGuardados(): { tipo: string; horizonte: number } {
    try {
        const guardado = JSON.parse(window.localStorage.getItem(CLAVE_FILTROS) ?? '{}');
        const horizonte = Number(guardado.horizonte);
        return { tipo: guardado.tipo ?? 'incidentes_reales', horizonte: horizonteDe(horizonte) ? horizonte : HORIZONTE_PREDETERMINADO };
    } catch {
        return { tipo: 'incidentes_reales', horizonte: HORIZONTE_PREDETERMINADO };
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

/** `version` cambia para volver a pedir los datos, por ejemplo después de reentrenar. */
export function useEntidades(tipo: string, horizonte: number, version = 0) {
    const [datos, setDatos] = useState<RespuestaEntidades | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let vigente = true;
        setCargando(true);
        setError('');
        api.get<RespuestaEntidades>('/modelo-predictivo/entidades', { params: { tipo_objetivo: tipo, horizonte_dias: horizonte } })
            .then(({ data }) => vigente && setDatos(data))
            .catch((err) => {
                if (vigente) {
                    setDatos(null);
                    setError(err.response?.data?.detail ?? err.response?.data?.message ?? 'No fue posible cargar las predicciones.');
                }
            })
            .finally(() => vigente && setCargando(false));
        return () => { vigente = false; };
    }, [tipo, horizonte, version]);

    return { datos, cargando, error };
}

/* ------------------------------------------------------------------ tres modelos de tasa */

export const OBJETIVOS = ['incidentes_reales', 'lesiones', 'todos'] as const;
export type Objetivo = (typeof OBJETIVOS)[number];

/** Color fijo por objetivo, el mismo en todas las vistas y gráficos. */
export const COLOR_OBJETIVO: Record<Objetivo, string> = {
    incidentes_reales: '#3FAE29',
    lesiones: '#C2410C',
    todos: '#0369A1',
};

/** Los modelos predicen una tasa semanal: cualquier plazo sale de P = 1 − e^(−tasa·días/7). */
export const probabilidadDesdeTasa = (tasaSemanal: number, dias: number) => 1 - Math.exp(-Math.max(tasaSemanal, 0) * dias / 7);

/** Espera media hasta el próximo evento, en días, con una tasa semanal constante. */
export const esperaMediaDias = (tasaSemanal: number) => (tasaSemanal > 0 ? 7 / tasaSemanal : null);

export type ObjetivoResumen = {
    tipo_objetivo: Objetivo;
    nombre: string;
    clave: string;
    predice: string;
    tasa_semanal_total?: number;
    eventos_esperados_30_dias?: number;
    calidad: Record<string, CalidadNivel>;
};

export type ResumenModelos = {
    version?: string;
    semana_base?: string;
    entrenado_en?: string;
    proyectos_vigentes?: number;
    horizontes_dias?: number[];
    objetivos: ObjetivoResumen[];
    modelo_lesion: { nombre?: string; clave?: string; predice?: string; probabilidad_media?: number; calidad: CalidadNivel };
};

export type FilaEvaluacion = {
    nivel: string;
    tipo_objetivo: Objetivo;
    etiqueta_objetivo?: string;
    horizonte: number;
    predicciones: number;
    ocurrieron: number;
    riesgo_predicho: number;
    tasa_real: number;
    brier: number;
    auc_roc?: number;
};

/** Mensaje legible de un error de la API (Laravel usa "message"; FastAPI, "detail"). */
export function mensajeError(error: unknown, porDefecto = 'No fue posible consultar el modelo predictivo.'): string {
    const datos = (error as { response?: { data?: { message?: string; detail?: string } } })?.response?.data;
    return datos?.message ?? datos?.detail ?? porDefecto;
}

/** Resumen de los tres modelos; `version` cambia para volver a pedirlo, por ejemplo después de reentrenar. */
export function useResumenModelos(version = 0) {
    const [datos, setDatos] = useState<ResumenModelos | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let vigente = true;
        setCargando(true);
        setError('');
        api.get<ResumenModelos>('/modelo-predictivo/modelos')
            .then(({ data }) => vigente && setDatos(data))
            .catch((err) => vigente && setError(mensajeError(err)))
            .finally(() => vigente && setCargando(false));
        return () => { vigente = false; };
    }, [version]);

    return { datos, cargando, error };
}
