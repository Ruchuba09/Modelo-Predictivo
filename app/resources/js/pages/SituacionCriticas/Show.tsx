import { Head, Link } from '@inertiajs/react';
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

interface ShowProps {
    situacionCritica: SituacionCritica;
}

const CONDICION_LABEL: Record<string, string> = {
    '1': 'Leve',
    '2': 'Grave',
};

function nombreTrabajador(trabajador?: Trabajador) {
    if (!trabajador) return '—';
    return `${trabajador.nombre_1} ${trabajador.apellido_1}`;
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-sm font-medium text-[#7a7f85]">{label}</dt>
            <dd className="mt-1 text-sm text-white">{children}</dd>
        </div>
    );
}

export default function Show({ situacionCritica }: ShowProps) {
    return (
        <MainLayout>
            <Head title="Detalle de situación crítica | AVA" />

            <div className="mx-auto max-w-2xl p-6 lg:p-8">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-white">Detalle de situación crítica</h1>
                    <p className="text-sm text-[#7a7f85]">Información completa del evento crítico registrado.</p>
                </div>

                <div className="rounded-xl border border-white/5 bg-[#15181c] p-6">
                    <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <Campo label="Trabajador">{nombreTrabajador(situacionCritica.trabajador)}</Campo>
                        <Campo label="Supervisor">{nombreTrabajador(situacionCritica.supervisor?.trabajador)}</Campo>
                        <Campo label="Evento">{situacionCritica.evento?.descripcion ?? '—'}</Campo>
                        <Campo label="Condición">
                            {CONDICION_LABEL[situacionCritica.condicion] ?? situacionCritica.condicion}
                        </Campo>
                        <div className="sm:col-span-2">
                            <Campo label="Referencia">{situacionCritica.referencia}</Campo>
                        </div>
                    </dl>

                    <div className="mt-8 flex justify-between border-t border-white/5 pt-6">
                        <Link href="/situacion-criticas" className="text-sm text-[#7a7f85] hover:text-white">
                            ← Volver al listado
                        </Link>
                        <Link
                            href={`/situacion-criticas/${situacionCritica.id}/editar`}
                            className="rounded-lg bg-[#a0f700] px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-[#a0f700]/10 transition-colors hover:bg-[#86cf00]"
                        >
                            Editar
                        </Link>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
