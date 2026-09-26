import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { PropsWithChildren } from 'react';
import { useAuth } from '@/hooks/use-auth';

// Ajusta estos nombres de rol a los que realmente devuelve $user->rolesArray()
// Un item sin `roles` es visible para cualquier usuario autenticado.
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
                    {itemsVisibles.map((item) => (
                        <Link key={item.href} href={item.href} className={getLinkClass(item.href)}>
                            {item.label}
                        </Link>
                    ))}
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
                                <p className="text-xs text-[#7A7F85] truncate">{usuario?.email ?? '—'}</p>
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
