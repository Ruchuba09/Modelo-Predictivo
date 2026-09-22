import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Trabajador {
    id_trabajador: number;
    nombre_1: string;
    apellido_1: string;
}

interface Supervisor {
    id_trabajador: number;
    trabajador?: Trabajador;
}

interface Evento {
    id_evento: number;
    descripcion: string;
}

interface SituacionCritica {
    id: number;
    referencia: string;
    condicion: string;
    trabajador?: Trabajador;
    supervisor?: Supervisor;
    evento?: Evento;
}

interface IndexProps {
    situacionCriticas: SituacionCritica[];
}

const CONDICION_LABEL: Record<string, string> = {
    '1': 'Leve',
    '2': 'Grave',
};

function nombreTrabajador(trabajador?: Trabajador) {
    if (!trabajador) return '—';
    return `${trabajador.nombre_1} ${trabajador.apellido_1}`;
}

export default function Index({ situacionCriticas }: IndexProps) {
    const eliminar = (situacionCritica: SituacionCritica) => {
        if (confirm('¿Seguro que quieres eliminar esta situación crítica? Esta acción no se puede deshacer.')) {
            router.delete(`/situacion-criticas/${situacionCritica.id}`);
        }
    };

    return (
        <MainLayout>
            <Head title="Situaciones críticas | AVA" />

            <div className="mx-auto max-w-[1400px] p-6 lg:p-8">
                <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <h1 className="mb-1 text-2xl font-bold text-white">Situaciones críticas</h1>
                        <p className="text-sm text-[#7a7f85]">Registro de eventos críticos y su seguimiento.</p>
                    </div>
                    <Link
                        href="/situacion-criticas/crear"
                        className="flex items-center gap-2 rounded-lg bg-[#a0f700] px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-[#a0f700]/10 transition-colors hover:bg-[#86cf00]"
                    >
                        <span className="text-lg leading-none">+</span> Nueva situación crítica
                    </Link>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/5 bg-[#15181c]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-left text-[#7a7f85]">
                                <th className="px-6 py-4 font-medium">Trabajador</th>
                                <th className="px-6 py-4 font-medium">Supervisor</th>
                                <th className="px-6 py-4 font-medium">Evento</th>
                                <th className="px-6 py-4 font-medium">Referencia</th>
                                <th className="px-6 py-4 font-medium">Condición</th>
                                <th className="px-6 py-4 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {situacionCriticas.map((situacionCritica) => (
                                <tr key={situacionCritica.id} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.02]">
                                    <td className="px-6 py-4 text-white">{nombreTrabajador(situacionCritica.trabajador)}</td>
                                    <td className="px-6 py-4 text-white">{nombreTrabajador(situacionCritica.supervisor?.trabajador)}</td>
                                    <td className="px-6 py-4 text-white">{situacionCritica.evento?.descripcion ?? '—'}</td>
                                    <td className="px-6 py-4 text-white">{situacionCritica.referencia}</td>
                                    <td className="px-6 py-4">
                                        <span className="rounded-md border border-[#a0f700]/20 bg-white/5 px-2 py-1 text-xs text-[#a0f700]">
                                            {CONDICION_LABEL[situacionCritica.condicion] ?? situacionCritica.condicion}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/situacion-criticas/${situacionCritica.id}`}
                                                className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-[#7a7f85] transition-colors hover:border-white/20 hover:text-white"
                                            >
                                                Detalles
                                            </Link>
                                            <Link
                                                href={`/situacion-criticas/${situacionCritica.id}/editar`}
                                                className="rounded-md border border-[#a0f700]/20 px-3 py-1.5 text-xs font-medium text-[#a0f700] transition-colors hover:border-[#a0f700]/40 hover:text-[#86cf00]"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                onClick={() => eliminar(situacionCritica)}
                                                className="rounded-md border border-red-400/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-400/40 hover:text-red-300"
                                            >
                                                Borrar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {situacionCriticas.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-[#7a7f85]">
                                        No hay situaciones críticas registradas todavía.
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
