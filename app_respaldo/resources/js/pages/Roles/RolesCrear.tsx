import { Head, Link, useForm, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { FormEventHandler } from 'react';

interface Permiso {
    id_permiso: number;
    nombre: string;
}

export default function RolesCrear() {
    const { permisos } = usePage().props as unknown as { permisos: Permiso[] };

    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        permisos: [] as number[],
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
        post('/roles');
    };

    return (
        <MainLayout>
            <Head title="Crear Rol | AVA" />

            <div className="max-w-[800px] mx-auto p-6 lg:p-8">

                <div className="flex items-center gap-3 mb-8">
                    <Link href="/roles" className="text-gris-1 hover:text-gris-2 transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Crear Rol</h1>
                    <p className="text-gris-1 text-sm">Define un nuevo rol y sus permisos.</p>
                </div>

                <form onSubmit={submit} className="bg-white border border-verde-3 rounded-xl p-6 lg:p-8 space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-gris-2 mb-2">Nombre del rol</label>
                        <input
                            type="text"
                            value={data.nombre}
                            onChange={(e) => setData('nombre', e.target.value)}
                            className="w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 text-gris-2 text-sm focus:outline-none focus:border-verde-5 transition-colors"
                            placeholder="Ej. Administrador"
                        />
                        {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gris-2 mb-2">Permisos</label>
                        <div className="grid grid-cols-2 gap-3">
                            {permisos?.map((p) => (
                                <label key={p.id_permiso} className="flex items-center gap-2.5 bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 cursor-pointer hover:border-verde-4 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={data.permisos.includes(p.id_permiso)}
                                        onChange={() => togglePermiso(p.id_permiso)}
                                        className="accent-[#a0f700]"
                                    />
                                    <span className="text-gris-2 text-sm">{p.nombre}</span>
                                </label>
                            ))}
                            {(!permisos || permisos.length === 0) && (
                                <p className="text-gris-1 text-sm col-span-2">No hay permisos creados todavía.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-verde-3">
                        <Link href="/roles" className="px-5 py-2.5 rounded-lg text-sm font-medium text-gris-1 hover:text-gris-2 transition-colors">Cancelar</Link>
                        <button type="submit" disabled={processing} className="bg-verde-5 hover:bg-verde-6 disabled:opacity-50 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-verde-5/10">
                            {processing ? 'Creando...' : 'Crear Rol'}
                        </button>
                    </div>

                </form>

            </div>
        </MainLayout>
    );
}