import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { PropsWithChildren } from 'react';


export default function MainLayout({ children }: PropsWithChildren) {
    const { url } = usePage();

    const getLinkClass = (path: string) => {
        return url.startsWith(path)
            ? "h-full flex items-center px-4 text-[#a0f700] border-b-2 border-[#a0f700] text-sm font-medium"
            : "h-full flex items-center px-4 text-[#7a7f85] hover:text-white text-sm transition-colors";
    };

    const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <header className="h-16 bg-[#111111] border-b border-[#2d3238] flex items-center justify-between px-6 sticky top-0 z-50 shrink-0">
                <div className="flex items-center">
                    <img 
                        src="https://cdn.intrava.cl/v2/logos/Logotipo-isotipo-02.svg" 
                        alt="AVA Montajes" 
                        className="h-14 mb-11 mt-11"
                    />
                </div>

                <nav className="hidden md:flex h-full">
                    <Link href="/portal" className={getLinkClass('/portal')}>Inicio</Link>
                    <Link href="/dashboard" className={getLinkClass('/dashboard')}>Dashboard</Link>
                    <Link href="/tarjetas-pare" className={getLinkClass('/tarjetas-pare')}>Reportes</Link>
                    <Link href="/usuarios" className={getLinkClass('/usuarios')}>Usuarios</Link>
                    <Link href="/roles" className={getLinkClass('/roles')}>Roles</Link>
                    <Link href="/permisos" className={getLinkClass('/permisos')}>Permisos</Link>
                    <Link href="/trabajadores" className={getLinkClass('/trabajadores')}>trabajadores</Link>
                </nav>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 border-l border-[#2d3238] pl-6">
                        <div className="w-8 h-8 rounded-full bg-[#2d3238] overflow-hidden border border-[#7a7f85]/30">
                            <Link href="/settings/profile" className="w-8 h-8 rounded-full bg-[#2d3238] overflow-hidden border border-[#7a7f85]/30 hover:border-[#a0f700]/50 transition-colors">
                                <img src="https://ui-avatars.com/api/?name=Carlos+Mendoza&background=2d3238&color=fff" alt="Perfil" />
                            </Link>
                        </div>
                        
                        <Link 
                            href={route('profile.edit')} 
                            className="block px-4 py-2.5 text-sm text-[#7A7F85] hover:bg-[#2D3238] hover:text-white transition-colors"
                            onClick={() => setMenuPerfilAbierto(false)}
                        >
                            ⚙️ Configuración de cuenta
                        </Link>
                        
                        <Link 
                            href={route('logout')} 
                            method="post" 
                            as="button"
                            className="block w-full text-left px-4 py-2.5 text-sm text-[#FF4B4B] hover:bg-[#FF4B4B]/10 transition-colors border-t border-[#2D3238]"
                        >
                            🚪 Cerrar Sesión
                        </Link>
                
                    </div>
                )}
        </div>
            </header>

            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}