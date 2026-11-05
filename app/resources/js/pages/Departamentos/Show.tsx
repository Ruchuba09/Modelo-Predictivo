import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Trabajador {
    id_trabajador: number;
    cargo?: string | null;
    persona?: { nombre_1: string; apellido_1: string } | null;
}

interface Departamento {
    id_departamento: number;
    nombre: string;
    descripcion?: string | null;
    estado?: string;
    trabajadores?: Trabajador[];
}

export default function Show() {
    const { departamento } = usePage().props as unknown as { departamento: Departamento };
    const trabajadores = departamento.trabajadores ?? [];

    return (
        <MainLayout title={departamento.nombre} subtitle={departamento.descripcion ?? undefined}>
            <Head title={`${departamento.nombre} | AVA`} />

            <div className="max-w-[800px] mx-auto p-6 lg:p-8 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <Link href="/departamentos" className="text-sm font-bold text-gris-1 hover:text-gris-2">
                        ← Volver al listado
                    </Link>
                    <Link
                        href={`/departamentos/${departamento.id_departamento}/edit`}
                        className="px-4 py-2.5 rounded-lg text-sm font-bold bg-verde-5 hover:bg-verde-6 text-black"
                    >
                        Editar
                    </Link>
                </div>

                <section className="bg-white border border-verde-3 rounded-xl p-6 shadow-lg">
                    <p className="text-xs font-bold uppercase tracking-wider text-gris-1">Estado</p>
                    <p className="text-sm text-gris-2 capitalize mb-4">{departamento.estado ?? '—'}</p>

                    <h2 className="text-sm font-bold text-gris-2 mb-2">Trabajadores ({trabajadores.length})</h2>
                    {trabajadores.length === 0 ? (
                        <p className="text-sm text-gris-1">Este departamento no tiene trabajadores asignados.</p>
                    ) : (
                        <ul className="divide-y divide-verde-3">
                            {trabajadores.map((t) => (
                                <li key={t.id_trabajador} className="py-2 flex justify-between gap-3 text-sm">
                                    <span className="text-gris-2">
                                        {t.persona ? `${t.persona.nombre_1} ${t.persona.apellido_1}` : `Trabajador ${t.id_trabajador}`}
                                    </span>
                                    <span className="text-gris-1">{t.cargo ?? ''}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </MainLayout>
    );
}
