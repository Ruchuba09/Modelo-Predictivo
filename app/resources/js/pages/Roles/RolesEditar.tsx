import { Head, Link, useForm, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { FormEventHandler } from 'react';

interface Permiso {
    id_permiso: number;
    nombre: string;
}

interface Rol {
    id_rol: number;
    nombre: string;
    permisos: Permiso[];
}

export default function RolesEditar() {
    const { rol, permisos } = usePage().props as unknown as { rol: Rol; permisos: Permiso[] };

    const { data, setData, put, processing, errors } = useForm({
        nombre: rol.nombre,
        permisos: rol.permisos.map((p) => p.id_permiso) as number[],
    });

    const togglePermiso = (id: number) => {
        setData('permisos',
            data.permisos.includes(id)
                ? data.permisos.filter((p) => p !== id)
                : [...data.permisos, id]
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/roles/${rol.id_rol}`);
    };

    return (
        <MainLayout>
            <Head title={`Editar Rol #${rol.id_rol} | AVA`} />

            <div className="max-w-[800px] mx-auto p-6 lg:p-8">

                <div className="flex items-center gap-3 mb-8">
                    <Link href="/roles" className="text-[#7a7f85] hover:text-white transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Editar Rol</h1>
                    <p className="text-[#7a7f85] text-sm">Modifica el rol #{rol.id_rol}.</p>
                </div>

                <form onSubmit={submit} className="bg-[#15181c] border border-white/5 rounded-xl p-6 lg:p-8 space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Nombre del rol</label>
                        <input
                            type="text"
                            value={data.nombre}
                            onChange={(e) => setData('nombre', e.target.value)}
                            className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors"
                        />
                        {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Permisos</label>
                        <div className="grid grid-cols-2 gap-3">
                            {permisos?.map((p) => (
                                <label key={p.id_permiso} className="flex items-center gap-2.5 bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 cursor-pointer hover:border-white/20 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={data.permisos.includes(p.id_permiso)}
                                        onChange={() => togglePermiso(p.id_permiso)}
                                        className="accent-[#a0f700]"
                                    />
                                    <span className="text-white text-sm">{p.nombre}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <Link href="/roles" className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#7a7f85] hover:text-white transition-colors">Cancelar</Link>
                        <button type="submit" disabled={processing} className="bg-[#a0f700] hover:bg-[#86cf00] disabled:opacity-50 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#a0f700]/10">
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                </form>

            </div>
        </MainLayout>
    );
}