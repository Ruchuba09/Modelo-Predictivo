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
    const { usuarios } = usePage().props as unknown as { usuarios: Usuario[] };

    const eliminar = (usuario: Usuario) => {
        if (confirm(`¿Seguro que quieres eliminar al usuario ${usuario.email}? Esta acción no se puede deshacer.`)) {
            router.delete(`/usuarios/${usuario.id_user}`);
        }
    };

    return (
        <MainLayout>
            <Head title="Usuarios | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Gestión de Personal Autorizado</h1>
                        <p className="text-[#7a7f85] text-sm">Listado oficial de cuentas y accesos asignados.</p>
                    </div>
                    <Link
                        href="/usuarios/crear"
                        className="bg-[#a0f700] hover:bg-[#86cf00] text-black px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#a0f700]/10"
                    >
                        <span className="text-lg leading-none">+</span> Crear Usuario
                    </Link>
                </div>

                <div className="bg-[#15181c] border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-left text-[#7a7f85]">
                                <th className="px-6 py-4 font-medium">ID</th>
                                <th className="px-6 py-4 font-medium">RUT</th>
                                <th className="px-6 py-4 font-medium">Email</th>
                                <th className="px-6 py-4 font-medium">Roles</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios?.map((usuario) => (
                                <tr key={usuario.id_user} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-[#7a7f85]">#{usuario.id_user}</td>
                                    <td className="px-6 py-4 text-white">{usuario.rut}</td>
                                    <td className="px-6 py-4 text-white">{usuario.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {usuario.roles?.map((rol) => (
                                                <span
                                                    key={rol.id_rol}
                                                    className="bg-white/5 text-[#a0f700] text-xs px-2 py-1 rounded-md border border-[#a0f700]/20"
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
                                                className="text-[#7a7f85] hover:text-white text-xs font-medium px-3 py-1.5 rounded-md border border-white/10 hover:border-white/20 transition-colors"
                                            >
                                                Detalles
                                            </Link>
                                            <Link
                                                href={`/usuarios/${usuario.id_user}/editar`}
                                                className="text-[#a0f700] hover:text-[#86cf00] text-xs font-medium px-3 py-1.5 rounded-md border border-[#a0f700]/20 hover:border-[#a0f700]/40 transition-colors"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                onClick={() => eliminar(usuario)}
                                                className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-md border border-red-400/20 hover:border-red-400/40 transition-colors"
                                            >
                                                Borrar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {(!usuarios || usuarios.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-[#7a7f85]">
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