import AuthenticatedLayout from '../layouts/MainLayout';
import { Head } from '@inertiajs/react';
import GraficoPredictivo from '../components/GraficoPredictivo';
import SessionInfo from '@/components/session-info';

interface Props {
    datosGrafico?: Array<{
        fecha: string;
        [key: string]: string | number;
    }>;
}

export default function Dashboard( props : any) {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="py-8">
                <div className="max-w-screen-2xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg z-50">
                        <p className="text-white font-bold text-sm mb-2">📦 PROPS COMPLETOS DE LARAVEL:</p>
                        <pre className="text-[#A0F700] text-xs overflow-auto max-h-40">
                            {JSON.stringify(props, null, 2)}
                        </pre>
                    </div>

                    <SessionInfo />

                    <div className="bg-[#1e2329] overflow-hidden shadow-sm sm:rounded-xl border border-[#2D3238]">
                        <div className="p-6 text-white text-lg font-medium flex items-center justify-between">
                            <span>Panel de Control - Sistema de Gestión Integrado (SGI)</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
                        <div className="grid grid-cols-4 gap-4">
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
                        </div>
                        <div className="xl:col-span-2">
                            <GraficoPredictivo datosReales={props.datosGrafico} />
                        </div>
                    </div>
                </div>
        </AuthenticatedLayout>
    );
}