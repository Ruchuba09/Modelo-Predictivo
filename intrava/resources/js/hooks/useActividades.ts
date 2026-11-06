import { useCallback, useEffect, useState } from 'react';
import { obtenerActividades, type Actividad } from '../api/actividadesApi';

export function useActividades(idAsignacion?: number) {
    const [actividades, setActividades] = useState<Actividad[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const recargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setActividades(await obtenerActividades(idAsignacion));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las actividades.');
        } finally {
            setLoading(false);
        }
    }, [idAsignacion]);

    useEffect(() => { void recargar(); }, [recargar]);

    return { actividades, loading, error, recargar };
}
