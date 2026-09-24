import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Modelo {
    id: number;
    nombre: string;
    descripcion: string | null;
}

export default function ModeloTarjetaMostrar() {
    const { modelo } = usePage().props as unknown as { modelo: Modelo };

    return (
        <MainLayout>
            <Head title={`Modelo #${modelo.id} | AVA`} />

            <div className="max-w-[600px] mx-auto p-6 lg:p-8">

                <div className="flex items-center gap-3 mb-8">
                    <Link href="/modelo-tarjeta" className="text-[#7a7f85] hover:text-white transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Detalles del Modelo</h1>
                    <p className="text-[#7a7f85] text-sm">Información del modelo #{modelo.id}.</p>
                </div>

                <div className="bg-[#15181c] border border-white/5 rounded-xl p-6 lg:p-8 space-y-5">
                    <div>
                        <p className="text-xs text-[#7a7f85] mb-1">Nombre</p>
                        <p className="text-white text-sm">{modelo.nombre}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#7a7f85] mb-1">Descripción</p>
                        <p className="text-white text-sm">{modelo.descripcion ?? 'Sin descripción.'}</p>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Link href={`/modelo-tarjeta/${modelo.id}/editar`} className="bg-[#a0f700] hover:bg-[#86cf00] text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">Editar Modelo</Link>
                </div>

            </div>
        </MainLayout>
    );
}