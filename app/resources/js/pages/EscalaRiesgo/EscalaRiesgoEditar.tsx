import { Head, Link, useForm, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { FormEventHandler } from 'react';

interface Escala {
    id: number;
    nivel: string;
    valor: number;
    color_hex: string | null;
    descripcion: string | null;
}

export default function EscalaRiesgoEditar() {
    const { escala } = usePage().props as unknown as { escala: Escala };

    const { data, setData, put, processing, errors } = useForm({
        nivel: escala.nivel,
        valor: String(escala.valor),
        color_hex: escala.color_hex ?? '#a0f700',
        descripcion: escala.descripcion ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/escala-riesgo/${escala.id}`);
    };

    return (
        <MainLayout>
            <Head title={`Editar Escala #${escala.id} | AVA`} />

            <div className="max-w-[600px] mx-auto p-6 lg:p-8">

                <div className="flex items-center gap-3 mb-8">
                    <Link href="/escala-riesgo" className="text-[#7a7f85] hover:text-white transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Editar Escala de Riesgo</h1>
                    <p className="text-[#7a7f85] text-sm">Modifica la escala #{escala.id}.</p>
                </div>

                <form onSubmit={submit} className="bg-[#15181c] border border-white/5 rounded-xl p-6 lg:p-8 space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Nivel</label>
                        <input type="text" value={data.nivel} onChange={(e) => setData('nivel', e.target.value)}
                            className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors" />
                        {errors.nivel && <p className="text-red-400 text-xs mt-1">{errors.nivel}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Valor</label>
                        <input type="number" value={data.valor} onChange={(e) => setData('valor', e.target.value)}
                            className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors" />
                        {errors.valor && <p className="text-red-400 text-xs mt-1">{errors.valor}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Color</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={data.color_hex} onChange={(e) => setData('color_hex', e.target.value)}
                                className="w-12 h-10 bg-[#0d0f12] border border-white/10 rounded-lg cursor-pointer" />
                            <input type="text" value={data.color_hex} onChange={(e) => setData('color_hex', e.target.value)}
                                className="flex-1 bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors" />
                        </div>
                        {errors.color_hex && <p className="text-red-400 text-xs mt-1">{errors.color_hex}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Descripción</label>
                        <textarea value={data.descripcion} onChange={(e) => setData('descripcion', e.target.value)} rows={3}
                            className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors" />
                        {errors.descripcion && <p className="text-red-400 text-xs mt-1">{errors.descripcion}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <Link href="/escala-riesgo" className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#7a7f85] hover:text-white transition-colors">Cancelar</Link>
                        <button type="submit" disabled={processing} className="bg-[#a0f700] hover:bg-[#86cf00] disabled:opacity-50 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#a0f700]/10">
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                </form>

            </div>
        </MainLayout>
    );
}