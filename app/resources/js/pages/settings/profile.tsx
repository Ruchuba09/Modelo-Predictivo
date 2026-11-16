import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import MainLayout from '../../layouts/MainLayout';

interface Rol {
    id_rol: number;
    nombre: string;
    estado: string;
}

interface Usuario {
    id_user: number;
    rut: string | null;
    nombre: string | null;
    email: string;
    roles: Rol[];
}

export default function Perfil({ usuario }: { usuario: Usuario }) {
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
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
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Mi Perfil</h1>
                    <p className="text-gris-1 text-sm">Actualiza tu correo electrónico de acceso.</p>
                </div>

                <div className="bg-white border border-verde-3 rounded-xl p-6 lg:p-8 space-y-8">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <span className="block text-sm font-medium text-gris-1 mb-2">RUT</span>
                                <p className="w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 text-gris-2 text-sm opacity-60">
                                    {usuario.rut ?? '—'}
                                </p>
                            </div>
                            <div>
                                <span className="block text-sm font-medium text-gris-1 mb-2">Nombre</span>
                                <p className="w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 text-gris-2 text-sm opacity-60">
                                    {usuario.nombre ?? '—'}
                                </p>
                            </div>
                            <p className="sm:col-span-2 text-xs text-gris-1">
                                El RUT identifica a la persona dueña de la cuenta y no se puede modificar.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gris-1 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 text-gris-2 text-sm focus:outline-none focus:border-verde-5/50 transition-colors"
                                autoComplete="username"
                            />
                            {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-verde-5 hover:bg-verde-6 disabled:opacity-50 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
                            >
                                Guardar cambios
                            </button>
                            {recentlySuccessful && (
                                <span className="text-sm text-verde-6">Guardado correctamente</span>
                            )}
                        </div>
                    </form>

                    <div className="border-t border-verde-3 pt-6">
                        <h2 className="text-sm font-medium text-gris-1 mb-3">Roles asignados</h2>
                        <div className="flex flex-wrap gap-1.5">
                            {usuario.roles?.map((rol) => (
                                <span
                                    key={rol.id_rol}
                                    title={rol.estado === 'activo' ? undefined : 'Rol inactivo: no otorga permisos'}
                                    className={`bg-verde-2 text-verde-6 text-xs px-2 py-1 rounded-md border border-verde-5/20 ${rol.estado === 'activo' ? '' : 'line-through opacity-60'}`}
                                >
                                    {rol.nombre}
                                </span>
                            ))}
                            {(!usuario.roles || usuario.roles.length === 0) && (
                                <span className="text-gris-1 text-xs">Sin roles asignados.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}