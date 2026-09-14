import { Head, Link, usePage } from '@inertiajs/react';
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

export default function UsuariosMostrar() {
    const { usuario } = usePage().props as unknown as { usuario: Usuario };

    return (
        <MainLayout>
            <Head title={`Usuario #${usuario.id_user} | AVA`} />

            <div className="max-w-[700px] mx-auto p-6 lg:p-8">

                <div className="flex items-center gap-3 mb-8">
                    <Link href="/usuarios" className="text-[#7a7f85] hover:text-white transition-colors text-sm">
                        ← Volver
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Detalles del Usuario</h1>
                    <p className="text-[#7a7f85] text-sm">Información de la cuenta #{usuario.id_user}.</p>
                </div>

                <div className="bg-[#15181c] border border-white/5 rounded-xl p-6 lg:p-8 space-y-5">
                    <div>
                        <p className="text-xs text-[#7a7f85] mb-1">RUT</p>
                        <p className="text-white text-sm">{usuario.rut}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#7a7f85] mb-1">Correo electrónico</p>
                        <p className="text-white text-sm">{usuario.email}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#7a7f85] mb-1">Roles asignados</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {usuario.roles?.map((rol) => (
                                <span
                                    key={rol.id_rol}
                                    className="bg-white/5 text-[#a0f700] text-xs px-2 py-1 rounded-md border border-[#a0f700]/20"
                                >
                                    {rol.nombre}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Link
                        href={`/usuarios/${usuario.id_user}/editar`}
                        className="bg-[#a0f700] hover:bg-[#86cf00] text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
                    >
                        Editar Usuario
                    </Link>
                </div>

            </div>
        </MainLayout>
    );
}