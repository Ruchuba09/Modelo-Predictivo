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
                        <h1 className="mb-1 text-2xl font-bold text-gris-2">Situaciones críticas</h1>
                        <p className="text-sm text-gris-1">Registro de eventos críticos y su seguimiento.</p>
                    </div>
                    <Link
                        href="/situacion-criticas/crear"
                        className="flex items-center gap-2 rounded-lg bg-verde-5 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-verde-5/10 transition-colors hover:bg-verde-6"
                    >
                        <span className="text-lg leading-none">+</span> Nueva situación crítica
                    </Link>
                </div>

                <div className="overflow-hidden rounded-xl border border-verde-3 bg-white">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-verde-3 text-left text-gris-1">
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
                                <tr key={situacionCritica.id} className="border-b border-verde-3 transition-colors last:border-0 hover:bg-verde-1">
                                    <td className="px-6 py-4 text-gris-2">{nombreTrabajador(situacionCritica.trabajador)}</td>
                                    <td className="px-6 py-4 text-gris-2">{nombreTrabajador(situacionCritica.supervisor?.trabajador)}</td>
                                    <td className="px-6 py-4 text-gris-2">{situacionCritica.evento?.descripcion ?? '—'}</td>
                                    <td className="px-6 py-4 text-gris-2">{situacionCritica.referencia}</td>
                                    <td className="px-6 py-4">
                                        <span className="rounded-md border border-verde-5/20 bg-verde-2 px-2 py-1 text-xs text-verde-6">
                                            {CONDICION_LABEL[situacionCritica.condicion] ?? situacionCritica.condicion}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/situacion-criticas/${situacionCritica.id}`}
                                                className="rounded-md border border-verde-3 px-3 py-1.5 text-xs font-medium text-gris-1 transition-colors hover:border-verde-4 hover:text-gris-2"
                                            >
                                                Detalles
                                            </Link>
                                            <Link
                                                href={`/situacion-criticas/${situacionCritica.id}/editar`}
                                                className="rounded-md border border-verde-5/20 px-3 py-1.5 text-xs font-medium text-verde-6 transition-colors hover:border-verde-5/40 hover:text-verde-6"
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
                                    <td colSpan={6} className="px-6 py-10 text-center text-gris-1">
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
