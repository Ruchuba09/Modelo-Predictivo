import { useState } from "react";
import { useAsignacionCuadrillas } from "../../hooks/useAsignacionCuadrillas";

interface Props {
    idProyecto: number;
}

const hoy = () => new Date().toISOString().slice(0, 10);

export default function AsignacionCuadrillas({ idProyecto, idAdministrador }: Props) {
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
        "bg-[#101010] border border-[#2d3238] rounded-lg p-2 text-sm text-white";

    return (
        <div className="bg-[#141414] border border-[#2d3238] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase font-bold text-[#7a7f85]">
                    Cuadrillas asignadas
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={confirmarQuitar}
                        disabled={seleccionada === null}
                        className="px-3 py-1 rounded-lg border border-red-500/40 text-red-400 text-sm disabled:opacity-30"
                    >
                        Quitar
                    </button>
                    <button
                        onClick={() => setAgregando((v) => !v)}
                        className="px-3 py-1 rounded-lg bg-[#a0f700] text-black font-semibold text-sm"
                        title="Asignar nueva cuadrilla"
                    >
                        +
                    </button>
                </div>
            </div>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            {agregando && (
                <div className="flex flex-wrap items-end gap-2 mb-3">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs text-[#7a7f85] mb-1">Cuadrilla</label>
                        <select
                            value={idCuadrilla}
                            onChange={(e) =>
                                setIdCuadrilla(e.target.value ? Number(e.target.value) : "")
                            }
                            className={`${inputClass} w-full`}
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
                        <label className="block text-xs text-[#7a7f85] mb-1">Inicio</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-[#7a7f85] mb-1">Término (opcional)</label>
                        <input
                            type="date"
                            value={fechaTermino}
                            min={fechaInicio}
                            onChange={(e) => setFechaTermino(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <button
                        onClick={confirmarAsignacion}
                        disabled={idCuadrilla === "" || !fechaInicio}
                        className="px-3 py-2 rounded-lg bg-[#a0f700] text-black text-sm font-semibold disabled:opacity-30"
                    >
                        Asignar
                    </button>
                </div>
            )}

            {loading ? (
                <p className="text-[#7a7f85] text-sm">Cargando...</p>
            ) : asignaciones.length === 0 ? (
                <p className="text-[#7a7f85] text-sm">Sin cuadrillas asignadas</p>
            ) : (
                <ul className="space-y-1">
                    {asignaciones.map((a) => (
                        <li
                            key={a.id_asignacion}
                            onClick={() =>
                                setSeleccionada((s) =>
                                    s === a.id_asignacion ? null : a.id_asignacion
                                )
                            }
                            className={`flex justify-between px-3 py-2 rounded-lg cursor-pointer text-sm border ${
                                seleccionada === a.id_asignacion
                                    ? "border-[#a0f700]/60 bg-[#a0f700]/10"
                                    : "border-transparent hover:bg-[#1a1a1a]"
                            }`}
                        >
                            <span>{a.cuadrilla?.nombre ?? `Cuadrilla #${a.id_cuadrilla}`}</span>
                            <span className="text-[#7a7f85]">
                                {a.fecha_inicio} → {a.fecha_termino ?? "en curso"}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}