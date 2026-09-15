import { Head, Link } from '@inertiajs/react';
import MainLayout from '../layouts/MainLayout';

export default function Dashboard() {
    return (
        <MainLayout>
            <Head title="Panel Predictivo | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
                
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Motor Analítico y Predictivo SGI</h1>
                    <p className="text-[#7a7f85] text-sm">Análisis de tendencias y Scoring de Riesgo impulsado por modelo predictivo.</p>
                </div>

                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_0_30px_-5px_rgba(239,68,68,0.2)]">
                    <div className="flex gap-5 items-start">
                        <div className="bg-red-500 text-white w-14 h-14 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                            <span className="text-xl font-black">85%</span>
                        </div>
                        <div>
                            <h2 className="text-red-400 font-bold text-lg mb-1">ALERTA DE RIESGO CRÍTICO EN PRÓXIMAS 48H</h2>
                            <p className="text-gray-300 text-sm">
                                El algoritmo detecta una alta probabilidad de incidente en <span className="font-bold text-white">Antofagasta Fase 2 (Chancado)</span> debido a la acumulación de 4 Tarjetas PARE activas relacionadas con EPP y permisos.
                            </p>
                        </div>
                    </div>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors whitespace-nowrap shrink-0">
                        Generar Plan de Acción
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#141414] border border-[#2d3238] rounded-xl p-6">
                        <p className="text-[#7a7f85] text-[10px] uppercase tracking-widest font-medium mb-2">Ratio Proactivo vs Reactivo</p>
                        <div className="flex items-end gap-3">
                            <h3 className="text-3xl font-bold text-white">4:1</h3>
                        </div>
                        <p className="text-[#a0f700] text-xs mt-2">Saludable (4 prevenciones por cada 1 incidente)</p>
                    </div>

                    <div className="bg-[#141414] border border-[#2d3238] rounded-xl p-6">
                        <p className="text-[#7a7f85] text-[10px] uppercase tracking-widest font-medium mb-2">Tasa de Condición Pendiente</p>
                        <div className="flex items-end gap-3">
                            <h3 className="text-3xl font-bold text-yellow-500">12%</h3>
                        </div>
                        <p className="text-[#7a7f85] text-xs mt-2">18 hallazgos sin resolver en terreno</p>
                    </div>

                    <div className="bg-[#141414] border border-[#2d3238] rounded-xl p-6">
                        <p className="text-[#7a7f85] text-[10px] uppercase tracking-widest font-medium mb-2">Riesgos Críticos Frecuentes</p>
                        <div className="flex items-end gap-3">
                            <h3 className="text-xl font-bold text-white">Trabajo en Altura</h3>
                        </div>
                        <p className="text-[#7a7f85] text-xs mt-2">Causal #3 y #8 predominantes</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    <div className="bg-[#141414] border border-[#2d3238] rounded-xl p-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Densidad de Reportes por Área</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-300">Antofagasta - Módulo Chancado</span>
                                    <span className="text-red-400 font-bold">Alta Densidad (42)</span>
                                </div>
                                <div className="w-full bg-[#2d3238] rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-300">Calama - Correas Transportadoras</span>
                                    <span className="text-yellow-500 font-bold">Media (24)</span>
                                </div>
                                <div className="w-full bg-[#2d3238] rounded-full h-2">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-300">SCL - Taller Central</span>
                                    <span className="text-[#a0f700] font-bold">Baja (8)</span>
                                </div>
                                <div className="w-full bg-[#2d3238] rounded-full h-2">
                                    <div className="bg-[#a0f700] h-2 rounded-full" style={{ width: '15%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#141414] border border-[#2d3238] rounded-xl p-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Correlación Temporal (Hallazgos)</h3>
                        <div className="flex items-end h-32 gap-2 mt-4">
                            <div className="flex-1 bg-[#2d3238] hover:bg-[#a0f700] rounded-t-md relative group transition-colors" style={{ height: '30%' }}>
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Lun</span>
                            </div>
                            <div className="flex-1 bg-[#2d3238] hover:bg-[#a0f700] rounded-t-md relative group transition-colors" style={{ height: '45%' }}>
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Mar</span>
                            </div>
                            <div className="flex-1 bg-[#2d3238] hover:bg-[#a0f700] rounded-t-md relative group transition-colors" style={{ height: '40%' }}>
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Mié</span>
                            </div>
                            <div className="flex-1 bg-[#2d3238] hover:bg-[#a0f700] rounded-t-md relative group transition-colors" style={{ height: '60%' }}>
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Jue</span>
                            </div>
                            <div className="flex-1 bg-red-500 rounded-t-md relative group" style={{ height: '95%' }}>
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-red-400 font-bold whitespace-nowrap">Vie (Noche)</span>
                            </div>
                            <div className="flex-1 bg-[#2d3238] hover:bg-[#a0f700] rounded-t-md relative group transition-colors" style={{ height: '20%' }}>
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Sáb</span>
                            </div>
                        </div>
                        <p className="text-xs text-[#7a7f85] mt-4 text-center">
                            * Pico de condiciones subestándares detectado sistemáticamente los viernes en turno noche.
                        </p>
                    </div>

                </div>
            </div>
        </MainLayout>
    );
}