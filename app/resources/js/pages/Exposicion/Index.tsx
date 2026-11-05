import { FormEvent, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { api } from '@/lib/api';
import { AsignacionOpcion, BOTON_PRIMARIO, CAMPO_FORMULARIO, mensajeError, obtenerLista, ProyectoOpcion } from '@/lib/operacion';

type Horas = { id_horas: number; fecha: string; numero_cuadrilla: string | null; n_trabajadores: number | null; horas_normales: string; horas_extra: string };
type Asistencia = { id_trabajador: number; nombre: string; cargo: string | null; horas_normales: string | number | null; horas_extra: string | number | null; ausente: boolean | null };

const hoy = () => new Date().toLocaleDateString('en-CA');

export default function Index() {
    const [proyectos, setProyectos] = useState<ProyectoOpcion[]>([]);
    const [asignaciones, setAsignaciones] = useState<AsignacionOpcion[]>([]);
    const [idProyecto, setIdProyecto] = useState('');
    const [idCuadrilla, setIdCuadrilla] = useState('');
    const [fecha, setFecha] = useState(hoy());
    const [horas, setHoras] = useState<Horas[]>([]);
    const [formHoras, setFormHoras] = useState({ n_trabajadores: '', horas_normales: '', horas_extra: '0' });
    const [asistencia, setAsistencia] = useState<Asistencia[]>([]);
    const [ocupado, setOcupado] = useState(false);
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');

    const ejecutar = async (accion: () => Promise<void>) => {
        setOcupado(true);
        setError('');
        setAviso('');
        try {
            await accion();
        } catch (err) {
            setError(mensajeError(err));
        } finally {
            setOcupado(false);
        }
    };

    useEffect(() => {
        void ejecutar(async () => setProyectos(await obtenerLista<ProyectoOpcion>('/proyectos', { todos: 1, per_page: 100 })));
    }, []);

    useEffect(() => {
        setIdCuadrilla('');
        setHoras([]);
        if (idProyecto) {
            void ejecutar(async () => {
                const [lista, registradas] = await Promise.all([
                    obtenerLista<AsignacionOpcion>('/asignaciones', { id_proyecto: idProyecto, per_page: 100 }),
                    api.get<Horas[]>('/exposicion/horas', { params: { id_proyecto: idProyecto } }),
                ]);
                setAsignaciones(lista);
                setHoras(registradas.data);
            });
        }
    }, [idProyecto]);

    useEffect(() => {
        setAsistencia([]);
        if (idProyecto && idCuadrilla && fecha) {
            void ejecutar(async () => {
                const { data } = await api.get<Asistencia[]>('/exposicion/asistencia', {
                    params: { id_proyecto: idProyecto, id_cuadrilla: idCuadrilla, fecha },
                });
                setAsistencia(data.map((a) => ({ ...a, horas_normales: a.horas_normales ?? 9, horas_extra: a.horas_extra ?? 0, ausente: Boolean(a.ausente) })));
            });
        }
    }, [idProyecto, idCuadrilla, fecha]);

    const guardarHoras = (e: FormEvent) => {
        e.preventDefault();
        void ejecutar(async () => {
            await api.post('/exposicion/horas', {
                id_proyecto: Number(idProyecto), id_cuadrilla: Number(idCuadrilla), fecha,
                n_trabajadores: Number(formHoras.n_trabajadores),
                horas_normales: Number(formHoras.horas_normales), horas_extra: Number(formHoras.horas_extra),
            });
            const { data } = await api.get<Horas[]>('/exposicion/horas', { params: { id_proyecto: idProyecto } });
            setHoras(data);
            setAviso('Horas guardadas.');
        });
    };

    const guardarAsistencia = () =>
        void ejecutar(async () => {
            await api.post('/exposicion/asistencia', {
                id_proyecto: Number(idProyecto), fecha,
                registros: asistencia.map((a) => ({
                    id_trabajador: a.id_trabajador, horas_normales: Number(a.horas_normales), horas_extra: Number(a.horas_extra), ausente: Boolean(a.ausente),
                })),
            });
            setAviso('Asistencia guardada.');
        });

    const cambiar = (id: number, cambios: Partial<Asistencia>) =>
        setAsistencia((actual) => actual.map((a) => (a.id_trabajador === id ? { ...a, ...cambios } : a)));

    return (
        <MainLayout>
            <Head title="Horas y asistencia | AVA" />

            <div className="max-w-[1200px] mx-auto p-6 lg:p-8 space-y-4">
                {error && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{error}</p>}
                {aviso && <p className="rounded-lg border border-verde-3 bg-verde-1 p-3 text-sm text-gris-2" role="status">{aviso}</p>}
                <p className="text-sm text-gris-1">Con estos datos, el modelo mide riesgo por hora trabajada y deja de confundir una obra grande con una riesgosa.</p>

                <section className="bg-white border border-verde-3 rounded-xl p-5 shadow-sm grid gap-3 md:grid-cols-3">
                    <label className="text-xs font-semibold text-gris-1">
                        Proyecto
                        <select value={idProyecto} onChange={(e) => setIdProyecto(e.target.value)} className={CAMPO_FORMULARIO}>
                            <option value="">Selecciona un proyecto</option>
                            {proyectos.map((p) => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}
                        </select>
                    </label>
                    <label className="text-xs font-semibold text-gris-1">
                        Cuadrilla
                        <select value={idCuadrilla} onChange={(e) => setIdCuadrilla(e.target.value)} disabled={!idProyecto} className={CAMPO_FORMULARIO}>
                            <option value="">Selecciona una cuadrilla</option>
                            {asignaciones.map((a) => <option key={a.id_asignacion} value={a.id_cuadrilla}>{a.cuadrilla?.numero_cuadrilla ?? `Cuadrilla ${a.id_cuadrilla}`}</option>)}
                        </select>
                    </label>
                    <label className="text-xs font-semibold text-gris-1">
                        Fecha
                        <input type="date" max={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value)} className={CAMPO_FORMULARIO} />
                    </label>
                </section>

                {idCuadrilla && (
                    <div className="grid gap-6 lg:grid-cols-2 items-start">
                        <section className="bg-white border border-verde-3 rounded-xl p-5 shadow-sm space-y-3">
                            <h2 className="text-lg font-bold text-gris-2">Horas-hombre de la cuadrilla</h2>
                            <form onSubmit={guardarHoras} className="grid gap-3 sm:grid-cols-4 sm:items-end">
                                <label className="text-xs font-semibold text-gris-1">
                                    Personas
                                    <input type="number" min={0} required value={formHoras.n_trabajadores} onChange={(e) => setFormHoras({ ...formHoras, n_trabajadores: e.target.value })} className={CAMPO_FORMULARIO} />
                                </label>
                                <label className="text-xs font-semibold text-gris-1">
                                    Horas normales
                                    <input type="number" min={0} step="0.5" required value={formHoras.horas_normales} onChange={(e) => setFormHoras({ ...formHoras, horas_normales: e.target.value })} className={CAMPO_FORMULARIO} />
                                </label>
                                <label className="text-xs font-semibold text-gris-1">
                                    Horas extra
                                    <input type="number" min={0} step="0.5" required value={formHoras.horas_extra} onChange={(e) => setFormHoras({ ...formHoras, horas_extra: e.target.value })} className={CAMPO_FORMULARIO} />
                                </label>
                                <button type="submit" disabled={ocupado} className={BOTON_PRIMARIO}>Guardar</button>
                            </form>
                            <table className="w-full text-sm">
                                <caption className="text-left text-xs text-gris-1 mb-1">Últimos registros del proyecto</caption>
                                <thead className="text-xs uppercase text-gris-1 text-left">
                                    <tr><th scope="col" className="py-1">Fecha</th><th scope="col">Cuadrilla</th><th scope="col">Personas</th><th scope="col">Normales</th><th scope="col">Extra</th></tr>
                                </thead>
                                <tbody className="divide-y divide-verde-3 text-gris-2">
                                    {horas.map((h) => (
                                        <tr key={h.id_horas}>
                                            <td className="py-1">{h.fecha}</td><td>{h.numero_cuadrilla ?? '—'}</td><td>{h.n_trabajadores ?? '—'}</td><td>{Number(h.horas_normales)}</td><td>{Number(h.horas_extra)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>

                        <section className="bg-white border border-verde-3 rounded-xl p-5 shadow-sm space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-bold text-gris-2">Asistencia del {fecha}</h2>
                                <button type="button" disabled={ocupado || asistencia.length === 0} onClick={guardarAsistencia} className={BOTON_PRIMARIO}>Guardar</button>
                            </div>
                            <ul className="divide-y divide-verde-3">
                                {asistencia.map((a) => (
                                    <li key={a.id_trabajador} className="py-2 grid grid-cols-[1fr_5rem_5rem_5rem] items-center gap-2 text-sm">
                                        <span className="text-gris-2">{a.nombre}</span>
                                        <input aria-label={`Horas normales de ${a.nombre}`} type="number" min={0} max={24} step="0.5" disabled={Boolean(a.ausente)} value={a.horas_normales ?? 0} onChange={(e) => cambiar(a.id_trabajador, { horas_normales: e.target.value })} className="rounded-lg border-verde-3 text-sm" />
                                        <input aria-label={`Horas extra de ${a.nombre}`} type="number" min={0} max={24} step="0.5" disabled={Boolean(a.ausente)} value={a.horas_extra ?? 0} onChange={(e) => cambiar(a.id_trabajador, { horas_extra: e.target.value })} className="rounded-lg border-verde-3 text-sm" />
                                        <label className="text-xs text-gris-1 flex items-center gap-1">
                                            <input type="checkbox" checked={Boolean(a.ausente)} onChange={(e) => cambiar(a.id_trabajador, { ausente: e.target.checked })} />
                                            Ausente
                                        </label>
                                    </li>
                                ))}
                                {asistencia.length === 0 && <li className="py-3 text-sm text-gris-1">Esta cuadrilla no tiene integrantes.</li>}
                            </ul>
                        </section>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
