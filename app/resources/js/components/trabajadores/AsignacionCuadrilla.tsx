import type { Trabajador } from "../../types/trabajador";

interface Props {
    trabajador: Trabajador;
}

export default function AsignacionCuadrilla({ trabajador }: Props) {
    const nombreCompleto = `${trabajador.nombre_1} ${trabajador.apellido_1}`.trim();

    return (
        <div className="bg-verde-1/50 border border-verde-3 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="text-xs uppercase font-bold text-gris-1 tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-verde-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Cuadrilla de {nombreCompleto}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled
                        className="px-3 py-1.5 rounded-lg border border-rojo-1/30 text-rojo-1 text-xs font-semibold disabled:opacity-40 cursor-not-allowed"
                    >
                        Quitar
                    </button>
                    <button
                        type="button"
                        disabled
                        className="px-3 py-1.5 rounded-lg bg-verde-5 text-black font-bold text-xs disabled:opacity-40 cursor-not-allowed flex items-center gap-1"
                        title="Asignar a una cuadrilla"
                    >
                        + Asignar
                    </button>
                </div>
            </div>

            <div className="bg-white border border-verde-3/70 rounded-xl p-4 text-xs text-gris-1 flex items-center gap-2">
                <svg className="w-4 h-4 text-verde-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Módulo de asignación dinámica trabajador–cuadrilla en construcción.</span>
            </div>
        </div>
    );
}