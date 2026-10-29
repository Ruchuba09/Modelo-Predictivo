import { Head, Link, router, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Permiso {
    id_permiso: number;
    nombre: string;
}

interface Rol {
    id_rol: number;
    nombre: string;
    permisos: Permiso[];
}

export default function Index() {
    const { roles } = usePage().props as unknown as { roles: Rol[] };

    const eliminar = (rol: Rol) => {
        if (confirm(`¿Eliminar el rol "${rol.nombre}"? Esta acción no se puede deshacer.`)) {
            router.delete(`/roles/${rol.id_rol}`);
        }
    };

    return (
        <MainLayout>
            <Head title="Roles | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gris-2 mb-1">Gestión de Roles</h1>
                        <p className="text-gris-1 text-sm">Roles del sistema y sus permisos asociados.</p>
                    </div>
                    <Link
                        href="/roles/crear"
                        className="bg-verde-5 hover:bg-verde-6 text-black px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-verde-5/10"
                    >
                        <span className="text-lg leading-none">+</span> Crear Rol
                    </Link>
                </div>

                <div className="bg-white border border-verde-3 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-verde-3 text-left text-gris-1">
                                <th className="px-6 py-4 font-medium">ID</th>
                                <th className="px-6 py-4 font-medium">Nombre</th>
                                <th className="px-6 py-4 font-medium">Permisos</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles?.map((rol) => (
                                <tr key={rol.id_rol} className="border-b border-verde-3 last:border-0 hover:bg-verde-1 transition-colors">
                                    <td className="px-6 py-4 text-gris-1">#{rol.id_rol}</td>
                                    <td className="px-6 py-4 text-gris-2">{rol.nombre}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {rol.permisos?.map((p) => (
                                                <span key={p.id_permiso} className="bg-verde-2 text-verde-6 text-xs px-2 py-1 rounded-md border border-verde-5/20">
                                                    {p.nombre}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/roles/${rol.id_rol}`} className="text-gris-1 hover:text-gris-2 text-xs font-medium px-3 py-1.5 rounded-md border border-verde-3 hover:border-verde-4 transition-colors">
                                                Detalles
                                            </Link>
                                            <Link href={`/roles/${rol.id_rol}/editar`} className="text-verde-6 hover:text-verde-6 text-xs font-medium px-3 py-1.5 rounded-md border border-verde-5/20 hover:border-verde-5/40 transition-colors">
                                                Editar
                                            </Link>
                                            <button onClick={() => eliminar(rol)} className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-md border border-red-400/20 hover:border-red-400/40 transition-colors">
                                                Borrar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!roles || roles.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gris-1">No hay roles registrados todavía.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </MainLayout>
    );
}