import { Head, Link, usePage } from '@inertiajs/react';
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

export default function TarjetasPareMostrar() {
    const { tarjeta } = usePage().props as unknown as { tarjeta: Tarjeta };

    return (
        <MainLayout>
            <Head title={`Tarjeta #${tarjeta.id} | AVA`} />

            <div className="max-w-[700px] mx-auto p-6 lg:p-8">

                <div className="flex items-center gap-3 mb-8">
                    <Link href="/tarjetas-pare" className="text-[#7a7f85] hover:text-white transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Detalles de la Tarjeta PARE</h1>
                    <p className="text-[#7a7f85] text-sm">Reporte #{tarjeta.id} — {new Date(tarjeta.fecha_reporte).toLocaleString()}</p>
                </div>

                <div className="bg-[#15181c] border border-white/5 rounded-xl p-6 lg:p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <p className="text-xs text-[#7a7f85] mb-1">Trabajador</p>
                            <p className="text-white text-sm">{tarjeta.trabajador?.nombre_1} {tarjeta.trabajador?.apellido_1}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[#7a7f85] mb-1">Modelo</p>
                            <p className="text-white text-sm">{tarjeta.modelo?.nombre}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[#7a7f85] mb-1">Nivel de riesgo</p>
                            <p className="text-white text-sm flex items-center gap-2">
                                {tarjeta.escala_riesgo?.color_hex && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tarjeta.escala_riesgo.color_hex }} />}
                                {tarjeta.escala_riesgo?.nivel}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-[#7a7f85] mb-1">Proyecto</p>
                            <p className="text-white text-sm">{tarjeta.proyecto?.nombre ?? 'Sin proyecto asociado'}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-[#7a7f85] mb-1">Ubicación</p>
                        <p className="text-white text-sm">{tarjeta.ubicacion ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#7a7f85] mb-1">Descripción del hallazgo</p>
                        <p className="text-white text-sm">{tarjeta.descripcion}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#7a7f85] mb-1">Estado</p>
                        <p className="text-white text-sm capitalize">{tarjeta.estado.replace('_', ' ')}</p>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Link href={`/tarjetas-pare/${tarjeta.id}/editar`} className="bg-[#a0f700] hover:bg-[#86cf00] text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">Editar Tarjeta</Link>
                </div>

            </div>
        </MainLayout>
    );
}