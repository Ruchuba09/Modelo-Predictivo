import { Head, Link, useForm, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { FormEventHandler } from 'react';

interface Modelo {
    id: number;
    nombre: string;
    descripcion: string | null;
}

export default function ModeloTarjetaEditar() {
    const { modelo } = usePage().props as unknown as { modelo: Modelo };

    const { data, setData, put, processing, errors } = useForm({
        nombre: modelo.nombre,
        descripcion: modelo.descripcion ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/modelo-tarjeta/${modelo.id}`);
    };

    return (
        <MainLayout>
            <Head title={`Editar Modelo #${modelo.id} | AVA`} />

            <div className="max-w-[600px] mx-auto p-6 lg:p-8">

                <div className="flex items-center gap-3 mb-8">
                    <Link href="/modelo-tarjeta" className="text-gris-1 hover:text-gris-2 transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Editar Modelo de Tarjeta</h1>
                    <p className="text-gris-1 text-sm">Modifica el modelo #{modelo.id}.</p>
                </div>

                <form onSubmit={submit} className="bg-white border border-verde-3 rounded-xl p-6 lg:p-8 space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-gris-2 mb-2">Nombre</label>
                        <input type="text" value={data.nombre} onChange={(e) => setData('nombre', e.target.value)}
                            className="w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 text-gris-2 text-sm focus:outline-none focus:border-verde-5 transition-colors" />
                        {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gris-2 mb-2">Descripción</label>
                        <textarea value={data.descripcion} onChange={(e) => setData('descripcion', e.target.value)} rows={3}
                            className="w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 text-gris-2 text-sm focus:outline-none focus:border-verde-5 transition-colors" />
                        {errors.descripcion && <p className="text-red-400 text-xs mt-1">{errors.descripcion}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-verde-3">
                        <Link href="/modelo-tarjeta" className="px-5 py-2.5 rounded-lg text-sm font-medium text-gris-1 hover:text-gris-2 transition-colors">Cancelar</Link>
                        <button type="submit" disabled={processing} className="bg-verde-5 hover:bg-verde-6 disabled:opacity-50 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-verde-5/10">
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                </form>

            </div>
        </MainLayout>
    );
}