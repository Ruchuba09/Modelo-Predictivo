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
                        <h1 className="text-2xl font-bold text-white mb-1">Gestión de Permisos</h1>
                        <p className="text-[#7a7f85] text-sm">Permisos disponibles en el sistema.</p>
                    </div>
                    <Link
                        href="/permisos/crear"
                        className="bg-[#a0f700] hover:bg-[#86cf00] text-black px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#a0f700]/10"
                    >
                        <span className="text-lg leading-none">+</span> Crear Permiso
                    </Link>
                </div>

                <div className="bg-[#15181c] border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-left text-[#7a7f85]">
                                <th className="px-6 py-4 font-medium">ID</th>
                                <th className="px-6 py-4 font-medium">Nombre</th>
                                <th className="px-6 py-4 font-medium">Nivel</th>
                                <th className="px-6 py-4 font-medium">Usado en roles</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {permisos?.map((permiso) => (
                                <tr key={permiso.id_permiso} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-[#7a7f85]">#{permiso.id_permiso}</td>
                                    <td className="px-6 py-4 text-white">{permiso.nombre}</td>
                                    <td className="px-6 py-4 text-[#7a7f85]">{permiso.nivel ?? '—'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {permiso.roles?.map((r) => (
                                                <span key={r.id_rol} className="bg-white/5 text-[#a0f700] text-xs px-2 py-1 rounded-md border border-[#a0f700]/20">
                                                    {r.nombre}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/permisos/${permiso.id_permiso}`} className="text-[#7a7f85] hover:text-white text-xs font-medium px-3 py-1.5 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                                                Detalles
                                            </Link>
                                            <Link href={`/permisos/${permiso.id_permiso}/editar`} className="text-[#a0f700] hover:text-[#86cf00] text-xs font-medium px-3 py-1.5 rounded-md border border-[#a0f700]/20 hover:border-[#a0f700]/40 transition-colors">
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
                                    <td colSpan={5} className="px-6 py-10 text-center text-[#7a7f85]">No hay permisos registrados todavía.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </MainLayout>
    );
}