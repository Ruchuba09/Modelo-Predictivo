import { Head, Link, useForm } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { FormEventHandler } from 'react';

export default function PermisosCrear() {
    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        nivel: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/permisos');
    };

    return (
        <MainLayout>
            <Head title="Crear Permiso | AVA" />

            <div className="max-w-[600px] mx-auto p-6 lg:p-8">

                <div className="flex items-center gap-3 mb-8">
                    <Link href="/permisos" className="text-[#7a7f85] hover:text-white transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Crear Permiso</h1>
                    <p className="text-[#7a7f85] text-sm">Define un nuevo permiso del sistema.</p>
                </div>

                <form onSubmit={submit} className="bg-[#15181c] border border-white/5 rounded-xl p-6 lg:p-8 space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Nombre del permiso</label>
                        <input
                            type="text"
                            value={data.nombre}
                            onChange={(e) => setData('nombre', e.target.value)}
                            className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors"
                            placeholder="Ej. usuarios.crear"
                        />
                        {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Nivel</label>
                        <input
                            type="text"
                            value={data.nivel}
                            onChange={(e) => setData('nivel', e.target.value)}
                            className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors"
                            placeholder="Ej. alto, medio, bajo (opcional)"
                        />
                        {errors.nivel && <p className="text-red-400 text-xs mt-1">{errors.nivel}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <Link href="/permisos" className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#7a7f85] hover:text-white transition-colors">Cancelar</Link>
                        <button type="submit" disabled={processing} className="bg-[#a0f700] hover:bg-[#86cf00] disabled:opacity-50 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#a0f700]/10">
                            {processing ? 'Creando...' : 'Crear Permiso'}
                        </button>
                    </div>

                </form>

            </div>
        </MainLayout>
    );
}