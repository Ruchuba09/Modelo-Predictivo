import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect, PropsWithChildren } from 'react';
import { useAuth } from '@/hooks/use-auth';

// Arreglo de roles original de tu compañero
const NAV_ITEMS: { href: string; label: string; roles?: string[] }[] = [
    { href: '/portal', label: 'Inicio' },
    { href: '/dashboard', label: 'Dashboard', roles: ['Administrador', 'supervisor'] },
    { href: '/eventos', label: 'Reportes' },
    { href: '/usuarios', label: 'Usuarios', roles: ['admin'] },
    { href: '/roles', label: 'Roles', roles: ['Administrador'] },
    { href: '/permisos', label: 'Permisos', roles: ['Administrador'] },
    { href: '/trabajadores', label: 'Trabajadores', roles: ['Administrador', 'rrhh'] },
];

function tieneAcceso(rolesUsuario: string[], rolesRequeridos?: string[]) {
    if (!rolesRequeridos || rolesRequeridos.length === 0) return true;
    return rolesRequeridos.some((rol) => rolesUsuario.includes(rol));
}

interface MainLayoutProps extends PropsWithChildren {
    bgClass?: string;
}

export default function MainLayout({ children, bgClass = 'bg-verde-1' }: MainLayoutProps) {
    const { url, props } = usePage();
    const usuario = useAuth();
    const notificaciones = (props.notificaciones as any[]) || [];
    const rolesUsuario = usuario?.roles ?? [];

    const itemsVisibles = NAV_ITEMS.filter((item) => tieneAcceso(rolesUsuario, item.roles));

    const [colapsado, setColapsado] = useState(false);
    const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
    const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
    
    // El punto rojo se muestra si hay notificaciones y el ID de la más reciente es mayor al que tenemos guardado
    const [tieneNotificacionesNuevas, setTieneNotificacionesNuevas] = useState(false);

    useEffect(() => {
        if (notificaciones.length > 0) {
            const lastSeen = localStorage.getItem('last_seen_notification');
            if (!lastSeen || parseInt(lastSeen) < notificaciones[0].id) {
                setTieneNotificacionesNuevas(true);
            }
        }
    }, [notificaciones]);

    const toggleNotificaciones = () => {
        setNotificacionesAbiertas(!notificacionesAbiertas);
        if (!notificacionesAbiertas && notificaciones.length > 0) {
            setTieneNotificacionesNuevas(false);
            localStorage.setItem('last_seen_notification', notificaciones[0].id.toString());
        }
    };

    const getLinkClass = (path: string) => {
        return url.startsWith(path)
            ? "flex items-center gap-3 px-3 py-3 rounded-lg bg-verde-2 text-verde-6 text-sm font-medium transition-colors"
            : "flex items-center gap-3 px-3 py-3 rounded-lg text-gris-1 hover:text-gris-2 hover:bg-verde-2 text-sm transition-colors group";
    };

    return (
        <div className={`flex h-screen ${bgClass} overflow-hidden`} style={{ fontFamily: "'Poppins', sans-serif" }}>
            
            <aside className={`${colapsado ? 'w-20' : 'w-64'} bg-white border-r border-verde-3 transition-all duration-300 flex flex-col relative z-50 shrink-0 shadow-sm`}>
                
                {/* Botón Colapsar */}
                <button 
                    onClick={() => setColapsado(!colapsado)}
                    className="absolute -right-3 top-6 bg-white border border-verde-3 text-gris-2 p-1 rounded-full hover:bg-verde-5 hover:border-verde-5 hover:text-gris-2 transition-colors shadow"
                >
                    <svg className={`w-4 h-4 transition-transform duration-300 ${colapsado ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b border-verde-3 shrink-0">
                    {colapsado ? (
                        <span className="text-verde-6 font-bold text-xl tracking-wider">AVA</span>
                    ) : (
                        <img src="https://cdn.intrava.cl/v2/logos/Logotipo-isotipo-02.svg" alt="AVA Montajes" className="h-10" />
                    )}
                </div>

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

                {/* Menú de Navegación por Roles */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {itemsVisibles.map((item) => (
                        <Link key={item.href} href={item.href} title={item.label} className={
                            url.startsWith(item.href)
                                ? "flex items-center gap-3 px-3 py-3 rounded-lg bg-verde-2 text-verde-6 text-sm font-bold transition-colors"
                                : "flex items-center gap-3 px-3 py-3 rounded-lg text-gris-1 hover:text-gris-2 hover:bg-verde-1 text-sm transition-colors group"
                        }>
                            <span className={`font-bold text-center shrink-0 ${url.startsWith(item.href) ? 'text-verde-6' : 'text-gris-1 group-hover:text-verde-5'} w-5`}>
                                {item.label.charAt(0)}
                            </span>
                            {!colapsado && <span className="truncate">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

            </aside>

            {/* Contenedor Principal (Header + Contenido) */}
            <div className={`flex flex-col flex-1 overflow-hidden ${bgClass}`}>
                
                {/* Header Global (Top bar) */}
                <header className="h-16 shrink-0 bg-white border-b border-verde-3 flex items-center justify-end px-8 z-40 relative shadow-sm">
                    <div className="flex items-center gap-4 relative">
                        <button
                            onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
                            className="flex items-center gap-3 focus:outline-none p-1 rounded-lg transition-colors group"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gris-2 leading-tight group-hover:text-verde-6 transition-colors">{usuario?.email ?? 'Usuario'}</p>
                                <p className="text-[11px] uppercase tracking-wider text-gris-1">
                                    {rolesUsuario.length > 0 ? rolesUsuario[0] : 'Sin rol'}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-verde-2 border border-verde-3 group-hover:border-verde-5 flex-shrink-0 flex items-center justify-center text-gris-2 font-bold transition-all text-sm">
                                {usuario?.email ? usuario.email.charAt(0).toUpperCase() : 'U'}
                            </div>
                        </button>

                        {/* Menú Flotante Perfil (Abre hacia abajo) */}
                        {menuPerfilAbierto && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-verde-3 rounded-lg shadow-xl py-1 z-50 overflow-hidden flex flex-col">
                                <div className="px-4 py-3 border-b border-verde-3 bg-verde-1">
                                    <p className="text-sm text-gris-2 font-bold">Mi Cuenta</p>
                                    <p className="text-xs text-gris-1 truncate">{usuario?.email ?? '—'}</p>
                                </div>
                                <Link
                                    href={route('profile.edit')}
                                    className="block px-4 py-2.5 text-sm text-gris-1 hover:bg-verde-2 hover:text-gris-2 transition-colors"
                                >
                                    ⚙️ Configuración de cuenta
                                </Link>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="block w-full text-left px-4 py-2.5 text-sm text-rojo-1 hover:bg-rojo-1/10 transition-colors border-t border-verde-3"
                                >
                                    🚪 Cerrar Sesión
                                </Link>
                            </div>
                        )}
                    </div>
                </header>

                {/* Contenido Principal */}
                <main className={`flex-1 overflow-y-auto ${bgClass} pr-20`}>
                    {children}
                </main>
            </div>

            {/* Notification Bell Floating Button */}
            <div className="fixed bottom-6 right-6 z-[60]">
                <button 
                    onClick={toggleNotificaciones}
                    className="w-14 h-14 bg-verde-5 hover:bg-verde-6 text-gris-2 rounded-full flex items-center justify-center shadow-lg shadow-verde-5/30 transition-transform hover:scale-110 relative focus:outline-none border border-verde-4"
                >
                    {/* Bell Icon */}
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {/* Badge */}
                    {tieneNotificacionesNuevas && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-rojo-1 border-2 border-white rounded-full"></span>
                    )}
                </button>

                {/* Notifications Panel */}
                {notificacionesAbiertas && (
                    <div className="absolute bottom-16 right-0 w-80 bg-white border border-verde-3 rounded-xl shadow-2xl overflow-hidden flex flex-col mb-4">
                        <div className="px-4 py-3 border-b border-verde-3 bg-verde-2">
                            <h3 className="text-sm font-bold text-gris-2">Notificaciones</h3>
                        </div>
                        <div className="p-4 flex flex-col gap-3 max-h-80 overflow-y-auto custom-scrollbar">
                            
                            {notificaciones.length === 0 ? (
                                <p className="text-sm text-gris-1 text-center py-4">No hay notificaciones nuevas</p>
                            ) : (
                                notificaciones.map((notif: any) => (
                                    <div key={notif.id} className="p-3 bg-white border border-verde-3 rounded-lg relative hover:border-verde-5 transition-colors cursor-pointer shadow-sm">
                                        <p className="text-xs text-verde-6 mb-1 font-bold">{notif.titulo}</p>
                                        <p className="text-sm text-gris-2 leading-snug mb-2 pr-4">{notif.mensaje}</p>
                                        <p className="text-[10px] text-gris-1 font-medium">{notif.fecha}</p>
                                    </div>
                                ))
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}