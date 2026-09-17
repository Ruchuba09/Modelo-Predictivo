import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
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

export default function Perfil({ usuario }: { usuario: Usuario }) {
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        rut: usuario.rut,
        email: usuario.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch('/settings/profile');
    };

    return (
        <MainLayout>
            <Head title="Mi Perfil | AVA" />

            <div className="max-w-2xl mx-auto p-6 lg:p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Mi Perfil</h1>
                    <p className="text-[#7a7f85] text-sm">Actualiza tu información de acceso.</p>
                </div>

                <div className="bg-[#15181c] border border-white/5 rounded-xl p-6 lg:p-8 space-y-8">
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label htmlFor="rut" className="block text-sm font-medium text-[#7a7f85] mb-2">
                                RUT
                            </label>
                            <input
                                id="rut"
                                type="text"
                                value={data.rut}
                                onChange={(e) => setData('rut', e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700]/50 transition-colors"
                                autoComplete="off"
                            />
                            {errors.rut && <p className="mt-2 text-sm text-red-400">{errors.rut}</p>}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[#7a7f85] mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700]/50 transition-colors"
                                autoComplete="username"
                            />
                            {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-[#a0f700] hover:bg-[#86cf00] disabled:opacity-50 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
                            >
                                Guardar cambios
                            </button>
                            {recentlySuccessful && (
                                <span className="text-sm text-[#a0f700]">Guardado correctamente</span>
                            )}
                        </div>
                    </form>

                    <div className="border-t border-white/5 pt-6">
                        <h2 className="text-sm font-medium text-[#7a7f85] mb-3">Roles asignados</h2>
                        <div className="flex flex-wrap gap-1.5">
                            {usuario.roles?.map((rol) => (
                                <span
                                    key={rol.id_rol}
                                    className="bg-white/5 text-[#a0f700] text-xs px-2 py-1 rounded-md border border-[#a0f700]/20"
                                >
                                    {rol.nombre}
                                </span>
                            ))}
                            {(!usuario.roles || usuario.roles.length === 0) && (
                                <span className="text-[#7a7f85] text-xs">Sin roles asignados.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}