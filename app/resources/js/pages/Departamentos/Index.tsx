import { Head, Link, router, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Departamento {
    id_departamento: number;
    nombre: string;
    descripcion?: string;
    estado?: string;
    trabajadores_count?: number;
}

export default function Index() {
    const { departamentos = [] } = usePage().props as unknown as { departamentos: Departamento[] };

    const eliminar = (depto: Departamento) => {
        if (confirm(`¿Seguro que deseas eliminar el departamento "${depto.nombre}"? Esta acción no se puede deshacer.`)) {
            router.delete(`/departamentos/${depto.id_departamento}`);
        }
    };

    return (
        <MainLayout title="Departamentos" subtitle="Estructura organizativa y áreas de la empresa">
            <Head title="Departamentos | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gris-2 dark:text-white mb-1">
                            Listado de Departamentos
                        </h2>
                        <p className="text-xs text-gris-1 dark:text-gray-400">
                            Áreas y departamentos registrados en la organización.
                        </p>
                    </div>
                    <Link
                        href="/departamentos/create"
                        className="bg-verde-5 hover:bg-verde-6 text-black px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-verde-5/10"
                    >
                        <span className="text-lg leading-none">+</span> Crear Departamento
                    </Link>
                </div>

                <div className="bg-white dark:bg-[#1E252B] border border-verde-3 dark:border-[#2C353F] rounded-xl overflow-hidden shadow-sm transition-colors">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-verde-3 dark:border-[#2C353F] text-left text-gris-1 dark:text-gray-400">
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">Trabajadores</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">Estado</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departamentos.map((depto) => (
                                <tr
                                    key={depto.id_departamento}
                                    className="border-b border-verde-3/60 dark:border-[#2C353F] last:border-0 hover:bg-verde-1/50 dark:hover:bg-[#20272F]/60 transition-colors"
                                >
                                    <td className="px-6 py-4 text-gris-1 dark:text-gray-400 font-bold">
                                        #{depto.id_departamento}
                                    </td>
                                    <td className="px-6 py-4 text-gris-2 dark:text-white font-medium">
                                        {depto.nombre}
                                    </td>
                                    <td className="px-6 py-4 text-gris-1 dark:text-gray-400">
                                        {depto.descripcion || '—'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-verde-2 dark:bg-verde-5/10 text-verde-6 dark:text-verde-5 font-bold text-xs px-2.5 py-1 rounded-full border border-verde-5/20">
                                            {depto.trabajadores_count ?? 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-verde-5/10 text-verde-6 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-verde-5/30">
                                            {depto.estado ?? 'activo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/departamentos/${depto.id_departamento}/edit`}
                                                className="text-verde-6 hover:text-verde-6 text-xs font-bold px-3 py-1.5 rounded-md border border-verde-5/30 hover:bg-verde-5/10 transition-colors"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                onClick={() => eliminar(depto)}
                                                className="text-red-400 hover:text-red-300 text-xs font-bold px-3 py-1.5 rounded-md border border-red-400/20 hover:bg-red-400/10 transition-colors cursor-pointer"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {departamentos.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gris-1 dark:text-gray-400">
                                        No hay departamentos registrados.
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
