import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function MainLayout({ children }: PropsWithChildren) {
    const { url } = usePage();

    const getLinkClass = (path: string) => {
        return url.startsWith(path)
            ? "h-full flex items-center px-4 text-[#a0f700] border-b-2 border-[#a0f700] text-sm font-medium"
            : "h-full flex items-center px-4 text-[#7a7f85] hover:text-white text-sm transition-colors";
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <header className="h-16 bg-[#111111] border-b border-[#2d3238] flex items-center justify-between px-6 sticky top-0 z-50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-[#a0f700] text-black font-black text-sm px-2 py-0.5 rounded-sm tracking-tight">AVA</div>
                    <span className="font-bold text-sm tracking-widest text-gray-200">MONTAJES S.A.</span>
                </div>

                <nav className="hidden md:flex h-full">
                    <Link href="/portal" className={getLinkClass('/portal')}>Inicio</Link>
                    <Link href="/dashboard" className={getLinkClass('/dashboard')}>Dashboard</Link>
                    <Link href="/reportes" className={getLinkClass('/reportes')}>Reportes</Link>
                    <Link href="/usuarios" className={getLinkClass('/usuarios')}>Usuarios</Link>
                </nav>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 border-l border-[#2d3238] pl-6">
                        <div className="w-8 h-8 rounded-full bg-[#2d3238] overflow-hidden border border-[#7a7f85]/30">
                            <img src="https://ui-avatars.com/api/?name=Carlos+Mendoza&background=2d3238&color=fff" alt="Perfil" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}