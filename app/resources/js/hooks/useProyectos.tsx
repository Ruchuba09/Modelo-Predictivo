import { useCallback, useEffect, useState } from "react";

import {
    obtenerProyectos,
    obtenerProyecto,
    eliminarProyecto,
    type Proyecto,
} from "../api/proyectosApi";

export function useProyectos(id?: number) {
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [proyecto, setProyecto] = useState<Proyecto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargarProyectos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (id !== undefined) {
                const data = await obtenerProyecto(id);
                setProyecto(data);
            } else {
                const data = await obtenerProyectos();
                setProyectos(data);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : id !== undefined
                    ? "Error al cargar el proyecto"
                    : "Error al cargar proyectos"
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        cargarProyectos();
    }, [cargarProyectos]);

    const eliminar = async (idEliminar: number) => {
        try {
            await eliminarProyecto(idEliminar);

            setProyectos((actuales) =>
                actuales.filter(
                    (item) => item.id_proyecto !== idEliminar
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
        proyecto,
        loading,
        error,
        recargar: cargarProyectos,
        eliminar,
    };
}

export const useProyecto = useProyectos;

