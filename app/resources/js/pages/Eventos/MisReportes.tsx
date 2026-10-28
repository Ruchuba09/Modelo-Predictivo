import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

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
    const { eventos = [] } = usePage().props as unknown as Props;

    return (
        <MainLayout>
            <Head title="Mis Reportes | AVA" />

            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 flex flex-col h-full min-h-[calc(100vh-80px)]">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gris-2 mb-1">
                            Mis Reportes
                        </h1>
                        <p className="text-gris-1 text-sm">
                            Reportes registrados donde estás involucrado.
                        </p>
                    </div>

                    <div className="bg-white border border-verde-3 rounded-2xl px-5 py-2.5 shadow-sm flex items-center gap-3">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gris-1 font-bold">Total</p>
                            <p className="text-2xl font-black text-gris-2">{eventos.length}</p>
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white border border-verde-3 rounded-2xl shadow-2xl overflow-hidden flex-1 flex flex-col min-h-0">
                    {eventos.length === 0 ? (
                        <div className="p-10 text-center text-gris-1 text-sm">
                            No tienes reportes registrados en este momento.
                        </div>
                    ) : (
                        <div className="overflow-auto flex-1 relative">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                    <tr className="border-b border-verde-3 text-left">
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold text-center w-16">
                                            ID
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Área/Zona
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Proyecto
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold text-center">
                                            Condición
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold text-center">
                                            Fecha
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold text-center">
                                            Estado
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold text-center">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventos.map((evento) => (
                                        <tr
                                            key={evento.id_evento}
                                            className="border-b border-verde-3/60 last:border-b-0 hover:bg-verde-2 transition-colors"
                                        >
                                            {/* ID */}
                                            <td className="px-6 py-4 text-gris-1 font-bold text-center">
                                                {evento.id_evento}
                                            </td>

                                            {/* Área/Zona */}
                                            <td className="px-6 py-4 text-gris-1">
                                                {evento.referencia ?? '—'}
                                            </td>

                                            {/* Proyecto */}
                                            <td className="px-6 py-4 text-gris-1">
                                                {evento.proyecto?.nombre ?? '—'}
                                            </td>

                                            {/* Condición */}
                                            <td className="px-6 py-4 text-gris-1 font-bold text-center whitespace-nowrap">
                                                {evento.condicion != null
                                                    ? Number(evento.condicion)
                                                    : '—'}
                                            </td>

                                            {/* Fecha */}
                                            <td className="px-6 py-4 text-gris-1 text-center whitespace-nowrap">
                                                {evento.fecha_creacion
                                                    ? new Date(evento.fecha_creacion).toLocaleDateString('es-CL')
                                                    : '—'}
                                            </td>

                                            {/* Estado */}
                                            <td className="px-6 py-4 text-center">
                                                <EstadoBadge estado={evento.estado} />
                                            </td>

                                            {/* Acciones */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center">
                                                    <Link
                                                        href={route('eventos.show', evento.id_evento)}
                                                        className="text-verde-6 hover:underline font-bold text-xs uppercase"
                                                    >
                                                        Ver ➔
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
