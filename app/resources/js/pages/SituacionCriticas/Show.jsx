import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const CONDICION_LABEL = {
    1: 'Leve',
    2: 'Grave',
};

function nombreTrabajador(trabajador) {
    if (!trabajador) return '—';
    return `${trabajador.nombre_1} ${trabajador.apellido_1}`;
}

function Campo({ label, children }) {
    return (
        <div>
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{children}</dd>
        </div>
    );
}

export default function Show({ situacionCritica }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Detalle de situación crítica
                </h2>
            }
        >
            <Head title="Detalle de situación crítica" />

            <div className="py-8">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="rounded-lg bg-white p-6 shadow">
                        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <Campo label="Trabajador">
                                {nombreTrabajador(situacionCritica.trabajador)}
                            </Campo>
                            <Campo label="Supervisor">
                                {nombreTrabajador(situacionCritica.supervisor?.trabajador)}
                            </Campo>
                            <Campo label="Evento">{situacionCritica.evento?.descripcion ?? '—'}</Campo>
                            <Campo label="Condición">
                                {CONDICION_LABEL[situacionCritica.condicion] ?? situacionCritica.condicion}
                            </Campo>
                            <div className="sm:col-span-2">
                                <Campo label="Referencia">{situacionCritica.referencia}</Campo>
                            </div>
                        </dl>

                        <div className="mt-8 flex justify-between border-t border-gray-100 pt-6">
                            <Link
                                href={route('situacion-criticas.index')}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                ← Volver al listado
                            </Link>
                            <Link
                                href={route('situacion-criticas.edit', situacionCritica.id)}
                                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                            >
                                Editar
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
