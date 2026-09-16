import AuthenticatedLayout from '../layouts/MainLayout';
import { Head } from '@inertiajs/react';
import GraficoPredictivo from '../components/GraficoPredictivo';

export default function Dashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="max-w-screen-2xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="bg-[#1e2329] overflow-hidden shadow-sm sm:rounded-xl border border-[#2D3238]">
                        <div className="p-6 text-white text-lg font-medium flex items-center justify-between">
                            <span>Panel de Control - Sistema de Gestión Integrado (SGI)</span>
                            <span className="text-sm bg-[#A0F700]/10 text-[#A0F700] px-3 py-1 rounded-full border border-[#A0F700]/30">
                                Sesión Activa
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2">
                            <GraficoPredictivo/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#1e2329] border border-[#2D3238] p-5 rounded-xl shadow-lg">
                                    <p className="text-[#7A7F85] text-xs font-bold uppercase tracking-wider mb-2">Media Riesgo SSO</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-bold text-white">24.5</span>
                                        <span className="text-[#A0F700] text-sm font-medium mb-1">↓ 12%</span>
                                    </div>
                                </div>

                                <div className="bg-[#1e2329] border border-[#2D3238] p-5 rounded-xl shadow-lg">
                                    <p className="text-[#7A7F85] text-xs font-bold uppercase tracking-wider mb-2">No Conformidades</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-bold text-white">18</span>
                                        <span className="text-red-500 text-sm font-medium mb-1">↑ 3</span>
                                    </div>
                                </div>

                                <div className="bg-[#1e2329] border border-[#2D3238] p-5 rounded-xl shadow-lg">
                                    <p className="text-[#7A7F85] text-xs font-bold uppercase tracking-wider mb-2">Índice Ambiental</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-bold text-white">98%</span>
                                        <span className="text-[#A0F700] text-sm font-medium mb-1">Óptimo</span>
                                    </div>
                                </div>

                                <div className="bg-[#1e2329] border border-[#2D3238] p-5 rounded-xl shadow-lg">
                                    <p className="text-[#7A7F85] text-xs font-bold uppercase tracking-wider mb-2">Días sin Incidentes</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-bold text-[#A0F700]">142</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#1e2329] border border-[#2D3238] p-6 rounded-xl text-white shadow-lg flex-1">
                                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    Alertas Recientes
                                </h3>
                                <div className="space-y-3">
                                    <div className="">
                                    </div>
                                    <div className=" ">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        </AuthenticatedLayout>
    );
}