import { useState } from "react";
import { useAsignacionCuadrillas } from "../../hooks/useAsignacionCuadrillas";

interface Props {
    idProyecto: number;
}

const hoy = () => new Date().toISOString().slice(0, 10);

export default function AsignacionCuadrillas({ idProyecto }: Props) {
    const { asignaciones, disponibles, loading, error, asignar, quitar } =
        useAsignacionCuadrillas(idProyecto);

    const [seleccionada, setSeleccionada] = useState<number | null>(null); // id_asignacion
    const [agregando, setAgregando] = useState(false);
    const [idCuadrilla, setIdCuadrilla] = useState<number | "">("");
    const [fechaInicio, setFechaInicio] = useState(hoy());
    const [fechaTermino, setFechaTermino] = useState("");

    const confirmarAsignacion = async () => {
        if (idCuadrilla === "") return;

        const ok = await asignar({
            id_cuadrilla: idCuadrilla,
            fecha_inicio: fechaInicio,
            fecha_termino: fechaTermino || null,
        });

        if (ok) {
            setIdCuadrilla("");
            setFechaInicio(hoy());
            setFechaTermino("");
            setAgregando(false);
        }
    };

    const confirmarQuitar = async () => {
        if (seleccionada === null) return;
        await quitar(seleccionada);
        setSeleccionada(null);
    };

    const inputClass =
        "bg-white border border-verde-3 rounded-lg px-3 py-2 text-xs text-gris-2 font-medium focus:outline-none focus:border-verde-5";

    return (
        <div className="bg-verde-1/50 border border-verde-3 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="text-xs uppercase font-bold text-gris-1 tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-verde-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Cuadrillas asignadas a este proyecto</span>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={confirmarQuitar}
                        disabled={seleccionada === null}
                        className="px-3 py-1.5 rounded-lg border border-rojo-1/40 bg-white text-rojo-1 text-xs font-bold hover:bg-rojo-1 hover:text-white transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                    >
                        Quitar
                    </button>
                    <button
                        type="button"
                        onClick={() => setAgregando((v) => !v)}
                        className="px-3 py-1.5 rounded-lg bg-verde-5 hover:bg-verde-6 text-black font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1"
                        title="Asignar nueva cuadrilla"
                    >
                        <span className="text-sm font-black">+</span>
                        <span>Asignar</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-3 mb-3 rounded-lg border border-rojo-1/40 bg-rojo-1/10 text-rojo-1 text-xs font-bold">
                    {error}
                </div>
            )}

            {agregando && (
                <div className="bg-white border border-verde-3 rounded-xl p-4 mb-4 shadow-sm flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] uppercase font-bold text-gris-1 tracking-wider mb-1">Cuadrilla</label>
                        <select
                            value={idCuadrilla}
                            onChange={(e) =>
                                setIdCuadrilla(e.target.value ? Number(e.target.value) : "")
                            }
                            className={`${inputClass} w-full cursor-pointer`}
                        >
                            <option value="">Selecciona una cuadrilla...</option>
                            {disponibles.map((c) => (
                                <option key={c.id_cuadrilla} value={c.id_cuadrilla}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gris-1 tracking-wider mb-1">Fecha Inicio</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gris-1 tracking-wider mb-1">Fecha Término (opcional)</label>
                        <input
                            type="date"
                            value={fechaTermino}
                            min={fechaInicio}
                            onChange={(e) => setFechaTermino(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={confirmarAsignacion}
                        disabled={idCuadrilla === "" || !fechaInicio}
                        className="px-4 py-2 rounded-lg bg-verde-5 hover:bg-verde-6 text-black text-xs font-bold transition-all shadow-sm disabled:opacity-40 cursor-pointer self-end"
                    >
                        Confirmar
                    </button>
                </div>
            )}

            {loading ? (
                <p className="text-gris-1 text-xs font-medium py-2">Cargando cuadrillas...</p>
            ) : asignaciones.length === 0 ? (
                <p className="text-gris-1 text-xs font-medium py-2 italic">Sin cuadrillas asignadas actualmente.</p>
            ) : (
                <ul className="space-y-1.5">
                    {asignaciones.map((a) => (
                        <li
                            key={a.id_asignacion}
                            onClick={() =>
                                setSeleccionada((s) =>
                                    s === a.id_asignacion ? null : a.id_asignacion
                                )
                            }
                            className={`flex justify-between items-center px-4 py-2.5 rounded-xl cursor-pointer text-xs sm:text-sm border transition-all ${
                                seleccionada === a.id_asignacion
                                    ? "border-verde-5 bg-white shadow-sm font-bold text-gris-2 ring-1 ring-verde-5/50"
                                    : "border-verde-3/60 bg-white/80 hover:bg-white text-gris-2 shadow-xs"
                            }`}
                        >
                            <span className="font-semibold text-gris-2">
                                {a.cuadrilla?.nombre ?? `Cuadrilla #${a.id_cuadrilla}`}
                            </span>
                            <span className="text-xs text-gris-1 font-medium bg-verde-2 px-2.5 py-1 rounded-md border border-verde-3">
                                {a.fecha_inicio} → {a.fecha_termino ?? "En curso"}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}