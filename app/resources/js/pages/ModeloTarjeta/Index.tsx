import { Head, Link, router, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Modelo {
    id: number;
    nombre: string;
    descripcion: string | null;
}

export default function Index() {
    const { modelos } = usePage().props as unknown as { modelos: Modelo[] };

    const eliminar = (modelo: Modelo) => {
        if (confirm(`¿Eliminar el modelo "${modelo.nombre}"?`)) {
            router.delete(`/modelo-tarjeta/${modelo.id}`);
        }
    };

    return (
        <MainLayout>
            <Head title="Modelos de Tarjeta | AVA" />

            <div className="max-w-[1200px] mx-auto p-6 lg:p-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Modelos de Tarjeta PARE</h1>
                        <p className="text-[#7a7f85] text-sm">Tipos de tarjeta disponibles para el reporte.</p>
                    </div>
                    <Link href="/modelo-tarjeta/crear" className="bg-[#a0f700] hover:bg-[#86cf00] text-black px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#a0f700]/10">
                        <span className="text-lg leading-none">+</span> Crear Modelo
                    </Link>
                </div>

                <div className="bg-[#15181c] border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-left text-[#7a7f85]">
                                <th className="px-6 py-4 font-medium">Nombre</th>
                                <th className="px-6 py-4 font-medium">Descripción</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modelos?.map((modelo) => (
                                <tr key={modelo.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-white">{modelo.nombre}</td>
                                    <td className="px-6 py-4 text-[#7a7f85]">{modelo.descripcion ?? '—'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/modelo-tarjeta/${modelo.id}`} className="text-[#7a7f85] hover:text-white text-xs font-medium px-3 py-1.5 rounded-md border border-white/10 hover:border-white/20 transition-colors">Detalles</Link>
                                            <Link href={`/modelo-tarjeta/${modelo.id}/editar`} className="text-[#a0f700] hover:text-[#86cf00] text-xs font-medium px-3 py-1.5 rounded-md border border-[#a0f700]/20 hover:border-[#a0f700]/40 transition-colors">Editar</Link>
                                            <button onClick={() => eliminar(modelo)} className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-md border border-red-400/20 hover:border-red-400/40 transition-colors">Borrar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!modelos || modelos.length === 0) && (
                                <tr><td colSpan={3} className="px-6 py-10 text-center text-[#7a7f85]">No hay modelos registrados todavía.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </MainLayout>
    );
}