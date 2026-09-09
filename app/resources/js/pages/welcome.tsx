import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    auth: {
        user: {
            name: string;
            email: string;
        } | null;
    };
}

export default function Welcome({ auth }: Props) {
    return (
        <div className="min-h-screen bg-[#000000] flex flex-col justify-center items-center p-6 selection:bg-[#a0f700] selection:text-black" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <Head title="Bienvenido | AVA" />

            <div className="w-full max-w-md bg-[#2d3238] border border-[#7a7f85]/30 rounded-2xl shadow-2xl overflow-hidden">
                
                <div className="px-8 pt-10 pb-6 text-center border-b border-[#7a7f85]/20">
                    <div className="flex justify-center mb-6">
                        
                           <img 
                            src="https://cdn.intrava.cl/v2/logos/Logotipo-isotipo-02.svg" 
                            alt="AVA Montajes" 
                            className="h-30 mb-10"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight"></h1>
                    <p className="text-[11px] text-[#a0f700] font-bold tracking-[0.2em] uppercase mt-2">
                        AVA Montajes
                    </p>
                </div>

                <div className="p-8 text-center">
                    <div className="flex flex-col gap-4">
                            <Link
                                href={route('login')}
                                className="w-full flex justify-center items-center gap-2 px-6 py-3 rounded-lg bg-[#a0f700] hover:bg-[#86cf00] text-black font-bold text-sm transition-all duration-200">
                                <span>Iniciar Sesión</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                    </div>
                </div>
            </div>
            <div className="mt-8 text-center text-xs text-[#7a7f85]">
                <p>&copy; {new Date().getFullYear()} AVA.</p>
                <p className="mt-1">Todos los derechos reservados.</p>
            </div>
        </div>
    );
}