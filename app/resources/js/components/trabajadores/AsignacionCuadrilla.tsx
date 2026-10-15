import type { Trabajador } from "../../types/trabajador";

interface Props {
    trabajador: Trabajador;
}

export default function AsignacionCuadrilla({ trabajador }: Props) {
    // TODO: conectar con el backend cuando esté definido
    // (cargar cuadrilla(s) del trabajador, asignar, quitar).

    return (
        <div className="bg-[#141414] border border-[#2d3238] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase font-bold text-[#7a7f85]">
                    Cuadrilla de {trabajador.nombre_1} {trabajador.apellido_1}
                </div>

                <div className="flex gap-2">
                    <button
                        disabled
                        className="px-3 py-1 rounded-lg border border-red-500/40 text-red-400 text-sm disabled:opacity-30"
                    >
                        Quitar
                    </button>
                    <button
                        disabled
                        className="px-3 py-1 rounded-lg bg-[#a0f700] text-black font-semibold text-sm disabled:opacity-30"
                        title="Asignar a una cuadrilla"
                    >
                        +
                    </button>
                </div>
            </div>

            <p className="text-[#7a7f85] text-sm">
                Pendiente: backend de asignación trabajador–cuadrilla.
            </p>
        </div>
    );
}