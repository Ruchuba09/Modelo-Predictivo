import { Head, Link } from '@inertiajs/react';
import MainLayout from '../layouts/MainLayout';

export default function Portal() {
    return (
        <MainLayout>
            <Head title="Portal de Aplicaciones | AVA" />

            <div className="max-w-[1000px] mx-auto p-6 lg:p-12 mt-8">
                
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-white mb-2">Bienvenido, Carlos</h1>
                    <p className="text-[#7a7f85]">¿A qué módulo deseas ingresar hoy?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/dashboard" className="group bg-[#111111] border border-[#2d3238] hover:border-[#a0f700] p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 block">
                        <div className="w-12 h-12 bg-[#2d3238] group-hover:bg-[#a0f700] text-[#a0f700] group-hover:text-black rounded-xl flex items-center justify-center mb-6 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </div>
                        <h2 className="text-lg font-bold text-white mb-2">Dashboard Operativo</h2>
                        <p className="text-sm text-[#7a7f85]">Visualiza indicadores, estados de obras y métricas del sistema.</p>
                    </Link>

                    <Link href="/reportes" className="group bg-[#111111] border border-[#2d3238] hover:border-[#a0f700] p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 block">
                        <div className="w-12 h-12 bg-[#2d3238] group-hover:bg-[#a0f700] text-[#a0f700] group-hover:text-black rounded-xl flex items-center justify-center mb-6 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <h2 className="text-lg font-bold text-white mb-2">Ingreso de Reportes</h2>
                        <p className="text-sm text-[#7a7f85]">Registra incidentes, no conformidades y tarjetas pare en terreno.</p>
                    </Link>

                    <Link href="/usuarios" className="group bg-[#111111] border border-[#2d3238] hover:border-[#a0f700] p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 block">
                        <div className="w-12 h-12 bg-[#2d3238] group-hover:bg-[#a0f700] text-[#a0f700] group-hover:text-black rounded-xl flex items-center justify-center mb-6 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <h2 className="text-lg font-bold text-white mb-2">Gestión de Personal</h2>
                        <p className="text-sm text-[#7a7f85]">Administra cuentas de usuario, roles y permisos de acceso.</p>
                    </Link>
                </div>
            </div>
        </MainLayout>
    );
}