import { api } from '../lib/api';

export type IntravaReportKind = 'previene' | 'flash' | 'investigaciones' | 'hallazgos';

export interface IntravaReport {
    id_local?: number;
    id_intrava: number | string;
    uuid_intrava?: string | null;
    id_proyecto: number | null;
    id_proyecto_intrava: number | null;
    proyecto_alias?: string | null;
    fecha?: string | null;
    fecha_creacion?: string | null;
    estado?: string | null;
    payload: Record<string, unknown>;
    proyecto_local?: { id_proyecto: number; nombre: string } | null;
    [field: string]: unknown;
}

export interface IntravaReportFilters {
    id_proyecto?: number;
    id_proyecto_intrava?: number;
    id_intrava?: string | number;
    uuid_intrava?: string;
    id_reporte_flash_intrava?: number;
    desde?: string;
    hasta?: string;
    estado?: string;
    buscar?: string;
    page?: number;
    per_page?: number;
}

export interface PaginatedIntravaReports {
    data: IntravaReport[];
    links: { first: string | null; last: string | null; prev: string | null; next: string | null };
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}

const paths: Record<IntravaReportKind, string> = {
    previene: '/intrava/reportes-previene',
    flash: '/intrava/reportes-flash',
    investigaciones: '/intrava/informes-investigacion',
    hallazgos: '/intrava/hallazgos',
};

export async function obtenerReportesIntrava(
    kind: IntravaReportKind,
    filters: IntravaReportFilters = {},
): Promise<PaginatedIntravaReports> {
    const response = await api.get<PaginatedIntravaReports>(paths[kind], { params: filters });
    return response.data;
}
