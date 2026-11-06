import { useCallback, useEffect, useState } from 'react';
import {
    obtenerReportesIntrava,
    type IntravaReportFilters,
    type IntravaReportKind,
    type PaginatedIntravaReports,
} from '../api/intravaApi';

export function useReportesIntrava(kind: IntravaReportKind, filters: IntravaReportFilters = {}) {
    const [result, setResult] = useState<PaginatedIntravaReports | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const serializedFilters = JSON.stringify(filters);

    const recargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setResult(await obtenerReportesIntrava(kind, JSON.parse(serializedFilters)));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los reportes INTRAVA.');
        } finally {
            setLoading(false);
        }
    }, [kind, serializedFilters]);

    useEffect(() => { void recargar(); }, [recargar]);

    return { result, loading, error, recargar };
}
