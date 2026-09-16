import { Head, Link, useForm, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { FormEventHandler } from 'react';

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

export default function UsuariosEditar() {
    const { usuario, roles } = usePage().props as unknown as { usuario: Usuario; roles: Rol[] };

    const { data, setData, put, processing, errors } = useForm({
        rut: usuario.rut,
        email: usuario.email,
        password: '',
        password_confirmation: '',
        roles: usuario.roles.map((r) => r.id_rol) as number[],
    });

    const toggleRol = (id: number) => {
        setData('roles',
            data.roles.includes(id)
                ? data.roles.filter((r) => r !== id)
                : [...data.roles, id]
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        console.log('PUT a:', `/usuarios/${usuario.id_user}`, 'id_user=', usuario.id_user, typeof usuario.id_user);
        put(`/usuarios/1`);
    };

    return (
        <MainLayout>
            <Head title={`Editar Usuario #${usuario.id_user} | AVA`} />

            <div className="max-w-[800px] mx-auto p-6 lg:p-8">

                <div className="flex items-center gap-3 mb-8">
                    <Link href="/usuarios" className="text-[#7a7f85] hover:text-white transition-colors text-sm">
                        ← Volver
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Editar Usuario</h1>
                    <p className="text-[#7a7f85] text-sm">Modifica los datos de la cuenta #{usuario.id_user}.</p>
                </div>

                <form onSubmit={submit} className="bg-[#15181c] border border-white/5 rounded-xl p-6 lg:p-8 space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">RUT</label>
                        <input
                            type="text"
                            value={data.rut}
                            onChange={(e) => setData('rut', e.target.value)}
                            className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors"
                        />
                        {errors.rut && <p className="text-red-400 text-xs mt-1">{errors.rut}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Correo electrónico</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors"
                        />
                        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Roles</label>
                        <div className="grid grid-cols-2 gap-3">
                            {roles?.map((rol) => (
                                <label
                                    key={rol.id_rol}
                                    className="flex items-center gap-2.5 bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 cursor-pointer hover:border-white/20 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={data.roles.includes(rol.id_rol)}
                                        onChange={() => toggleRol(rol.id_rol)}
                                        className="accent-[#a0f700]"
                                    />
                                    <span className="text-white text-sm">{rol.nombre}</span>
                                </label>
                            ))}
                        </div>
                        {errors.roles && <p className="text-red-400 text-xs mt-1">{errors.roles}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Nueva contraseña</label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors"
                                placeholder="Dejar vacío para no cambiar"
                            />
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Confirmar contraseña</label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <Link href="/usuarios" className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#7a7f85] hover:text-white transition-colors">
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-[#a0f700] hover:bg-[#86cf00] disabled:opacity-50 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#a0f700]/10"
                        >
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                </form>

            </div>
        </MainLayout>
    );
}