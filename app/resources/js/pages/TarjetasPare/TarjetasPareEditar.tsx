import { Head, Link, useForm, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { FormEventHandler } from 'react';

interface Trabajador { id: number; nombre_1: string; apellido_1: string; rut: string; }
interface Modelo { id: number; nombre: string; }
interface Escala { id: number; nivel: string; color_hex: string | null; }
interface ProyectoT { id: number; nombre: string; alias: string | null; }

interface Tarjeta {
    id: number;
    id_trabajador: number;
    id_modelo: number;
    id_escala_riesgo: number;
    id_proyecto: number | null;
    ubicacion: string | null;
    descripcion: string;
    estado: string;
}

export default function TarjetasPareEditar() {
    const { tarjeta, trabajadores, modelos, escalas, proyectos } = usePage().props as unknown as {
        tarjeta: Tarjeta; trabajadores: Trabajador[]; modelos: Modelo[]; escalas: Escala[]; proyectos: ProyectoT[];
    };

    const { data, setData, put, processing, errors } = useForm({
        id_trabajador: String(tarjeta.id_trabajador),
        id_modelo: String(tarjeta.id_modelo),
        id_escala_riesgo: String(tarjeta.id_escala_riesgo),
        id_proyecto: tarjeta.id_proyecto ? String(tarjeta.id_proyecto) : '',
        ubicacion: tarjeta.ubicacion ?? '',
        descripcion: tarjeta.descripcion,
        estado: tarjeta.estado,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/tarjetas-pare/${tarjeta.id}`);
    };

    return (
        <MainLayout>
            <Head title={`Editar Tarjeta #${tarjeta.id} | AVA`} />

            <div className="max-w-[800px] mx-auto p-6 lg:p-8">

                <div className="flex items-center gap-3 mb-8">
                    <Link href="/tarjetas-pare" className="text-[#7a7f85] hover:text-white transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Editar Tarjeta PARE</h1>
                    <p className="text-[#7a7f85] text-sm">Modifica el reporte #{tarjeta.id}.</p>
                </div>

                <form onSubmit={submit} className="bg-[#15181c] border border-white/5 rounded-xl p-6 lg:p-8 space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Trabajador</label>
                            <select value={data.id_trabajador} onChange={(e) => setData('id_trabajador', e.target.value)}
                                className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors">
                                {trabajadores?.map((t) => (
                                    <option key={t.id} value={t.id}>{t.nombre_1} {t.apellido_1} — {t.rut}</option>
                                ))}
                            </select>
                            {errors.id_trabajador && <p className="text-red-400 text-xs mt-1">{errors.id_trabajador}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Modelo de tarjeta</label>
                            <select value={data.id_modelo} onChange={(e) => setData('id_modelo', e.target.value)}
                                className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors">
                                {modelos?.map((m) => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>
                            {errors.id_modelo && <p className="text-red-400 text-xs mt-1">{errors.id_modelo}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Escala de riesgo</label>
                            <select value={data.id_escala_riesgo} onChange={(e) => setData('id_escala_riesgo', e.target.value)}
                                className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors">
                                {escalas?.map((esc) => (
                                    <option key={esc.id} value={esc.id}>{esc.nivel}</option>
                                ))}
                            </select>
                            {errors.id_escala_riesgo && <p className="text-red-400 text-xs mt-1">{errors.id_escala_riesgo}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Proyecto (opcional)</label>
                            <select value={data.id_proyecto} onChange={(e) => setData('id_proyecto', e.target.value)}
                                className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors">
                                <option value="">Sin proyecto asociado</option>
                                {proyectos?.map((p) => (
                                    <option key={p.id} value={p.id}>{p.nombre}{p.alias ? ` (${p.alias})` : ''}</option>
                                ))}
                            </select>
                            {errors.id_proyecto && <p className="text-red-400 text-xs mt-1">{errors.id_proyecto}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Ubicación</label>
                        <input type="text" value={data.ubicacion} onChange={(e) => setData('ubicacion', e.target.value)}
                            className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors" />
                        {errors.ubicacion && <p className="text-red-400 text-xs mt-1">{errors.ubicacion}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Descripción del hallazgo</label>
                        <textarea value={data.descripcion} onChange={(e) => setData('descripcion', e.target.value)} rows={4}
                            className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors" />
                        {errors.descripcion && <p className="text-red-400 text-xs mt-1">{errors.descripcion}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Estado</label>
                        <select value={data.estado} onChange={(e) => setData('estado', e.target.value)}
                            className="w-full bg-[#0d0f12] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700] transition-colors">
                            <option value="abierta">Abierta</option>
                            <option value="en_proceso">En proceso</option>
                            <option value="cerrada">Cerrada</option>
                        </select>
                        {errors.estado && <p className="text-red-400 text-xs mt-1">{errors.estado}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <Link href="/tarjetas-pare" className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#7a7f85] hover:text-white transition-colors">Cancelar</Link>
                        <button type="submit" disabled={processing} className="bg-[#a0f700] hover:bg-[#86cf00] disabled:opacity-50 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#a0f700]/10">
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                </form>

            </div>
        </MainLayout>
    );
}