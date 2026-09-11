import { Head } from '@inertiajs/react';
import { useState } from 'react';
import MainLayout from '../layouts/MainLayout';

export default function Reportes() {
    const [criticidad, setCriticidad] = useState(7);

    const hoy = new Date();

    const fechaActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    return (
        <MainLayout>
            <Head title="Ingreso de Reporte | AVA" />

            <div className="max-w-[800px] mx-auto p-6 lg:p-8 mt-4 lg:mt-8">
                
                <div className="bg-[#141414] border border-[#2d3238] rounded-2xl p-8 shadow-2xl">
                    
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Ingreso de Reporte de Terreno SGI</h1>
                        <p className="text-[#7a7f85] text-sm">Registra desviaciones, no conformidades o incidentes críticos en obra.</p>
                    </div>

                    <form className="space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-[#7a7f85] mb-2">Tipo de Reporte</label>
                                <select defaultValue="" className="w-full bg-[#0a0a0a] border border-[#2d3238] rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#a0f700] appearance-none transition-colors">
                                    <option value="">Seleccione una opción</option>
                                    <option>Tarjeta Pare</option>
                                    <option>Incidente Ambiental</option>
                                    <option>No Conformidad</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-[#7a7f85] mb-2">Obra / Proyecto Destino</label>
                                <select defaultValue="" className="w-full bg-[#0a0a0a] border border-[#2d3238] rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#a0f700] appearance-none transition-colors">
                                    <option value="">Seleccione una opción</option>
                                    <option>Antofagasta Fase 2</option>
                                    <option>Calama Concentradora</option>
                                    <option>Nivel Central SCL</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-[#7a7f85] mb-2">Dimensión SGI</label>
                                <select defaultValue="" className="w-full bg-[#0a0a0a] border border-[#2d3238] rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#a0f700] appearance-none transition-colors">
                                    <option value="">Seleccione una opción</option>
                                    <option>Seguridad</option>
                                    <option>Medio Ambiente</option>
                                    <option>Calidad</option>
                                </select>
                            </div>
                        <div>
                                <label className="block text-[10px] uppercase tracking-wider text-[#7a7f85] mb-2">Fecha del Evento</label>
                                <input 
                                    type="date" 
                                    defaultValue={fechaActual} 
                                    className="w-full bg-[#0a0a0a] border border-[#2d3238] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#a0f700] transition-colors" 
                                    style={{ colorScheme: 'dark' }} 
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <label className="block text-[10px] uppercase tracking-wider text-[#7a7f85]">Nivel de Criticidad (1 A 10)</label>
                                <span className={`text-xs font-bold tracking-wide ${criticidad >= 7 ? 'text-red-500' : 'text-[#a0f700]'}`}>
                                    Valor Estimado: {criticidad} - {criticidad >= 8 ? 'Crítica' : criticidad >= 7 ? 'Alta' : criticidad >= 4 ? 'Media' : 'Baja'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setCriticidad(num)}
                                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                                            criticidad === num
                                                ? 'bg-[#a0f700] text-black shadow-lg shadow-[#a0f700]/20'
                                                : 'bg-[#0a0a0a] border border-[#2d3238] text-white hover:border-[#7a7f85]'
                                        }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-[#7a7f85] mb-2">Descripción Detallada del Hallazgo</label>
                            <textarea
                                rows={4}
                                className="w-full bg-[#0a0a0a] border border-[#2d3238] rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#a0f700] resize-none transition-colors"
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-4 pt-6 border-t border-[#2d3238] mt-8">
                            <button type="button" className="px-6 py-3 rounded-lg text-sm font-medium text-[#7a7f85] hover:text-white border border-[#2d3238] hover:border-[#7a7f85] transition-colors">
                                Cancelar
                            </button>
                            <button type="button" className="px-6 py-3 rounded-lg text-sm font-bold bg-[#a0f700] hover:bg-[#86cf00] text-black transition-colors shadow-lg shadow-[#a0f700]/20 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                Guardar Reporte
                            </button>
                        </div>
                    </form>
                    
                </div>
            </div>
        </MainLayout>
    );
}