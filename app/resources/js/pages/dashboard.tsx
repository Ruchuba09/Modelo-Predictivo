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

                        <div className="bg-[#1e2329] border border-[#2D3238] p-6 rounded-xl text-white shadow-lg flex flex-col justify-center items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-[#2D3238] flex items-center justify-center mb-4 border border-[#7A7F85]/30">
                                <svg className="w-8 h-8 text-[#7A7F85]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-white font-medium mb-2">Panel de Alertas</h3>
                            <p className="text-sm text-[#7A7F85]">
                                Espacio reservado para futuras tarjetas de resumen (KPIs) o notificaciones urgentes en obra.
                            </p>
                        </div>

                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}