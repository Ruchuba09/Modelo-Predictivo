import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import CerrarEvento from '@/components/eventos/CerrarEvento';
const ESTADO_STYLES: { [key: string]: string } = {
    abierto: 'bg-[#a0f700]/10 text-[#a0f700] border-[#a0f700]/40',
    en_revision: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/40',
    proceso: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/40',
    cerrado: 'bg-[#7a7f85]/10 text-[#7a7f85] border-[#7a7f85]/40',
    cerrada: 'bg-[#7a7f85]/10 text-[#7a7f85] border-[#7a7f85]/40',
};

interface Evento {
    id_evento: number;
    id_tipo_evento: number;
    condicion: number;
    descripcion: string;
    referencia: string;
    estado: string;
    fecha_creacion?: string;
    tipoEvento?: { id_tipo_evento: number; nombre: string };
    proyecto?: { id_proyecto: number; nombre: string };
    area?: { id_area: number; nombre: string } | null;
}

function EstadoBadge({ estado }: { estado: string }) {
    const style = ESTADO_STYLES[estado] ?? ESTADO_STYLES['abierto'];
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border whitespace-nowrap ${style}`}>
            {estado.replace('_', ' ')}
        </span>
    );
}

export default function Index() {
    const { eventos } = usePage().props as unknown as { eventos: Evento[] };
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');

    const estadosDisponibles = Array.from(new Set(eventos.map((e) => e.estado)));

    const eventosFiltrados =
        filtroEstado === 'todos' ? eventos : eventos.filter((e) => e.estado === filtroEstado);

    return (
        <MainLayout>
            <Head title="Eventos | AVA" />

            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 lg:mt-2">
                <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Eventos</h1>
                        <p className="text-[#7a7f85] text-sm">Listado de reportes registrados.</p>
                    </div>

                    <Link
                        href={route('eventos.create')}
                        className="px-5 py-3 rounded-lg text-sm font-bold bg-[#a0f700] hover:bg-[#86cf00] text-black transition-colors shadow-lg shadow-[#a0f700]/20"
                    >
                        + Nuevo evento
                    </Link>
                </div>

                {/* Filtros por estado */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setFiltroEstado('todos')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase border transition-colors ${
                            filtroEstado === 'todos'
                                ? 'bg-[#a0f700] text-black border-[#a0f700]'
                                : 'bg-[#141414] border-[#2d3238] text-[#7a7f85] hover:border-[#7a7f85]'
                        }`}
                    >
                        Todos ({eventos.length})
                    </button>
                    {estadosDisponibles.map((estado) => (
                        <button
                            key={estado}
                            onClick={() => setFiltroEstado(estado)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase border transition-colors ${
                                filtroEstado === estado
                                    ? 'bg-[#a0f700] text-black border-[#a0f700]'
                                    : 'bg-[#141414] border-[#2d3238] text-[#7a7f85] hover:border-[#7a7f85]'
                            }`}
                        >
                            {estado.replace('_', ' ')} ({eventos.filter((e) => e.estado === estado).length})
                        </button>
                    ))}
                </div>

                {/* Tabla */}
                <div className="bg-[#141414] border border-[#2d3238] rounded-2xl shadow-2xl overflow-hidden">
                    {eventosFiltrados.length === 0 ? (
                        <div className="p-10 text-center text-[#7a7f85] text-sm">
                            No hay eventos {filtroEstado !== 'todos' ? `en estado "${filtroEstado}"` : 'registrados'}.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#2d3238] text-left">
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            #
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            Tipo de evento
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            Referencia
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            Proyecto
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            Condición
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            Fecha
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            Estado
                                        </th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventosFiltrados.map((evento) => (
                                        <tr
                                            key={evento.id_evento}
                                            className="border-b border-[#2d3238]/60 last:border-b-0 hover:bg-[#1a1a1a] transition-colors"
                                        >
                                            <td className="px-6 py-4 text-[#7a7f85] font-bold">
                                                #{evento.id_evento}
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                {evento.tipoEvento?.nombre ?? `Tipo #${evento.id_tipo_evento}`}
                                            </td>
                                            <td className="px-6 py-4 text-[#7a7f85]">
                                                {evento.referencia || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-[#7a7f85]">
                                                {evento.proyecto?.nombre ?? '—'}
                                            </td>
                                            <td className="px-6 py-4 text-[#7a7f85]">#{evento.condicion}</td>
                                            <td className="px-6 py-4 text-[#7a7f85]">
                                                {evento.fecha_creacion
                                                    ? new Date(evento.fecha_creacion).toLocaleDateString('es-CL')
                                                    : '—'}
                                            </td>
                                            
                                            <td className="px-6 py-4">
                                                <CerrarEvento eventoId={evento.id_evento} estado={evento.estado} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <EstadoBadge estado={evento.estado} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={route('eventos.show', evento.id_evento)}
                                                    className="text-[#a0f700] hover:underline font-bold text-xs uppercase"
                                                >
                                                    Ver →
                                                </Link>
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
