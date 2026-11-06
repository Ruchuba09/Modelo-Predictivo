import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { api } from '@/lib/api';

interface Faena {
    id_faena: number;
    codigo_faena: string;
    nombre: string;
    areas_count?: number;
}

interface Area {
    id_area: number;
    id_faena: number;
    codigo_area: string;
    descripcion?: string | null;
}

const FAENA_VACIA = { codigo_faena: '', nombre: '' };
const AREA_VACIA = { codigo_area: '', descripcion: '' };
const CAMPO = 'mt-1 block w-full rounded-lg border-verde-3 text-sm text-gris-2';
const PRIMARIO = 'px-4 py-2 rounded-lg text-sm font-bold bg-verde-5 hover:bg-verde-6 text-black disabled:opacity-50';
const ENLACE = 'text-xs font-bold text-gris-1 hover:text-gris-2';
const ELIMINAR = 'text-xs font-bold text-rojo-1 hover:underline';

function mensajeError(err: unknown): string {
    const respuesta = (err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } }).response;
    const validacion = respuesta?.data?.errors && Object.values(respuesta.data.errors)[0]?.[0];
    if (validacion) return validacion;
    if (respuesta?.status === 409 || respuesta?.status === 500) {
        return 'No se pudo completar: puede tener registros asociados.';
    }
    return respuesta?.data?.message ?? 'No se pudo completar la operación.';
}

export default function Index() {
    const [faenas, setFaenas] = useState<Faena[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [idFaena, setIdFaena] = useState<number | null>(null);
    const [faena, setFaena] = useState(FAENA_VACIA);
    const [area, setArea] = useState(AREA_VACIA);
    const [editandoFaena, setEditandoFaena] = useState<number | null>(null);
    const [editandoArea, setEditandoArea] = useState<number | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    const cargarFaenas = useCallback(async () => {
        const { data } = await api.get<Faena[]>('/faenas', { params: { todos: 1 } });
        setFaenas(data);
        setIdFaena((actual) => (data.some((f) => f.id_faena === actual) ? actual : data[0]?.id_faena ?? null));
    }, []);

    const cargarAreas = useCallback(async (id: number) => {
        const { data } = await api.get<Area[]>('/areas', { params: { todos: 1, id_faena: id } });
        setAreas(data);
    }, []);

    useEffect(() => {
        cargarFaenas().catch((err) => setError(mensajeError(err)));
    }, [cargarFaenas]);

    useEffect(() => {
        setArea(AREA_VACIA);
        setEditandoArea(null);
        if (idFaena === null) {
            setAreas([]);
            return;
        }
        cargarAreas(idFaena).catch((err) => setError(mensajeError(err)));
    }, [idFaena, cargarAreas]);

    const ejecutar = async (accion: () => Promise<void>) => {
        setGuardando(true);
        setError('');
        try {
            await accion();
        } catch (err) {
            setError(mensajeError(err));
        } finally {
            setGuardando(false);
        }
    };

    const guardarFaena = (e: FormEvent) => {
        e.preventDefault();
        void ejecutar(async () => {
            if (editandoFaena) {
                await api.put(`/faenas/${editandoFaena}`, faena);
            } else {
                await api.post('/faenas', faena);
            }
            setFaena(FAENA_VACIA);
            setEditandoFaena(null);
            await cargarFaenas();
        });
    };

    const eliminarFaena = (f: Faena) => {
        if (!confirm(`¿Eliminar la faena "${f.nombre}"?`)) return;
        void ejecutar(async () => {
            await api.delete(`/faenas/${f.id_faena}`);
            await cargarFaenas();
        });
    };

    const guardarArea = (e: FormEvent) => {
        e.preventDefault();
        if (idFaena === null) return;
        void ejecutar(async () => {
            if (editandoArea) {
                await api.put(`/areas/${editandoArea}`, { ...area, id_faena: idFaena });
            } else {
                await api.post('/areas', { ...area, id_faena: idFaena });
            }
            setArea(AREA_VACIA);
            setEditandoArea(null);
            await Promise.all([cargarAreas(idFaena), cargarFaenas()]);
        });
    };

    const eliminarArea = (a: Area) => {
        if (!confirm(`¿Eliminar el área "${a.codigo_area}"?`)) return;
        void ejecutar(async () => {
            await api.delete(`/areas/${a.id_area}`);
            await Promise.all([cargarAreas(a.id_faena), cargarFaenas()]);
        });
    };

    const seleccionada = faenas.find((f) => f.id_faena === idFaena);

    return (
        <MainLayout>
            <Head title="Faenas y áreas | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8 space-y-4">
                {error && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{error}</p>}

                <div className="grid gap-6 lg:grid-cols-2 items-start">
                    <section className="bg-white border border-verde-3 rounded-xl p-5 shadow-sm space-y-4">
                        <h2 className="text-lg font-bold text-gris-2">Faenas</h2>
                        <ul className="divide-y divide-verde-3">
                            {faenas.map((f) => (
                                <li key={f.id_faena} className={`py-2 px-2 rounded-lg flex items-center justify-between gap-3 ${f.id_faena === idFaena ? 'bg-verde-1' : ''}`}>
                                    <button type="button" onClick={() => setIdFaena(f.id_faena)} aria-pressed={f.id_faena === idFaena} className="text-left min-w-0 flex-1">
                                        <span className="block text-sm font-bold text-gris-2 truncate">{f.nombre}</span>
                                        <span className="block text-xs text-gris-1">{f.codigo_faena} · {f.areas_count ?? 0} áreas</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={ENLACE}
                                        onClick={() => {
                                            setEditandoFaena(f.id_faena);
                                            setFaena({ codigo_faena: f.codigo_faena, nombre: f.nombre });
                                        }}
                                    >
                                        Editar
                                    </button>
                                    <button type="button" className={ELIMINAR} onClick={() => eliminarFaena(f)}>Eliminar</button>
                                </li>
                            ))}
                            {faenas.length === 0 && <li className="py-4 text-sm text-gris-1">Aún no hay faenas registradas.</li>}
                        </ul>

                        <form onSubmit={guardarFaena} className="grid gap-3 sm:grid-cols-2 border-t border-verde-3 pt-4">
                            <label className="text-xs font-semibold text-gris-1">
                                Código
                                <input required maxLength={50} value={faena.codigo_faena} onChange={(e) => setFaena({ ...faena, codigo_faena: e.target.value })} className={CAMPO} />
                            </label>
                            <label className="text-xs font-semibold text-gris-1">
                                Nombre
                                <input required maxLength={255} value={faena.nombre} onChange={(e) => setFaena({ ...faena, nombre: e.target.value })} className={CAMPO} />
                            </label>
                            <div className="sm:col-span-2 flex justify-end gap-3">
                                {editandoFaena && (
                                    <button type="button" className={ENLACE} onClick={() => { setEditandoFaena(null); setFaena(FAENA_VACIA); }}>Cancelar</button>
                                )}
                                <button type="submit" disabled={guardando} className={PRIMARIO}>{editandoFaena ? 'Guardar faena' : 'Agregar faena'}</button>
                            </div>
                        </form>
                    </section>

                    <section className="bg-white border border-verde-3 rounded-xl p-5 shadow-sm space-y-4">
                        <h2 className="text-lg font-bold text-gris-2">Áreas{seleccionada ? ` de ${seleccionada.nombre}` : ''}</h2>
                        <ul className="divide-y divide-verde-3">
                            {areas.map((a) => (
                                <li key={a.id_area} className="py-2 px-2 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <span className="block text-sm font-bold text-gris-2">{a.codigo_area}</span>
                                        <span className="block text-xs text-gris-1 truncate">{a.descripcion || 'Sin descripción'}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className={ENLACE}
                                        onClick={() => {
                                            setEditandoArea(a.id_area);
                                            setArea({ codigo_area: a.codigo_area, descripcion: a.descripcion ?? '' });
                                        }}
                                    >
                                        Editar
                                    </button>
                                    <button type="button" className={ELIMINAR} onClick={() => eliminarArea(a)}>Eliminar</button>
                                </li>
                            ))}
                            {idFaena !== null && areas.length === 0 && (
                                <li className="py-4 text-sm text-gris-1">Esta faena no tiene áreas: sin ellas, los reportes de sus proyectos quedan sin área.</li>
                            )}
                        </ul>

                        {idFaena !== null && (
                            <form onSubmit={guardarArea} className="grid gap-3 sm:grid-cols-2 border-t border-verde-3 pt-4">
                                <label className="text-xs font-semibold text-gris-1">
                                    Código
                                    <input required maxLength={50} value={area.codigo_area} onChange={(e) => setArea({ ...area, codigo_area: e.target.value })} className={CAMPO} />
                                </label>
                                <label className="text-xs font-semibold text-gris-1">
                                    Descripción
                                    <input maxLength={255} value={area.descripcion} onChange={(e) => setArea({ ...area, descripcion: e.target.value })} className={CAMPO} />
                                </label>
                                <div className="sm:col-span-2 flex justify-end gap-3">
                                    {editandoArea && (
                                        <button type="button" className={ENLACE} onClick={() => { setEditandoArea(null); setArea(AREA_VACIA); }}>Cancelar</button>
                                    )}
                                    <button type="submit" disabled={guardando} className={PRIMARIO}>{editandoArea ? 'Guardar área' : 'Agregar área'}</button>
                                </div>
                            </form>
                        )}
                    </section>
                </div>
            </div>
        </MainLayout>
    );
}
