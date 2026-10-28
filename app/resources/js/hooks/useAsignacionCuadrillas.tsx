import { useCallback, useEffect, useState } from "react";
import { crearAsignacion, eliminarAsignacion, obtenerAsignaciones } from "../api/asignacionesApi";
import { cuadrillasApi } from "../services/cuadrillas";
import type { Asignacion, CrearAsignacion } from "../types/asignacion";
import type { Cuadrilla } from "../types/cuadrilla";

export type DatosNuevaAsignacion = Omit<CrearAsignacion, "id_proyecto">;

export function useAsignacionCuadrillas(idProyecto: number) {
    const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
    const [disponibles, setDisponibles] = useState<Cuadrilla[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [actuales, todas] = await Promise.all([
                obtenerAsignaciones({ id_proyecto: idProyecto }),
                cuadrillasApi.listar(),
            ]);
            setAsignaciones(actuales);
            const usadas = new Set(actuales.map((asignacion) => asignacion.id_cuadrilla));
            setDisponibles(todas.filter((cuadrilla) => !usadas.has(cuadrilla.id_cuadrilla)));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al cargar las asignaciones");
        } finally {
            setLoading(false);
        }
    }, [idProyecto]);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    const asignar = async (datos: DatosNuevaAsignacion): Promise<boolean> => {
        try {
            await crearAsignacion({ ...datos, id_proyecto: idProyecto });
            await cargar();
            return true;
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al asignar la cuadrilla");
            return false;
        }
    };

    const quitar = async (idAsignacion: number) => {
        try {
            await eliminarAsignacion(idAsignacion);
            await cargar();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al quitar la asignación");
        }
    };

    return { asignaciones, disponibles, loading, error, asignar, quitar };
}
