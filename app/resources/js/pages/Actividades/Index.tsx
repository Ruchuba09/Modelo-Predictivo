import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { api } from '@/lib/api';
import { AsignacionOpcion, BOTON_PRIMARIO, CAMPO_FORMULARIO, mensajeError, obtenerLista, ProyectoOpcion } from '@/lib/operacion';

type Actividad = {
    id_actividad: number;
    nombre: string;
    estado: string;
    id_riesgo_critico: number | null;
    fecha_inicio: string | null;
    fecha_termino: string | null;
};
type Riesgo = { id_riesgo_critico: number; nombre: string };
type Trabajador = {
    id_trabajador: number;
    nombre: string;
    cargo: string | null;
    id_actividad_actual: number | null;
    actividad_actual: string | null;
};

const ESTADOS = [['pendiente', 'Pendiente'], ['en_progreso', 'En progreso'], ['completada', 'Completada']];
const NUEVA = { nombre: '', id_riesgo_critico: '', fecha_inicio: '', fecha_termino: '' };

export default function Index() {
    const [proyectos, setProyectos] = useState<ProyectoOpcion[]>([]);
    const [asignaciones, setAsignaciones] = useState<AsignacionOpcion[]>([]);
    const [actividades, setActividades] = useState<Actividad[]>([]);
    const [riesgos, setRiesgos] = useState<Riesgo[]>([]);
    const [idProyecto, setIdProyecto] = useState('');
    const [idAsignacion, setIdAsignacion] = useState('');
    const [abierta, setAbierta] = useState<number | null>(null);
    const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
    const [nueva, setNueva] = useState(NUEVA);
    const [ocupado, setOcupado] = useState(false);
    const [error, setError] = useState('');

    const ejecutar = async (accion: () => Promise<void>) => {
        setOcupado(true);
        setError('');
        try {
            await accion();
        } catch (err) {
            setError(mensajeError(err));
        } finally {
            setOcupado(false);
        }
    };

    useEffect(() => {
        void ejecutar(async () => {
            const [listaProyectos, catalogos] = await Promise.all([
                obtenerLista<ProyectoOpcion>('/proyectos', { todos: 1, per_page: 100 }),
                api.get<{ riesgos_criticos: Riesgo[] }>('/catalogos-seguridad'),
            ]);
            setProyectos(listaProyectos);
            setRiesgos(catalogos.data.riesgos_criticos);
        });
    }, []);

    useEffect(() => {
        setIdAsignacion('');
        setAsignaciones([]);
        if (idProyecto) {
            void ejecutar(async () => setAsignaciones(await obtenerLista<AsignacionOpcion>('/asignaciones', { id_proyecto: idProyecto, per_page: 100 })));
        }
    }, [idProyecto]);

    const cargarActividades = useCallback(async () => {
        setActividades(idAsignacion ? await obtenerLista<Actividad>('/actividades', { id_asignacion: idAsignacion }) : []);
    }, [idAsignacion]);

    useEffect(() => {
        setAbierta(null);
        void ejecutar(cargarActividades);
    }, [cargarActividades]);

    const crear = (e: FormEvent) => {
        e.preventDefault();
        void ejecutar(async () => {
            await api.post('/actividades', {
                id_asignacion: Number(idAsignacion),
                nombre: nueva.nombre,
                estado: 'pendiente',
                id_riesgo_critico: nueva.id_riesgo_critico ? Number(nueva.id_riesgo_critico) : null,
                fecha_inicio: nueva.fecha_inicio || null,
                fecha_termino: nueva.fecha_termino || null,
            });
            setNueva(NUEVA);
            await cargarActividades();
        });
    };

    const actualizar = (actividad: Actividad, cambios: Partial<Actividad>) =>
        void ejecutar(async () => {
            await api.put(`/actividades/${actividad.id_actividad}`, cambios);
            await cargarActividades();
            if (abierta === actividad.id_actividad) {
                const { data } = await api.get<Trabajador[]>(`/actividades/${actividad.id_actividad}/trabajadores`);
                setTrabajadores(data);
            }
        });

    const verTrabajadores = (id: number) =>
        void ejecutar(async () => {
            const { data } = await api.get<Trabajador[]>(`/actividades/${id}/trabajadores`);
            setTrabajadores(data);
            setAbierta(id);
        });

    const asignar = (id: number, idTrabajador: number) =>
        void ejecutar(async () => {
            const { data } = await api.post<Trabajador[]>(`/actividades/${id}/trabajadores`, { id_trabajador: idTrabajador });
            setTrabajadores(data);
        });

    const desasignar = (id: number, idTrabajador: number) =>
        void ejecutar(async () => {
            const { data } = await api.delete<Trabajador[]>(`/actividades/${id}/trabajadores/${idTrabajador}`);
            setTrabajadores(data);
        });

    return (
        <MainLayout>
            <Head title="Actividades | AVA" />

            <div className="max-w-[1200px] mx-auto p-6 lg:p-8 space-y-4">
                {error && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{error}</p>}

                <section className="bg-white border border-verde-3 rounded-xl p-5 shadow-sm grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-semibold text-gris-1">
                        Proyecto
                        <select value={idProyecto} onChange={(e) => setIdProyecto(e.target.value)} className={CAMPO_FORMULARIO}>
                            <option value="">Selecciona un proyecto</option>
                            {proyectos.map((p) => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}
                        </select>
                    </label>
                    <label className="text-xs font-semibold text-gris-1">
                        Cuadrilla asignada
                        <select value={idAsignacion} onChange={(e) => setIdAsignacion(e.target.value)} disabled={!idProyecto} className={CAMPO_FORMULARIO}>
                            <option value="">Selecciona una cuadrilla</option>
                            {asignaciones.map((a) => (
                                <option key={a.id_asignacion} value={a.id_asignacion}>{a.cuadrilla?.numero_cuadrilla ?? `Cuadrilla ${a.id_cuadrilla}`}</option>
                            ))}
                        </select>
                    </label>
                </section>

                {idAsignacion && (
                    <>
                        <form onSubmit={crear} className="bg-white border border-verde-3 rounded-xl p-5 shadow-sm grid gap-3 md:grid-cols-5 md:items-end">
                            <label className="text-xs font-semibold text-gris-1 md:col-span-2">
                                Nueva actividad
                                <input required maxLength={255} value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} className={CAMPO_FORMULARIO} />
                            </label>
                            <label className="text-xs font-semibold text-gris-1">
                                Riesgo crítico
                                <select value={nueva.id_riesgo_critico} onChange={(e) => setNueva({ ...nueva, id_riesgo_critico: e.target.value })} className={CAMPO_FORMULARIO}>
                                    <option value="">Sin indicar</option>
                                    {riesgos.map((r) => <option key={r.id_riesgo_critico} value={r.id_riesgo_critico}>{r.nombre}</option>)}
                                </select>
                            </label>
                            <label className="text-xs font-semibold text-gris-1">
                                Inicio
                                <input type="date" value={nueva.fecha_inicio} onChange={(e) => setNueva({ ...nueva, fecha_inicio: e.target.value })} className={CAMPO_FORMULARIO} />
                            </label>
                            <button type="submit" disabled={ocupado} className={BOTON_PRIMARIO}>Agregar</button>
                        </form>

                        <ul className="space-y-3">
                            {actividades.map((a) => (
                                <li key={a.id_actividad} className="bg-white border border-verde-3 rounded-xl p-4 shadow-sm">
                                    <div className="grid gap-3 md:grid-cols-[1fr_12rem_10rem_auto] md:items-end">
                                        <div>
                                            <p className="font-bold text-gris-2">{a.nombre}</p>
                                            <p className="text-xs text-gris-1">{a.fecha_inicio ?? 'Sin inicio'} → {a.fecha_termino ?? 'en curso'}</p>
                                        </div>
                                        <label className="text-xs font-semibold text-gris-1">
                                            Riesgo crítico
                                            <select
                                                value={a.id_riesgo_critico ?? ''}
                                                onChange={(e) => actualizar(a, { id_riesgo_critico: e.target.value ? Number(e.target.value) : null })}
                                                className={CAMPO_FORMULARIO}
                                            >
                                                <option value="">Sin indicar</option>
                                                {riesgos.map((r) => <option key={r.id_riesgo_critico} value={r.id_riesgo_critico}>{r.nombre}</option>)}
                                            </select>
                                        </label>
                                        <label className="text-xs font-semibold text-gris-1">
                                            Estado
                                            <select value={a.estado} onChange={(e) => actualizar(a, { estado: e.target.value })} className={CAMPO_FORMULARIO}>
                                                {ESTADOS.map(([valor, nombre]) => <option key={valor} value={valor}>{nombre}</option>)}
                                            </select>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => (abierta === a.id_actividad ? setAbierta(null) : verTrabajadores(a.id_actividad))}
                                            className="text-sm font-bold text-verde-6 hover:underline"
                                        >
                                            {abierta === a.id_actividad ? 'Ocultar' : 'Trabajadores'}
                                        </button>
                                    </div>

                                    {abierta === a.id_actividad && (
                                        <ul className="mt-3 divide-y divide-verde-3 border-t border-verde-3">
                                            {trabajadores.map((t) => (
                                                <li key={t.id_trabajador} className="py-2 flex flex-wrap items-center justify-between gap-3 text-sm">
                                                    <span className="text-gris-2">{t.nombre} <span className="text-xs text-gris-1">{t.cargo ?? ''}</span></span>
                                                    {t.id_actividad_actual === a.id_actividad ? (
                                                        <button type="button" disabled={ocupado} onClick={() => desasignar(a.id_actividad, t.id_trabajador)} className="text-xs font-bold text-rojo-1 hover:underline">
                                                            Desasignar
                                                        </button>
                                                    ) : t.id_actividad_actual ? (
                                                        <span className="text-xs text-gris-1">Ocupado en: {t.actividad_actual}</span>
                                                    ) : (
                                                        <button type="button" disabled={ocupado || a.estado === 'completada'} onClick={() => asignar(a.id_actividad, t.id_trabajador)} className="text-xs font-bold text-verde-6 hover:underline disabled:opacity-50">
                                                            Asignar
                                                        </button>
                                                    )}
                                                </li>
                                            ))}
                                            {trabajadores.length === 0 && <li className="py-3 text-sm text-gris-1">Esta cuadrilla no tiene integrantes.</li>}
                                        </ul>
                                    )}
                                </li>
                            ))}
                            {!ocupado && actividades.length === 0 && <li className="text-sm text-gris-1">Esta asignación no tiene actividades.</li>}
                        </ul>
                    </>
                )}
            </div>
        </MainLayout>
    );
}
