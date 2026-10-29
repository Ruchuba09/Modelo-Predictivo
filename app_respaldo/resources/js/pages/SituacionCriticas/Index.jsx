import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const CONDICION_LABEL = {
    1: 'Leve',
    2: 'Grave',
};

function nombreTrabajador(trabajador) {
    if (!trabajador) return '—';
    return `${trabajador.nombre_1} ${trabajador.apellido_1}`;
}

export default function Index({ situacionCriticas }) {
    const eliminar = (situacionCritica) => {
        if (!confirm('¿Eliminar esta situación crítica? Esta acción no se puede deshacer.')) {
            return;
        }

        router.delete(route('situacion-criticas.destroy', situacionCritica.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Situaciones críticas
                </h2>
            }
        >
            <Head title="Situaciones críticas" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <div className="mb-4 flex justify-end">
                        <Link
                            href={route('situacion-criticas.create')}
                            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                        >
                            Nueva situación crítica
                        </Link>
                    </div>

                    <div className="overflow-hidden overflow-x-auto rounded-lg bg-white shadow">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Trabajador</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Supervisor</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Evento</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Referencia</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Condición</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {situacionCriticas.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                                            No hay situaciones críticas registradas todavía.
                                        </td>
                                    </tr>
                                )}

                                {situacionCriticas.map((situacionCritica) => (
                                    <tr key={situacionCritica.id}>
                                        <td className="px-4 py-3 text-gray-900">
                                            {nombreTrabajador(situacionCritica.trabajador)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">
                                            {nombreTrabajador(situacionCritica.supervisor?.trabajador)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">
                                            {situacionCritica.evento?.descripcion ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">{situacionCritica.referencia}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                                {CONDICION_LABEL[situacionCritica.condicion] ?? situacionCritica.condicion}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-3">
                                                <Link
                                                    href={route('situacion-criticas.show', situacionCritica.id)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    Ver
                                                </Link>
                                                <Link
                                                    href={route('situacion-criticas.edit', situacionCritica.id)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    Editar
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminar(situacionCritica)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
