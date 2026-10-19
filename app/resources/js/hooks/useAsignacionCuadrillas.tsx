import { useCallback, useEffect, useState } from "react";
import type { Asignacion, Cuadrilla, CrearAsignacion } from "../types/asignacion";

const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    // Si las rutas están en web.php, descomenta:
    // "X-CSRF-TOKEN": document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "",
};

async function request<R>(url: string, init?: RequestInit): Promise<R> {
    const res = await fetch(url, { headers, ...init });

    if (!res.ok) {
        let msg = `Error ${res.status}`;
        try {
            const body = await res.json();
            // Errores de validación de Laravel (422)
            if (body.errors) msg = Object.values<string[]>(body.errors).flat().join(" ");
            else if (body.message) msg = body.message;
        } catch {
            /* respuesta sin JSON */
        }
        throw new Error(msg);
    }

    return res.status === 204 ? (undefined as R) : res.json();
}

export type DatosNuevaAsignacion = Omit<CrearAsignacion, "id_proyecto" | "id_administrador">;

export function useAsignacionCuadrillas(idProyecto: number, idAdministrador?: number) {
    const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
    const [disponibles, setDisponibles] = useState<Cuadrilla[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [a, todas] = await Promise.all([
                request<Asignacion[]>(`/api/asignaciones?id_proyecto=${idProyecto}`),
                request<Cuadrilla[]>("/api/cuadrillas"),
            ]);
            setAsignaciones(a);
            const usadas = new Set(a.map((x) => x.id_cuadrilla));
            setDisponibles(todas.filter((c) => !usadas.has(c.id_cuadrilla)));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al cargar");
        } finally {
            setLoading(false);
        }
    }, [idProyecto]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    // Devuelve true si salió bien, para que el formulario sepa si cerrarse
    const asignar = async (datos: DatosNuevaAsignacion): Promise<boolean> => {
        try {
            await request("/api/asignaciones", {
                method: "POST",
                body: JSON.stringify({
                    ...datos,
                    id_proyecto: idProyecto,
                }),
            });
            await cargar();
            return true;
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al asignar");
            return false;
        }
    };

    const quitar = async (idAsignacion: number) => {
        try {
            await request(`/api/asignaciones/${idAsignacion}`, { method: "DELETE" });
            await cargar();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al quitar");
        }
    };

    return { asignaciones, disponibles, loading, error, asignar, quitar };
}