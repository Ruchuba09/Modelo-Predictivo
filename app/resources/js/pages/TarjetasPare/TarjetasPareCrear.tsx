import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import MainLayout from '../../layouts/MainLayout';

export default function Reportes() {

    const hoy = new Date();
    const fechaActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    const {data, setData, post, processing} = useForm({
        tipo_reporte : '',
        obra_faena: '',
        zona_trabajo: '',
        fecha_evento: fechaActual,
        condicion_pare: 0,
        descripcion: ''
    });

    const condicionesPare: {[key: number]: string} = {
        1: "Si las condiciones de trabajo NO son seguras.",
        2: "Si NO tiene las herramientas adecuadas o están en mal estado.",
        3: "Si NO tiene los EPP adecuados.",
        4: "Si NO sabe o no está capacitado / autorizado para realizar la actividad.",
        5: "Si NO hay un procedimiento / instructivo asociado a la actividad o si este existe pero no ha sido difundido.",
        6: "NO contar con el apoyo de recursos humanos y/o materiales necesarios para realizar la actividad.",
        7: "NO contar con AST, VATS, ERT.",
        8: "NO contar con el o los permisos exigidos para realizar la actividad.",
        9: "NO encontrarse en condiciones físicas o emocionales para realizar la actividad.",
        10: "Otras condiciones no consideradas que impliquen un riesgo no controlado."
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.condicion_pare === 0) {
            alert("Por favor, seleccione una condición de uso (1 a 10).");
            return;
        }
    };

    return (
        <MainLayout>
            <Head title="Ingreso de Reporte | AVA" />
            <div className="max-w-[800px] mx-auto p-6 lg:p-8 mt-4 lg:mt-8">
                <div className="bg-[#141414] border border-[#2d3238] rounded-2xl p-8 shadow-2xl">
                
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Ingreso de Reporte Tarjeta Pare</h1>
                        <p className="text-[#7a7f85] text-sm">Registra incidentes críticos en obra.</p>
                    </div>

                    <form onSubmit={handleSubmit}className="space-y-6" >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-[#7a7f85] mb-2">Obra / Faena</label>
                                <input 
                                    type="text"
                                    value={data.obra_faena}
                                    onChange={e => setData('obra_faena', e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#2d3238] rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#a0f700] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-[#7a7f85] mb-2">Zona / Área de Trabajo</label>
                                <input 
                                    type="text"
                                    value={data.zona_trabajo}
                                    onChange={e => setData('zona_trabajo', e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#2d3238] rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#a0f700] transition-colors"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-[#7a7f85] mb-2">Fecha del Evento</label>
                                <input 
                                    type="date" 
                                    value={data.fecha_evento}
                                    disabled
                                    className="w-full bg-[#0a0a0a] border border-[#2d3238] rounded-lg px-4 py-3 text-sm text-[#7a7f85] opacity-60 cursor_not-allowed" 
                                    style={{ colorScheme: 'dark' }} 
                                />
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#2d3238]">
                            <div className="flex justify-between items-end mb-4">
                                <label className="block text-[10px] uppercase tracking-wider text-[#7a7f85]">Condición de Uso - Tarjeta PARE</label>
                                {data.condicion_pare > 0 && (
                                    <span className="text-xs font-bold tracking-wide text-[#a0f700]">
                                        Condición #{data.condicion_pare} Seleccionada
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex gap-2 mb-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setData('condicion_pare', num)}
                                        className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-all ${
                                            data.condicion_pare === num
                                                ? 'bg-[#a0f700] text-black shadow-[0_0_15px_-3px_rgba(160,247,0,0.4)]'
                                                : 'bg-[#141414] border border-[#2d3238] text-white hover:border-[#7a7f85]'
                                        }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                            <div className="min-h-[20px] mt-3">
                                {data.condicion_pare > 0 && (
                                    <p className="text-[#00000] text-sm font-medium">
                                        {condicionesPare[data.condicion_pare]}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-[#7a7f85] mb-2">Descripción Detallada del Hallazgo</label>
                            <textarea
                                rows={4}
                                value={data.descripcion}
                                onChange={e => setData('descripcion', e.target.value)}
                                placeholder="Describa el contexto de la detención..."
                                className="w-full bg-[#0a0a0a] border border-[#2d3238] rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#a0f700] resize-none transition-colors"
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-4 pt-6 border-t border-[#2d3238] mt-8">
                            <button 
                                type="submit" 
                                disabled={processing}
                                className="px-6 py-3 rounded-lg text-sm font-bold bg-[#a0f700] hover:bg-[#86cf00] text-black transition-colors shadow-lg shadow-[#a0f700]/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                {processing ? 'Guardando...' : 'Guardar Reporte'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}