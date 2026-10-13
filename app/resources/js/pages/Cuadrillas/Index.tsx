// resources/js/pages/Cuadrillas/Index.tsx
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState, FormEvent } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { cuadrillasApi, ApiError } from '@/services/cuadrillas';
import type { Cuadrilla, SupervisorOpcion } from '@/types/cuadrilla';

interface FormState {
    numero_cuadrilla: string;
    id_supervisor: string;
}

const FORM_VACIO: FormState = { numero_cuadrilla: '', id_supervisor: '' };

function nombreSupervisor(c: Cuadrilla): string {
    const p = c.supervisor?.trabajador?.persona;
    const nombre = `${p?.nombre_1 ?? ''} ${p?.apellido_1 ?? ''}`.trim();
    return nombre || '—';
}

export default function CuadrillasIndex() {
    const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([]);
    const [supervisores, setSupervisores] = useState<SupervisorOpcion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
    const [mensaje, setMensaje] = useState<string | null>(null);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [editando, setEditando] = useState<Cuadrilla | null>(null);
    const [form, setForm] = useState<FormState>(FORM_VACIO);
    const [errores, setErrores] = useState<Record<string, string[]>>({});
    const [guardando, setGuardando] = useState(false);

    const [aEliminar, setAEliminar] = useState<Cuadrilla | null>(null);
    const [eliminando, setEliminando] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        setErrorGlobal(null);
        try {
            const [lista, sups] = await Promise.all([
                cuadrillasApi.listar(),
                cuadrillasApi.supervisores(),
            ]);
            setCuadrillas(lista);
            setSupervisores(sups);
        } catch (e) {
            setErrorGlobal(e instanceof ApiError ? e.message : 'No se pudo cargar la información.');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    useEffect(() => {
        if (!mensaje) return;
        const t = setTimeout(() => setMensaje(null), 3500);
        return () => clearTimeout(t);
    }, [mensaje]);

    const abrirCrear = () => {
        setEditando(null);
        setForm(FORM_VACIO);
        setErrores({});
        setModalAbierto(true);
    };

    const abrirEditar = (c: Cuadrilla) => {
        setEditando(c);
        setForm({
            numero_cuadrilla: c.numero_cuadrilla,
            id_supervisor: String(c.id_supervisor),
        });
        setErrores({});
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        if (guardando) return;
        setModalAbierto(false);
    };

    const guardar = async (e: FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        setErrores({});

        const payload = {
            numero_cuadrilla: form.numero_cuadrilla.trim(),
            id_supervisor: Number(form.id_supervisor),
        };

        try {
            if (editando) {
                const actualizada = await cuadrillasApi.actualizar(editando.id_cuadrilla, payload);
                setCuadrillas((prev) =>
                    prev
                        .map((c) => (c.id_cuadrilla === actualizada.id_cuadrilla ? actualizada : c))
                        .sort((a, b) => a.numero_cuadrilla.localeCompare(b.numero_cuadrilla, undefined, { numeric: true }))
                );
                setMensaje('Cuadrilla actualizada con éxito');
            } else {
                const creada = await cuadrillasApi.crear(payload);
                setCuadrillas((prev) =>
                    [...prev, creada].sort((a, b) =>
                        a.numero_cuadrilla.localeCompare(b.numero_cuadrilla, undefined, { numeric: true })
                    )
                );
                setMensaje('Cuadrilla creada con éxito');
            }
            setModalAbierto(false);
        } catch (err) {
            if (err instanceof ApiError && err.status === 422 && err.errors) {
                setErrores(err.errors);
            } else {
                setErrores({
                    general: [err instanceof ApiError ? err.message : 'Error al guardar.'],
                });
            }
        } finally {
            setGuardando(false);
        }
    };

    const confirmarEliminar = async () => {
        if (!aEliminar) return;
        setEliminando(true);
        try {
            await cuadrillasApi.eliminar(aEliminar.id_cuadrilla);
            setCuadrillas((prev) => prev.filter((c) => c.id_cuadrilla !== aEliminar.id_cuadrilla));
            setMensaje('Cuadrilla eliminada con éxito');
            setAEliminar(null);
        } catch (err) {
            setErrorGlobal(err instanceof ApiError ? err.message : 'No se pudo eliminar.');
            setAEliminar(null);
        } finally {
            setEliminando(false);
        }
    };

    const inputClass =
        'w-full border border-verde-3 rounded-lg px-3 py-2 text-sm text-gris-2 focus:outline-none focus:border-verde-5 bg-white';

    return (
        <MainLayout>
            <Head title="Cuadrillas | AVA" />

            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 flex flex-col h-full min-h-[calc(100vh-80px)]">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gris-2 mb-1">Cuadrillas</h1>
                        <p className="text-gris-1 text-sm">Gestión de cuadrillas y supervisores asignados.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-verde-2 border border-verde-3 rounded-xl px-5 py-3">
                            <p className="text-[10px] uppercase tracking-wider text-gris-1 font-bold">Total</p>
                            <p className="text-2xl font-bold text-verde-6">{cuadrillas.length}</p>
                        </div>

                        <button
                            onClick={abrirCrear}
                            className="bg-verde-5 hover:bg-verde-6 text-gris-2 rounded-lg font-bold px-5 py-3 text-sm transition-colors shadow-lg shadow-verde-5/20"
                        >
                            + Nueva cuadrilla
                        </button>
                    </div>
                </div>

                {/* Mensajes */}
                {mensaje && (
                    <div className="mb-4 px-4 py-3 rounded-lg border border-verde-5/40 bg-verde-5/10 text-verde-6 text-sm font-bold">
                        {mensaje}
                    </div>
                )}
                {errorGlobal && (
                    <div className="mb-4 px-4 py-3 rounded-lg border border-rojo-1/40 bg-rojo-1/10 text-rojo-1 text-sm font-bold flex items-center justify-between">
                        <span>{errorGlobal}</span>
                        <button onClick={() => setErrorGlobal(null)} className="text-xs uppercase">
                            Cerrar
                        </button>
                    </div>
                )}

                {/* Tabla */}
                <div className="bg-white border border-verde-3 rounded-2xl shadow-2xl overflow-hidden flex-1 flex flex-col min-h-0">
                    {cargando ? (
                        <div className="flex items-center justify-center flex-1 p-10 text-gris-1 text-sm">
                            Cargando...
                        </div>
                    ) : cuadrillas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 p-10 text-center">
                            <div className="w-16 h-16 rounded-full bg-verde-2 flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-verde-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-gris-2">No hay cuadrillas</h2>
                            <p className="text-sm text-gris-1 mt-1">Crea la primera cuadrilla para comenzar.</p>
                        </div>
                    ) : (
                        <div className="overflow-auto flex-1 relative">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                    <tr className="border-b border-verde-3 text-left">
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">#</th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">N° Cuadrilla</th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">Supervisor</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cuadrillas.map((c) => (
                                        <tr
                                            key={c.id_cuadrilla}
                                            className="border-b border-verde-3/60 last:border-b-0 hover:bg-verde-2 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-gris-1 font-bold">#{c.id_cuadrilla}</td>
                                            <td className="px-6 py-4 text-gris-2 font-medium">{c.numero_cuadrilla}</td>
                                            <td className="px-6 py-4 text-gris-1">{nombreSupervisor(c)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-4">
                                                    <button
                                                        onClick={() => abrirEditar(c)}
                                                        className="text-verde-6 hover:underline font-bold text-xs uppercase"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => setAEliminar(c)}
                                                        className="text-rojo-1 hover:underline font-bold text-xs uppercase"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal crear / editar */}
            {modalAbierto && (
                <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
                    <form
                        onSubmit={guardar}
                        className="bg-white border border-verde-3 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-verde-3 bg-verde-2">
                            <h2 className="text-lg font-bold text-gris-2">
                                {editando ? 'Editar cuadrilla' : 'Nueva cuadrilla'}
                            </h2>
                        </div>

                        <div className="p-6 flex flex-col gap-4">
                            {errores.general && (
                                <div className="px-3 py-2 rounded-lg border border-rojo-1/40 bg-rojo-1/10 text-rojo-1 text-sm">
                                    {errores.general[0]}
                                </div>
                            )}

                            <div>
                                <label className="block text-[12px] uppercase tracking-wider text-gris-1 font-bold mb-1">
                                    N° Cuadrilla
                                </label>
                                <input
                                    type="text"
                                    maxLength={50}
                                    value={form.numero_cuadrilla}
                                    onChange={(e) => setForm({ ...form, numero_cuadrilla: e.target.value })}
                                    className={inputClass}
                                    required
                                />
                                {errores.numero_cuadrilla && (
                                    <p className="text-xs text-rojo-1 mt-1">{errores.numero_cuadrilla[0]}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[12px] uppercase tracking-wider text-gris-1 font-bold mb-1">
                                    Supervisor
                                </label>
                                <select
                                    value={form.id_supervisor}
                                    onChange={(e) => setForm({ ...form, id_supervisor: e.target.value })}
                                    className={inputClass}
                                    required
                                >
                                    <option value="">Selecciona un supervisor</option>
                                    {supervisores.map((s) => (
                                        <option key={s.id_trabajador} value={s.id_trabajador}>
                                            {s.nombre || `Trabajador #${s.id_trabajador}`}
                                        </option>
                                    ))}
                                </select>
                                {errores.id_supervisor && (
                                    <p className="text-xs text-rojo-1 mt-1">{errores.id_supervisor[0]}</p>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-verde-3 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={cerrarModal}
                                disabled={guardando}
                                className="px-4 py-2 text-sm font-bold text-gris-1 hover:text-gris-2 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={guardando}
                                className="bg-verde-5 hover:bg-verde-6 text-gris-2 rounded-lg font-bold px-5 py-2 text-sm transition-colors disabled:opacity-60"
                            >
                                {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal confirmar eliminación */}
            {aEliminar && (
                <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white border border-verde-3 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-verde-3 bg-verde-2">
                            <h2 className="text-lg font-bold text-gris-2">Eliminar cuadrilla</h2>
                        </div>
                        <div className="p-6 text-sm text-gris-1">
                            ¿Seguro que deseas eliminar la cuadrilla{' '}
                            <span className="font-bold text-gris-2">{aEliminar.numero_cuadrilla}</span>? Esta acción no se
                            puede deshacer.
                        </div>
                        <div className="px-6 py-4 border-t border-verde-3 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setAEliminar(null)}
                                disabled={eliminando}
                                className="px-4 py-2 text-sm font-bold text-gris-1 hover:text-gris-2 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarEliminar}
                                disabled={eliminando}
                                className="bg-rojo-1 hover:opacity-90 text-white rounded-lg font-bold px-5 py-2 text-sm transition-opacity disabled:opacity-60"
                            >
                                {eliminando ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}