import { Head, Link, router, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Rol {
    id_rol: number;
    nombre: string;
}

interface Usuario {
    id_user: number;
    rut: string;
    email: string;
    roles: Rol[];
}

export default function Index() {
    const { usuarios = [] } = usePage().props as unknown as { usuarios: Usuario[] };

    const eliminar = (usuario: Usuario) => {
        if (confirm(`¿Seguro que quieres eliminar al usuario ${usuario.email}? Esta acción no se puede deshacer.`)) {
            router.delete(`/usuarios/${usuario.id_user}`);
        }
    };

    return (
        <MainLayout title="Usuarios del Sistema" subtitle="Administración de cuentas y accesos oficiales">
            <Head title="Usuarios | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gris-2 dark:text-white mb-1">
                            Personal Autorizado
                        </h2>
                        <p className="text-xs text-gris-1 dark:text-gray-400">
                            Cuentas registradas y roles de acceso asignados.
                        </p>
                    </div>
                    <Link
                        href="/usuarios/crear"
                        className="bg-verde-5 hover:bg-verde-6 text-black px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-verde-5/10"
                    >
                        <span className="text-lg leading-none">+</span> Crear Usuario
                    </Link>
                </div>

                <div className="bg-white dark:bg-[#1E252B] border border-verde-3 dark:border-[#2C353F] rounded-xl overflow-hidden shadow-sm transition-colors">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-verde-3 dark:border-[#2C353F] text-left text-gris-1 dark:text-gray-400">
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">RUT</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Roles</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios?.map((usuario) => (
                                <tr
                                    key={usuario.id_user}
                                    className="border-b border-verde-3/60 dark:border-[#2C353F] last:border-0 hover:bg-verde-1/50 dark:hover:bg-[#20272F]/60 transition-colors"
                                >
                                    <td className="px-6 py-4 text-gris-1 dark:text-gray-400 font-bold">
                                        #{usuario.id_user}
                                    </td>
                                    <td className="px-6 py-4 text-gris-2 dark:text-white font-medium">
                                        {usuario.rut}
                                    </td>
                                    <td className="px-6 py-4 text-gris-2 dark:text-white">
                                        {usuario.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {usuario.roles?.map((rol) => (
                                                <span
                                                    key={rol.id_rol}
                                                    className="bg-verde-2 dark:bg-verde-5/10 text-verde-6 dark:text-verde-5 text-xs px-2.5 py-1 rounded-md font-bold border border-verde-5/20"
                                                >
                                                    {rol.nombre}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/usuarios/${usuario.id_user}`}
                                                className="text-gris-1 dark:text-gray-400 hover:text-gris-2 dark:hover:text-white text-xs font-bold px-3 py-1.5 rounded-md border border-verde-3 dark:border-[#2C353F] hover:border-verde-4 transition-colors"
                                            >
                                                Detalles
                                            </Link>
                                            <Link
                                                href={`/usuarios/${usuario.id_user}/editar`}
                                                className="text-verde-6 hover:text-verde-6 text-xs font-bold px-3 py-1.5 rounded-md border border-verde-5/30 hover:bg-verde-5/10 transition-colors"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                onClick={() => eliminar(usuario)}
                                                className="text-red-400 hover:text-red-300 text-xs font-bold px-3 py-1.5 rounded-md border border-red-400/20 hover:bg-red-400/10 transition-colors cursor-pointer"
                                            >
                                                Borrar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {(!usuarios || usuarios.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gris-1 dark:text-gray-400">
                                        No hay usuarios registrados todavía.
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
