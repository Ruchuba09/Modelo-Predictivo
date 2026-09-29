import { useCallback, useEffect, useState } from "react";

import {
    obtenerProyectos,
    eliminarProyecto,
    type Proyecto,
} from "../api/proyectosApi";

export function useProyectos() {
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargarProyectos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await obtenerProyectos();

            setProyectos(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Error al cargar proyectos"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarProyectos();
    }, [cargarProyectos]);

    const eliminar = async (id: number) => {
        try {
            await eliminarProyecto(id);

            setProyectos((actuales) =>
                actuales.filter(
                    (proyecto) =>
                        proyecto.id_proyecto !== id
                )
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Error al eliminar proyecto"
            );
        }
    };

    return {
        proyectos,
        loading,
        error,
        recargar: cargarProyectos,
        eliminar,
    };
}
