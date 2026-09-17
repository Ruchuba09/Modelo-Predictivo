import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Escala {
    id: number;
    nivel: string;
    valor: number;
    color_hex: string | null;
    descripcion: string | null;
}

export default function EscalaRiesgoMostrar() {
    const { escala } = usePage().props as unknown as { escala: Escala };

    return (
        <MainLayout>
            <Head title={`Escala #${escala.id} | AVA`} />

            <div className="max-w-[600px] mx-auto p-6 lg:p-8">

                <div className="flex items-center gap-3 mb-8">
                    <Link href="/escala-riesgo" className="text-[#7a7f85] hover:text-white transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Detalles de la Escala</h1>
                    <p className="text-[#7a7f85] text-sm">Información de la escala #{escala.id}.</p>
                </div>

                <div className="bg-[#15181c] border border-white/5 rounded-xl p-6 lg:p-8 space-y-5">
                    <div className="flex items-center gap-3">
                        {escala.color_hex && <span className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: escala.color_hex }} />}
                        <p className="text-white text-lg font-semibold">{escala.nivel}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#7a7f85] mb-1">Valor</p>
                        <p className="text-white text-sm">{escala.valor}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#7a7f85] mb-1">Descripción</p>
                        <p className="text-white text-sm">{escala.descripcion ?? 'Sin descripción.'}</p>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Link href={`/escala-riesgo/${escala.id}/editar`} className="bg-[#a0f700] hover:bg-[#86cf00] text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">Editar Escala</Link>
                </div>

            </div>
        </MainLayout>
    );
}