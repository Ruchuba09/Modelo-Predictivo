import { Head, Link } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { etiquetaCondicion, useCondicionesPare } from '../../lib/condicionesPare';
import { botonPrimario, nombreTrabajador, type SituacionCritica } from './tipos';

interface EntradaHistorial {
    id_historial: number;
    origen: 'creacion' | 'sincronizacion' | 'edicion_manual' | string;
    campo: string | null;
    valor_anterior: string | null;
    valor_nuevo: string | null;
    usuario: string;
    fecha: string | null;
}

interface ShowProps {
    situacionCritica: SituacionCritica;
    historial: EntradaHistorial[];
    puedeGestionar: boolean;
}

const ORIGENES: Record<string, string> = {
    creacion: 'Creación',
    sincronizacion: 'Sincronización desde la Tarjeta PARE',
    edicion_manual: 'Edición manual',
};

const CAMPOS: Record<string, string> = {
    id_trabajador: 'Trabajador',
    id_supervisor: 'Supervisor',
    referencia: 'Referencia',
    condicion: 'Condición',
};

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-sm font-medium text-gris-1">{label}</dt>
            <dd className="mt-1 text-sm text-gris-2">{children}</dd>
        </div>
    );
}

function formatearFecha(fecha: string | null): string {
    return fecha ? new Date(fecha).toLocaleString('es-CL') : '—';
}

/** RF-16.4: detalle y historial de cambios. */
export default function Show({ situacionCritica, historial, puedeGestionar }: ShowProps) {
    const condiciones = useCondicionesPare();
    const valor = (campo: string | null, v: string | null) => {
        if (v === null || v === '') return '—';
        return campo === 'condicion' ? etiquetaCondicion(condiciones, v) : v;
    };

    return (
        <MainLayout>
            <Head title="Detalle de situación crítica | AVA" />

            <div className="mx-auto max-w-4xl p-6 lg:p-8">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-gris-2">Detalle de situación crítica</h1>
                    <p className="text-sm text-gris-1">Copia sincronizada de la Tarjeta PARE asociada.</p>
                </div>

                <div className="rounded-xl border border-verde-3 bg-white p-6">
                    <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <Campo label="Tarjeta PARE">
                            <Link href={`/eventos/${situacionCritica.id_evento}`} className="text-verde-6 hover:underline">
                                Evento #{situacionCritica.id_evento}
                            </Link>
                            {situacionCritica.evento?.descripcion && (
                                <span className="block text-gris-1">{situacionCritica.evento.descripcion}</span>
                            )}
                        </Campo>
                        <Campo label="Condición">{etiquetaCondicion(condiciones, situacionCritica.condicion)}</Campo>
                        <Campo label="Trabajador">{nombreTrabajador(situacionCritica.trabajador)}</Campo>
                        <Campo label="Supervisor">{nombreTrabajador(situacionCritica.supervisor?.trabajador)}</Campo>
                        <div className="sm:col-span-2">
                            <Campo label="Referencia">{situacionCritica.referencia ?? '—'}</Campo>
                        </div>
                    </dl>

                    <div className="mt-8 flex justify-between border-t border-verde-3 pt-6">
                        <Link href="/situacion-criticas" className="text-sm text-gris-1 hover:text-gris-2">
                            ← Volver al listado
                        </Link>
                        {puedeGestionar && (
                            <Link href={`/situacion-criticas/${situacionCritica.id}/editar`} className={botonPrimario}>
                                Editar
                            </Link>
                        )}
                    </div>
                </div>

                <div className="mt-8 rounded-xl border border-verde-3 bg-white">
                    <h2 className="border-b border-verde-3 px-6 py-4 text-lg font-semibold text-gris-2">Historial de cambios</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-verde-3 text-left text-gris-1">
                                    <th className="px-6 py-3 font-medium">Fecha</th>
                                    <th className="px-6 py-3 font-medium">Origen</th>
                                    <th className="px-6 py-3 font-medium">Campo</th>
                                    <th className="px-6 py-3 font-medium">Valor anterior</th>
                                    <th className="px-6 py-3 font-medium">Valor nuevo</th>
                                    <th className="px-6 py-3 font-medium">Usuario</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historial.map((h) => (
                                    <tr key={h.id_historial} className="border-b border-verde-3 last:border-0">
                                        <td className="whitespace-nowrap px-6 py-3 text-gris-2">{formatearFecha(h.fecha)}</td>
                                        <td className="px-6 py-3 text-gris-2">{ORIGENES[h.origen] ?? h.origen}</td>
                                        <td className="px-6 py-3 text-gris-2">{h.campo ? (CAMPOS[h.campo] ?? h.campo) : '—'}</td>
                                        <td className="px-6 py-3 text-gris-1">{valor(h.campo, h.valor_anterior)}</td>
                                        <td className="px-6 py-3 text-gris-2">{valor(h.campo, h.valor_nuevo)}</td>
                                        <td className="px-6 py-3 text-gris-2">{h.usuario}</td>
                                    </tr>
                                ))}
                                {historial.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gris-1">Sin cambios registrados</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
