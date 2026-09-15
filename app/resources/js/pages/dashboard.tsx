import { Head, Link } from '@inertiajs/react';
import MainLayout from '../layouts/MainLayout';

export default function Dashboard() {
    return (
        <MainLayout>
            <Head title="Dashboard | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Dashboard Operativo</h1>
                        <p className="text-[#7a7f85] text-sm">Resumen de indicadores, estado de proyectos y últimos hallazgos SGI.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                    
                    <div className="bg-[#141414] border border-[#2d3238] rounded-xl p-6">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[#7a7f85] text-[10px] uppercase tracking-widest font-medium">Reportes Activos</p>
                            <span className="flex w-2 h-2 rounded-full bg-[#a0f700] animate-pulse"></span>
                        </div>
                        <h3 className="text-3xl font-bold text-white">24</h3>
                        <p className="text-[#a0f700] text-xs mt-2 font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            +3 esta semana
                        </p>
                    </div>

                    <div className="bg-[#141414] border border-[#2d3238] rounded-xl p-6">
                        <p className="text-[#7a7f85] text-[10px] uppercase tracking-widest font-medium mb-2">Total Usuarios</p>
                        <h3 className="text-3xl font-bold text-white">128</h3>
                        <p className="text-[#7a7f85] text-xs mt-2">12 online actualmente</p>
                    </div>

                    <div className="bg-[#141414] border border-[#2d3238] rounded-xl p-6">
                        <p className="text-[#7a7f85] text-[10px] uppercase tracking-widest font-medium mb-2">Obras en Ejecución</p>
                        <h3 className="text-3xl font-bold text-white">4</h3>
                        <p className="text-[#7a7f85] text-xs mt-2">Antofagasta, Calama, SCL</p>
                    </div>

                    <div className="bg-[#141414] border border-[#2d3238] rounded-xl p-6">
                        <p className="text-[#7a7f85] text-[10px] uppercase tracking-widest font-medium mb-2">Estado del Sistema</p>
                        <h3 className="text-3xl font-bold text-[#a0f700]">Óptimo</h3>
                        <p className="text-[#7a7f85] text-xs mt-2">Última sinc. hace 5 min</p>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-6">
                    <div className="flex-1 bg-[#141414] border border-[#2d3238] rounded-xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-[#2d3238] flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white">Últimos Hallazgos de Terreno</h2>
                            <Link href="/reportes" className="text-[#a0f700] text-sm hover:underline font-medium">Ver todos</Link>
                        </div>                       
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#2d3238] text-[10px] uppercase tracking-widest text-[#7a7f85] bg-[#111111]">
                                        <th className="px-6 py-4 font-medium">Fecha</th>
                                        <th className="px-6 py-4 font-medium">Obra</th>
                                        <th className="px-6 py-4 font-medium">Dimensión</th>
                                        <th className="px-6 py-4 font-medium">Criticidad</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <tr className="border-b border-[#2d3238]/50 hover:bg-[#1a1a1a] transition-colors">
                                        <td className="px-6 py-4 text-white">11 / Sep / 2026</td>
                                        <td className="px-6 py-4 text-[#7a7f85]">Antofagasta Fase 2</td>
                                        <td className="px-6 py-4">
                                            <span className="border border-[#7a7f85]/30 text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium">Seguridad</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-bold text-red-500">
                                                7 - Alta
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-[#2d3238]/50 hover:bg-[#1a1a1a] transition-colors bg-[#111111]/30">
                                        <td className="px-6 py-4 text-white">10 / Sep / 2026</td>
                                        <td className="px-6 py-4 text-[#7a7f85]">Calama Concentradora</td>
                                        <td className="px-6 py-4">
                                            <span className="border border-[#7a7f85]/30 text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium">Medio Ambiente</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-bold text-yellow-500">
                                                4 - Media
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-[#1a1a1a] transition-colors">
                                        <td className="px-6 py-4 text-white">09 / Sep / 2026</td>
                                        <td className="px-6 py-4 text-[#7a7f85]">Nivel Central SCL</td>
                                        <td className="px-6 py-4">
                                            <span className="border border-[#7a7f85]/30 text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium">Calidad</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-bold text-[#a0f700]">
                                                2 - Baja
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="w-full xl:w-[400px] shrink-0 flex flex-col gap-6">
                        <div className="bg-[#141414] border border-[#2d3238] rounded-xl p-6">
                            <h2 className="text-lg font-bold text-white mb-1">Acciones Rápidas</h2>
                            <p className="text-xs text-[#7a7f85] mb-6">Accesos directos a tareas comunes.</p>
                            
                            <div className="space-y-3">
                                <Link href="/reportes" className="w-full flex items-center justify-between bg-[#0a0a0a] hover:bg-[#111111] border border-[#2d3238] hover:border-[#a0f700] rounded-lg p-4 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="text-[#7a7f85] group-hover:text-[#a0f700] transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                        </div>
                                        <span className="text-sm font-medium text-white">Registrar Tarjeta Pare</span>
                                    </div>
                                </Link>
                                <Link href="/usuarios" className="w-full flex items-center justify-between bg-[#0a0a0a] hover:bg-[#111111] border border-[#2d3238] hover:border-[#a0f700] rounded-lg p-4 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="text-[#7a7f85] group-hover:text-[#a0f700] transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                        </div>
                                        <span className="text-sm font-medium text-white">Gestionar Accesos</span>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}