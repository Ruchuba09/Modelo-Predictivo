import { Head, Link } from '@inertiajs/react';

interface Props {
    auth: {
        user: { name: string; email: string; } | null;
    };
}

export default function Welcome({ auth }: Props) {
    return (
        <div className="min-h-screen bg-[#000000] text-white flex flex-col relative overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <Head title="AVA Montajes" />

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#a0f700] opacity-5 blur-[150px] pointer-events-none"></div>

            <header className="h-24 px-8 md:px-16 flex items-center justify-between relative z-10 border-b border-[#2d3238]/30">
                <div className="flex items-center gap-4">
                    <div className="bg-[#a0f700] text-black font-black text-xl px-3 py-1 rounded-sm tracking-tight">AVA</div>
                    <div>
                        <span className="font-bold text-lg tracking-widest text-white block leading-none">MONTAJES</span>
                        <span className="text-[10px] text-[#7a7f85] font-bold tracking-[0.2em] uppercase">Ingeniería & Construcción</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col justify-center items-center text-center px-6 relative z-10">
                <div className="mb-6">
                    <span className="px-4 py-1.5 border border-[#a0f700]/30 rounded-full text-[#a0f700] text-xs font-bold uppercase tracking-widest bg-[#a0f700]/5">
                        Plataforma SGI
                    </span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter max-w-4xl leading-[1.1] mb-6">
                    SISTEMA DE GESTIÓN <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#7a7f85]">Y TRAZABILIDAD</span>
                </h1>
                
                <p className="text-[#7a7f85] md:text-lg max-w-2xl mb-12">
                    Control centralizado de faenas, reportes operacionales y gestión de personal para todos los proyectos de AVA Montajes.
                </p>

                <Link 
                    href={auth?.user ? "/portal" : "/login"} 
                    className="group bg-[#a0f700] hover:bg-[#86cf00] text-black px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-3 shadow-[0_0_40px_-10px_rgba(160,247,0,0.5)] hover:scale-105"
                >
                    {auth?.user ? 'Ir al Portal' : 'Iniciar Sesión Segura'}
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
            </main>

            <footer className="py-8 text-center text-xs text-[#2d3238] font-medium tracking-widest uppercase relative z-10">
                &copy; {new Date().getFullYear()} AVA Montajes. Minería que Avanza.
            </footer>
        </div>
    );
}