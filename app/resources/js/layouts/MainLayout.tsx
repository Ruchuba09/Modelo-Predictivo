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

                {/* Botón Principal: Nueva Tarjeta PARE */}
                <div className="p-4 border-b border-verde-3 shrink-0">
                    <Link 
                        href="/eventos/create" 
                        className={`flex items-center justify-center gap-2 bg-verde-5 hover:bg-verde-6 text-gris-2 rounded-lg font-bold transition-colors shadow-lg shadow-verde-5/20 ${colapsado ? 'h-10 w-10 p-0 rounded-full mx-auto' : 'px-4 py-3'}`}
                        title="Nueva Tarjeta PARE"
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        {!colapsado && <span className="truncate">Nueva Tarjeta</span>}
                    </Link>
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

                <div className="relative">
                <button 
                    onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2D3238] hover:ring-2 hover:ring-[#A0F700] transition-all focus:outline-none cursor-pointer"
                >
                    <span className="text-[#7A7F85] text-sm font-bold">U</span>
                </button>

                {menuPerfilAbierto && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#1e2329] border border-[#2D3238] rounded-lg shadow-xl py-1 z-50 overflow-hidden flex flex-col">
                        
                        <div className="px-4 py-3 border-b border-[#2D3238] bg-[#0a0a0a]">
                            <p className="text-sm text-white font-bold">Mi Cuenta</p>
                            <p className="text-xs text-[#7A7F85] truncate">admin@avamontajes.cl</p>
                        </div>
                        
                        {menuPerfilAbierto && (
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