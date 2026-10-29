import { Head, Link, router, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Rol {
    id_rol: number;
    nombre: string;
}

interface Permiso {
    id_permiso: number;
    nombre: string;
    nivel: string | null;
    roles: Rol[];
}

export default function Index() {
    const { permisos } = usePage().props as unknown as { permisos: Permiso[] };

    const eliminar = (permiso: Permiso) => {
        if (confirm(`¿Eliminar el permiso "${permiso.nombre}"? Esta acción no se puede deshacer.`)) {
            router.delete(`/permisos/${permiso.id_permiso}`);
        }
    };

    return (
        <MainLayout>
            <Head title="Permisos | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gris-2 mb-1">Gestión de Permisos</h1>
                        <p className="text-gris-1 text-sm">Permisos disponibles en el sistema.</p>
                    </div>
                    <Link
                        href="/permisos/crear"
                        className="bg-verde-5 hover:bg-verde-6 text-black px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-verde-5/10"
                    >
                        <span className="text-lg leading-none">+</span> Crear Permiso
                    </Link>
                </div>

                <div className="bg-white border border-verde-3 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-verde-3 text-left text-gris-1">
                                <th className="px-6 py-4 font-medium">ID</th>
                                <th className="px-6 py-4 font-medium">Nombre</th>
                                <th className="px-6 py-4 font-medium">Nivel</th>
                                <th className="px-6 py-4 font-medium">Usado en roles</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {permisos?.map((permiso) => (
                                <tr key={permiso.id_permiso} className="border-b border-verde-3 last:border-0 hover:bg-verde-1 transition-colors">
                                    <td className="px-6 py-4 text-gris-1">#{permiso.id_permiso}</td>
                                    <td className="px-6 py-4 text-gris-2">{permiso.nombre}</td>
                                    <td className="px-6 py-4 text-gris-1">{permiso.nivel ?? '—'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {permiso.roles?.map((r) => (
                                                <span key={r.id_rol} className="bg-verde-2 text-verde-6 text-xs px-2 py-1 rounded-md border border-verde-5/20">
                                                    {r.nombre}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/permisos/${permiso.id_permiso}`} className="text-gris-1 hover:text-gris-2 text-xs font-medium px-3 py-1.5 rounded-md border border-verde-3 hover:border-verde-4 transition-colors">
                                                Detalles
                                            </Link>
                                            <Link href={`/permisos/${permiso.id_permiso}/editar`} className="text-verde-6 hover:text-verde-6 text-xs font-medium px-3 py-1.5 rounded-md border border-verde-5/20 hover:border-verde-5/40 transition-colors">
                                                Editar
                                            </Link>
                                            <button onClick={() => eliminar(permiso)} className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-md border border-red-400/20 hover:border-red-400/40 transition-colors">
                                                Borrar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!permisos || permisos.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gris-1">No hay permisos registrados todavía.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </MainLayout>
    );
}