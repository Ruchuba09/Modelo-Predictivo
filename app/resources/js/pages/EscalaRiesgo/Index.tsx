import { Head, Link, router, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Escala {
    id: number;
    nivel: string;
    valor: number;
    color_hex: string | null;
    descripcion: string | null;
}

export default function Index() {
    const { escalas } = usePage().props as unknown as { escalas: Escala[] };

    const eliminar = (escala: Escala) => {
        if (confirm(`¿Eliminar la escala "${escala.nivel}"?`)) {
            router.delete(`/escala-riesgo/${escala.id}`);
        }
    };

    return (
        <MainLayout>
            <Head title="Escalas de Riesgo | AVA" />

            <div className="max-w-[1200px] mx-auto p-6 lg:p-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Escalas de Riesgo</h1>
                        <p className="text-[#7a7f85] text-sm">Niveles de riesgo usados en las tarjetas PARE.</p>
                    </div>
                    <Link href="/escala-riesgo/crear" className="bg-[#a0f700] hover:bg-[#86cf00] text-black px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#a0f700]/10">
                        <span className="text-lg leading-none">+</span> Crear Escala
                    </Link>
                </div>

                <div className="bg-[#15181c] border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-left text-[#7a7f85]">
                                <th className="px-6 py-4 font-medium">Nivel</th>
                                <th className="px-6 py-4 font-medium">Valor</th>
                                <th className="px-6 py-4 font-medium">Color</th>
                                <th className="px-6 py-4 font-medium">Descripción</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {escalas?.map((escala) => (
                                <tr key={escala.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-white">{escala.nivel}</td>
                                    <td className="px-6 py-4 text-[#7a7f85]">{escala.valor}</td>
                                    <td className="px-6 py-4">
                                        {escala.color_hex && (
                                            <div className="flex items-center gap-2">
                                                <span className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: escala.color_hex }} />
                                                <span className="text-[#7a7f85] text-xs">{escala.color_hex}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-[#7a7f85]">{escala.descripcion ?? '—'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/escala-riesgo/${escala.id}`} className="text-[#7a7f85] hover:text-white text-xs font-medium px-3 py-1.5 rounded-md border border-white/10 hover:border-white/20 transition-colors">Detalles</Link>
                                            <Link href={`/escala-riesgo/${escala.id}/editar`} className="text-[#a0f700] hover:text-[#86cf00] text-xs font-medium px-3 py-1.5 rounded-md border border-[#a0f700]/20 hover:border-[#a0f700]/40 transition-colors">Editar</Link>
                                            <button onClick={() => eliminar(escala)} className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-md border border-red-400/20 hover:border-red-400/40 transition-colors">Borrar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!escalas || escalas.length === 0) && (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-[#7a7f85]">No hay escalas registradas todavía.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </MainLayout>
    );
}