import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { etiquetaCondicion, useCondicionesPare } from '../../lib/condicionesPare';
import { inputClass, labelClass, nombreTrabajador, type SituacionCritica, type Supervisor, type Trabajador } from './tipos';

type Filtros = { id_trabajador?: string | number; id_supervisor?: string | number; id_evento?: string | number };

interface IndexProps {
    situacionCriticas: SituacionCritica[];
    filtros: Filtros;
    trabajadores: Trabajador[];
    supervisores: Supervisor[];
    eventos: number[];
    puedeGestionar: boolean;
}

/** RF-16: consulta de Situaciones Críticas con filtros combinables. */
export default function Index({ situacionCriticas, filtros, trabajadores, supervisores, eventos, puedeGestionar }: IndexProps) {
    const condiciones = useCondicionesPare();
    const hayFiltros = Object.values(filtros).some((v) => v !== undefined && v !== null && v !== '');

    const filtrar = (campo: keyof Filtros, valor: string) => {
        const nuevos = { ...filtros, [campo]: valor };
        const limpios = Object.fromEntries(Object.entries(nuevos).filter(([, v]) => v !== '' && v !== undefined && v !== null));
        router.get('/situacion-criticas', limpios, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <MainLayout>
            <Head title="Situaciones críticas | AVA" />

            <div className="mx-auto max-w-[1400px] p-6 lg:p-8">
                <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <h1 className="mb-1 text-2xl font-bold text-gris-2">Situaciones críticas</h1>
                        <p className="text-sm text-gris-1">
                            Copia sincronizada de cada Tarjeta PARE, con historial de cambios.
                        </p>
                    </div>
                    {puedeGestionar && (
                        <Link
                            href="/situacion-criticas/crear"
                            className="flex items-center gap-2 rounded-lg bg-verde-5 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-verde-5/10 transition-colors hover:bg-verde-6"
                        >
                            <span className="text-lg leading-none">+</span> Nueva situación crítica
                        </Link>
                    )}
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-verde-3 bg-white p-4 md:grid-cols-4">
                    <div>
                        <label htmlFor="f_trabajador" className={labelClass}>Trabajador</label>
                        <select
                            id="f_trabajador"
                            className={inputClass}
                            value={String(filtros.id_trabajador ?? '')}
                            onChange={(e) => filtrar('id_trabajador', e.target.value)}
                        >
                            <option value="">Todos</option>
                            {trabajadores.map((t) => (
                                <option key={t.id_trabajador} value={t.id_trabajador}>{nombreTrabajador(t)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="f_supervisor" className={labelClass}>Supervisor</label>
                        <select
                            id="f_supervisor"
                            className={inputClass}
                            value={String(filtros.id_supervisor ?? '')}
                            onChange={(e) => filtrar('id_supervisor', e.target.value)}
                        >
                            <option value="">Todos</option>
                            {supervisores.map((s) => (
                                <option key={s.id_trabajador} value={s.id_trabajador}>{nombreTrabajador(s.trabajador)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="f_evento" className={labelClass}>Tarjeta PARE</label>
                        <select
                            id="f_evento"
                            className={inputClass}
                            value={String(filtros.id_evento ?? '')}
                            onChange={(e) => filtrar('id_evento', e.target.value)}
                        >
                            <option value="">Todas</option>
                            {eventos.map((id) => (
                                <option key={id} value={id}>Evento #{id}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        {hayFiltros && (
                            <button
                                type="button"
                                onClick={() => router.get('/situacion-criticas', {}, { preserveScroll: true, replace: true })}
                                className="rounded-lg border border-verde-3 px-4 py-2 text-sm text-gris-1 hover:border-verde-4 hover:text-gris-2"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-verde-3 bg-white">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-verde-3 text-left text-gris-1">
                                <th className="px-6 py-4 font-medium">Evento</th>
                                <th className="px-6 py-4 font-medium">Trabajador</th>
                                <th className="px-6 py-4 font-medium">Supervisor</th>
                                <th className="px-6 py-4 font-medium">Referencia</th>
                                <th className="px-6 py-4 font-medium">Condición</th>
                                <th className="px-6 py-4 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {situacionCriticas.map((s) => (
                                <tr key={s.id} className="border-b border-verde-3 transition-colors last:border-0 hover:bg-verde-1">
                                    <td className="px-6 py-4 text-gris-2">
                                        <Link href={`/eventos/${s.id_evento}`} className="hover:underline">#{s.id_evento}</Link>
                                    </td>
                                    <td className="px-6 py-4 text-gris-2">{nombreTrabajador(s.trabajador)}</td>
                                    <td className="px-6 py-4 text-gris-2">{nombreTrabajador(s.supervisor?.trabajador)}</td>
                                    <td className="px-6 py-4 text-gris-2">{s.referencia ?? '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className="rounded-md border border-verde-5/20 bg-verde-2 px-2 py-1 text-xs text-verde-6">
                                            {etiquetaCondicion(condiciones, s.condicion)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/situacion-criticas/${s.id}`}
                                                className="rounded-md border border-verde-3 px-3 py-1.5 text-xs font-medium text-gris-1 transition-colors hover:border-verde-4 hover:text-gris-2"
                                            >
                                                Detalles
                                            </Link>
                                            {puedeGestionar && (
                                                <Link
                                                    href={`/situacion-criticas/${s.id}/editar`}
                                                    className="rounded-md border border-verde-5/20 px-3 py-1.5 text-xs font-medium text-verde-6 transition-colors hover:border-verde-5/40"
                                                >
                                                    Editar
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {situacionCriticas.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gris-1">
                                        No se encontraron situaciones críticas
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    );
}
