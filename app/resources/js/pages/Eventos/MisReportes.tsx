import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import CerrarEvento from '@/components/eventos/CerrarEvento';

const ESTADO_STYLES: { [key: string]: string } = {
    abierta: 'bg-verde-5/10 text-verde-6 border-verde-5/40',
    en_revision: 'bg-amarillo-1/10 text-amarillo-1 border-amarillo-1/40',
    proceso: 'bg-amarillo-1/10 text-amarillo-1 border-amarillo-1/40',
    cerrada: 'bg-gris-1/10 text-gris-1 border-gris-1/40',
};

interface Evento {
    id_evento: number;
    id_tipo_evento: number;
    id_trabajador: number;
    condicion: number;
    descripcion: string;
    referencia: string;
    estado: string;
    fecha_creacion?: string;

    tipoEvento?: {
        id_tipo_evento: number;
        nombre: string;
    };

    proyecto?: {
        id_proyecto: number;
        nombre: string;
    };
}

interface Props {
    eventos: Evento[];
}

function EstadoBadge({ estado }: { estado: string }) {
    const style = ESTADO_STYLES[estado] ?? ESTADO_STYLES['abierta'];

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase border whitespace-nowrap ${style}`}
        >
            {estado.replace('_', ' ')}
        </span>
    );
}

export default function MisReportes() {
    const { eventos } = usePage().props as unknown as Props;

    return (
        <MainLayout>
            <Head title="Mis Reportes | AVA" />

            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 flex flex-col h-full min-h-[calc(100vh-80px)]">

                {/* Header */}
                <div className="mb-6 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gris-2 mb-1">
                            Mis Reportes
                        </h1>

                        <p className="text-gris-1 text-sm">
                            Reportes registrados donde estás involucrado.
                        </p>
                    </div>

                    <div className="bg-verde-2 border border-verde-3 rounded-xl px-5 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-gris-1 font-bold">
                            Mis reportes
                        </p>

                        <p className="text-2xl font-bold text-verde-6">
                            {eventos.length}
                        </p>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white border border-verde-3 rounded-2xl shadow-2xl overflow-hidden flex-1 flex flex-col min-h-0">

                    {eventos.length === 0 ? (

                        <div className="flex flex-col items-center justify-center flex-1 p-10 text-center">

                            <div className="w-16 h-16 rounded-full bg-verde-2 flex items-center justify-center mb-4">
                                <svg
                                    className="w-8 h-8 text-verde-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414A1 1 0 0118 8.414V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>

                            <h2 className="text-lg font-bold text-gris-2">
                                No tienes reportes
                            </h2>

                            <p className="text-sm text-gris-1 mt-1">
                                No existen reportes asociados a tu usuario.
                            </p>
                        </div>

                    ) : (

                        <div className="overflow-auto flex-1 relative">

                            <table className="w-full text-sm">

                                <thead className="sticky top-0 bg-white z-10 shadow-sm">

                                    <tr className="border-b border-verde-3 text-left">

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            #
                                        </th>

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Referencia
                                        </th>

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Tipo
                                        </th>

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Proyecto
                                        </th>

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Condición
                                        </th>

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Fecha
                                        </th>

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Estado
                                        </th>

                                        <th className="px-6 py-4"></th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {eventos.map((evento) => (

                                        <tr
                                            key={evento.id_evento}
                                            className="border-b border-verde-3/60 last:border-b-0 hover:bg-verde-2 transition-colors"
                                        >

                                            {/* ID */}
                                            <td className="px-6 py-4 text-gris-1 font-bold">
                                                #{evento.id_evento}
                                            </td>

                                            {/* Referencia */}
                                            <td className="px-6 py-4 text-gris-2 font-medium">
                                                {evento.referencia || 'Sin referencia'}
                                            </td>

                                            {/* Tipo */}
                                            <td className="px-6 py-4 text-gris-1">
                                                {evento.tipoEvento?.nombre ?? '—'}
                                            </td>

                                            {/* Proyecto */}
                                            <td className="px-6 py-4 text-gris-1">
                                                {evento.proyecto?.nombre ?? '—'}
                                            </td>

                                            {/* Condición */}
                                            <td className="px-6 py-4 text-gris-1">
                                                #{evento.condicion}
                                            </td>

                                            {/* Fecha */}
                                            <td className="px-6 py-4 text-gris-1">
                                                {evento.fecha_creacion
                                                    ? new Date(
                                                        evento.fecha_creacion
                                                    ).toLocaleDateString('es-CL')
                                                    : '—'}
                                            </td>

                                            {/* Estado */}
                                            <td className="px-6 py-4">
                                                <EstadoBadge
                                                    estado={evento.estado}
                                                />
                                            </td>

                                            {/* Acciones */}
                                            <td className="px-6 py-4 text-right">

                                                <div className="flex items-center justify-end gap-3">

                                                    <CerrarEvento
                                                        eventoId={evento.id_evento}
                                                        estado={evento.estado}
                                                    />

                                                    <Link
                                                        href={route(
                                                            'eventos.show',
                                                            evento.id_evento
                                                        )}
                                                        className="text-verde-6 hover:underline font-bold text-xs uppercase"
                                                    >
                                                        Ver →
                                                    </Link>

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
        </MainLayout>
    );
}