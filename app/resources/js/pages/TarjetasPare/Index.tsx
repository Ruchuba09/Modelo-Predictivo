import { Head, Link, router, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Trabajador { id: number; nombre_1: string; apellido_1: string; rut: string; }
interface Modelo { id: number; nombre: string; }
interface Escala { id: number; nivel: string; color_hex: string | null; }
interface ProyectoT { id: number; nombre: string; }

interface Tarjeta {
    id: number;
    ubicacion: string | null;
    descripcion: string;
    estado: string;
    fecha_reporte: string;
    trabajador: Trabajador;
    modelo: Modelo;
    escala_riesgo: Escala;
    proyecto: ProyectoT | null;
}

const estadoColor: Record<string, string> = {
    abierta: 'text-red-400 border-red-400/20',
    en_proceso: 'text-yellow-400 border-yellow-400/20',
    cerrada: 'text-[#a0f700] border-[#a0f700]/20',
};

export default function Index() {
    const { tarjetas } = usePage().props as unknown as { tarjetas: Tarjeta[] };

    const eliminar = (tarjeta: Tarjeta) => {
        if (confirm(`¿Eliminar la tarjeta PARE #${tarjeta.id}?`)) {
            router.delete(`/tarjetas-pare/${tarjeta.id}`);
        }
    };

    return (
        <MainLayout>
            <Head title="Tarjetas PARE | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Tarjetas PARE</h1>
                        <p className="text-[#7a7f85] text-sm">Reportes de seguridad y riesgo registrados.</p>
                    </div>
                    <Link href="/tarjetas-pare/crear" className="bg-[#a0f700] hover:bg-[#86cf00] text-black px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#a0f700]/10">
                        <span className="text-lg leading-none">+</span> Crear Tarjeta
                    </Link>
                </div>

                <div className="bg-[#15181c] border border-white/5 rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-left text-[#7a7f85]">
                                <th className="px-6 py-4 font-medium">ID</th>
                                <th className="px-6 py-4 font-medium">Trabajador</th>
                                <th className="px-6 py-4 font-medium">Modelo</th>
                                <th className="px-6 py-4 font-medium">Riesgo</th>
                                <th className="px-6 py-4 font-medium">Proyecto</th>
                                <th className="px-6 py-4 font-medium">Estado</th>
                                <th className="px-6 py-4 font-medium">Fecha</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tarjetas?.map((tarjeta) => (
                                <tr key={tarjeta.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-[#7a7f85]">#{tarjeta.id}</td>
                                    <td className="px-6 py-4 text-white whitespace-nowrap">{tarjeta.trabajador?.nombre_1} {tarjeta.trabajador?.apellido_1}</td>
                                    <td className="px-6 py-4 text-white">{tarjeta.modelo?.nombre}</td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1.5">
                                            {tarjeta.escala_riesgo?.color_hex && (
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tarjeta.escala_riesgo.color_hex }} />
                                            )}
                                            <span className="text-white">{tarjeta.escala_riesgo?.nivel}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[#7a7f85]">{tarjeta.proyecto?.nombre ?? '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded-md border ${estadoColor[tarjeta.estado] ?? 'text-[#7a7f85] border-white/10'}`}>
                                            {tarjeta.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[#7a7f85] whitespace-nowrap">{new Date(tarjeta.fecha_reporte).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/tarjetas-pare/${tarjeta.id}`} className="text-[#7a7f85] hover:text-white text-xs font-medium px-3 py-1.5 rounded-md border border-white/10 hover:border-white/20 transition-colors">Detalles</Link>
                                            <Link href={`/tarjetas-pare/${tarjeta.id}/editar`} className="text-[#a0f700] hover:text-[#86cf00] text-xs font-medium px-3 py-1.5 rounded-md border border-[#a0f700]/20 hover:border-[#a0f700]/40 transition-colors">Editar</Link>
                                            <button onClick={() => eliminar(tarjeta)} className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-md border border-red-400/20 hover:border-red-400/40 transition-colors">Borrar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!tarjetas || tarjetas.length === 0) && (
                                <tr><td colSpan={8} className="px-6 py-10 text-center text-[#7a7f85]">No hay tarjetas registradas todavía.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </MainLayout>
    );
}