import { Link, usePage } from '@inertiajs/react';
import { useState, PropsWithChildren } from 'react';
import { useAuth } from '@/hooks/use-auth';

// Arreglo de roles original de tu compañero
const NAV_ITEMS: { href: string; label: string; roles?: string[] }[] = [
    { href: '/portal', label: 'Inicio' },
    { href: '/dashboard', label: 'Dashboard', roles: ['Administrador', 'supervisor'] },
    { href: '/eventos/create', label: 'Reportes' },
    { href: '/usuarios', label: 'Usuarios', roles: ['admin'] },
    { href: '/roles', label: 'Roles', roles: ['Administrador'] },
    { href: '/permisos', label: 'Permisos', roles: ['Administrador'] },
    { href: '/trabajadores', label: 'Trabajadores', roles: ['Administrador', 'rrhh'] },
];

function tieneAcceso(rolesUsuario: string[], rolesRequeridos?: string[]) {
    if (!rolesRequeridos || rolesRequeridos.length === 0) return true;
    return rolesRequeridos.some((rol) => rolesUsuario.includes(rol));
}

export default function MainLayout({ children }: PropsWithChildren) {
    const { url } = usePage();
    const usuario = useAuth();
    const rolesUsuario = usuario?.roles ?? [];

    const itemsVisibles = NAV_ITEMS.filter((item) => tieneAcceso(rolesUsuario, item.roles));

    const [colapsado, setColapsado] = useState(false);
    const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);

    const getLinkClass = (path: string) => {
        return url.startsWith(path)
            ? "flex items-center gap-3 px-3 py-3 rounded-lg bg-[#1a1a1a] text-[#a0f700] text-sm font-medium transition-colors"
            : "flex items-center gap-3 px-3 py-3 rounded-lg text-[#7a7f85] hover:text-white hover:bg-[#1a1a1a] text-sm transition-colors group";
    };

    return (
        <div className="flex h-screen bg-[#0a0a0a] overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
            
            <aside className={`${colapsado ? 'w-20' : 'w-64'} bg-[#111111] border-r border-[#2d3238] transition-all duration-300 flex flex-col relative z-50 shrink-0`}>
                
                {/* Botón Colapsar */}
                <button 
                    onClick={() => setColapsado(!colapsado)}
                    className="absolute -right-3 top-6 bg-[#2d3238] border border-[#7a7f85] text-white p-1 rounded-full hover:bg-[#a0f700] hover:text-black hover:border-[#a0f700] transition-colors"
                >
                    <svg className={`w-4 h-4 transition-transform duration-300 ${colapsado ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Logo */}
                <div className="h-20 flex items-center justify-center border-b border-[#2d3238] shrink-0">
                    {colapsado ? (
                        <span className="text-[#a0f700] font-bold text-xl tracking-wider">AVA</span>
                    ) : (
                        <img src="https://cdn.intrava.cl/v2/logos/Logotipo-isotipo-02.svg" alt="AVA Montajes" className="h-16" />
                    )}
                </div>

                {/* Botón Principal: Nueva Tarjeta PARE (Apunta a la ruta del compañero) */}
                <div className="p-4 border-b border-[#2d3238] shrink-0">
                    <Link 
                        href="/eventos/create" 
                        className={`flex items-center justify-center gap-2 bg-[#a0f700] hover:bg-[#86cf00] text-black rounded-lg font-bold transition-colors shadow-lg shadow-[#a0f700]/10 ${colapsado ? 'h-10 w-10 p-0 rounded-full mx-auto' : 'px-4 py-3'}`}
                        title="Nueva Tarjeta PARE"
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        {!colapsado && <span className="truncate">Nueva Tarjeta</span>}
                    </Link>
                </div>

                {/* Menú de Navegación por Roles */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {itemsVisibles.map((item) => (
                        <Link key={item.href} href={item.href} title={item.label} className={getLinkClass(item.href)}>
                            <span className={`font-bold text-center shrink-0 ${url.startsWith(item.href) ? 'text-[#a0f700]' : 'text-[#7a7f85] group-hover:text-[#a0f700]'} w-5`}>
                                {item.label.charAt(0)}
                            </span>
                            {!colapsado && <span className="truncate">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* Pie de Barra: Perfil */}
                <div className="p-4 border-t border-[#2d3238] relative shrink-0">
                    <button
                        onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
                        className={`flex items-center w-full focus:outline-none ${colapsado ? 'justify-center' : 'justify-start gap-3'}`}
                    >
                        <div className="w-10 h-10 rounded-full bg-[#2D3238] hover:ring-2 hover:ring-[#A0F700] flex-shrink-0 flex items-center justify-center text-white font-bold transition-all">
                            U
                        </div>
                        {!colapsado && (
                            <div className="overflow-hidden text-left flex-1">
                                <p className="text-sm font-bold text-white truncate">{usuario?.email ?? 'Usuario'}</p>
                                <p className="text-xs text-[#7A7F85] truncate">Configuración</p>
                            </div>
                        )}
                    </button>

                    {/* Menú Flotante Perfil (Abre hacia arriba) */}
                    {menuPerfilAbierto && (
                        <div className="absolute bottom-full left-4 mb-2 w-56 bg-[#1e2329] border border-[#2D3238] rounded-lg shadow-xl py-1 z-50 overflow-hidden flex flex-col">
                            <div className="px-4 py-3 border-b border-[#2D3238] bg-[#0a0a0a]">
                                <p className="text-sm text-white font-bold">Mi Cuenta</p>
                                <p className="text-xs text-[#7A7F85] truncate">{usuario?.email ?? '—'}</p>
                            </div>
                            <Link
                                href={route('profile.edit')}
                                className="block px-4 py-2.5 text-sm text-[#7A7F85] hover:bg-[#2D3238] hover:text-white transition-colors"
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
            </aside>

            {/* Contenido Principal */}
            <main className="flex-1 overflow-y-auto bg-[#0a0a0a]">
                {children}
            </main>
        </div>
    );
}