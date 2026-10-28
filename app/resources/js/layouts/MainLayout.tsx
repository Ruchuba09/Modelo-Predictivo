import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect, PropsWithChildren } from 'react';
import { useAuth } from '@/hooks/use-auth';
import ThemeToggle from '@/components/ThemeToggle';

interface NavSubItem {
    href: string;
    label: string;
    permisos?: string[];
}

interface NavItem {
    href?: string;
    label: string;
    permisos?: string[];
    subItems?: NavSubItem[];
}

const NAV_ITEMS: NavItem[] = [
    { href: '/portal', label: 'Inicio' },
    { href: '/dashboard', label: 'Dashboard', permisos: ['eventos.estadisticas'] },
    { href: '/usuarios', label: 'Sistema', permisos: ['usuarios.ver'] },
    {
        label: 'Reportes',
        subItems: [
            { href: '/eventos', label: 'Listado de reportes', permisos: ['eventos.ver'] },
            { href: '/eventos/mis-reportes', label: 'Mis reportes', permisos: ['eventos.mis-reportes'] },
            { href: '/eventos/estadisticas', label: 'Estadísticas', permisos: ['eventos.estadisticas'] },
        ],
    },
    {
        label: 'Operaciones',
        subItems: [
            { href: '/proyectos', label: 'Proyectos', permisos: ['proyectos.ver'] },
            { href: '/cuadrillas', label: 'Cuadrillas', permisos: ['cuadrillas.ver'] },
            { href: '/trabajadores', label: 'Trabajadores', permisos: ['trabajadores.ver'] },
        ],
    },
];

function tieneAcceso(permisosUsuario: string[], permisosRequeridos?: string[]) {
    if (!permisosRequeridos || permisosRequeridos.length === 0) return true;
    return permisosRequeridos.some((permiso) => permisosUsuario.includes(permiso));
}

function isRutaActiva(href: string, rutaActual: string): boolean {
    if (href === '/eventos') {
        return (
            rutaActual === '/eventos' ||
            (rutaActual.startsWith('/eventos/') &&
                !rutaActual.startsWith('/eventos/mis-reportes') &&
                !rutaActual.startsWith('/eventos/estadisticas'))
        );
    }
    if (href === '/portal') {
        return rutaActual === '/portal';
    }
    return rutaActual === href || rutaActual.startsWith(href + '/');
}

interface MainLayoutProps extends PropsWithChildren {
    bgClass?: string;
}

export default function MainLayout({ children, bgClass = 'bg-verde-1' }: MainLayoutProps) {
    const { url, props } = usePage();
    const usuario = useAuth();
    const notificaciones = (props.notificaciones as any[]) || [];
    const permisosUsuario = usuario?.permisos ?? [];
    const rolesUsuario = usuario?.roles ?? [];

    const itemsVisibles = NAV_ITEMS.filter((item) => {
        if (!tieneAcceso(permisosUsuario, item.permisos)) return false;
        if (item.subItems) {
            const subVisibles = item.subItems.filter((sub) => tieneAcceso(permisosUsuario, sub.permisos));
            return subVisibles.length > 0;
        }
        return true;
    });

    const rutaActual = url.split('?')[0];

    const [colapsado, setColapsado] = useState(false);
    const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
    const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
    const [tieneNotificacionesNuevas, setTieneNotificacionesNuevas] = useState(false);
    const [gruposAbiertos, setGruposAbiertos] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        NAV_ITEMS.forEach((item) => {
            if (item.subItems) {
                const coincide = item.subItems.some((sub) => isRutaActiva(sub.href, rutaActual));
                if (coincide) {
                    initial[item.label] = true;
                }
            }
        });
        return initial;
    });

    // Sincronizar grupos abiertos según la ruta actual (Inicio/Dashboard comienzan cerrados)
    useEffect(() => {
        const nuevoEstado: Record<string, boolean> = {};
        NAV_ITEMS.forEach((item) => {
            if (item.subItems) {
                const coincide = item.subItems.some((sub) => isRutaActiva(sub.href, rutaActual));
                if (coincide) {
                    nuevoEstado[item.label] = true;
                }
            }
        });
        setGruposAbiertos(nuevoEstado);
    }, [rutaActual]);

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

    const toggleGrupo = (label: string) => {
        if (colapsado) {
            setColapsado(false);
            setGruposAbiertos((prev) => ({ ...prev, [label]: true }));
            return;
        }
        setGruposAbiertos((prev) => ({
            ...prev,
            [label]: !prev[label],
        }));
    };

    return (
        <div className={`flex h-screen ${bgClass} dark:bg-[#111417] text-gris-2 dark:text-gray-100 overflow-hidden`} style={{ fontFamily: "'Poppins', sans-serif" }}>
            <aside
                className={`${
                    colapsado ? 'w-20' : 'w-64'
                } bg-white dark:bg-[#181D22] border-r border-verde-3 dark:border-[#262E37] transition-all duration-300 flex flex-col relative z-50 shrink-0 shadow-sm`}
            >
                {/* Botón Colapsar */}
                <button
                    onClick={() => setColapsado(!colapsado)}
                    className="absolute -right-3 top-6 bg-white dark:bg-[#20272F] border border-verde-3 dark:border-[#2C353F] text-gris-2 dark:text-gray-200 p-1 rounded-full hover:bg-verde-5 hover:border-verde-5 hover:text-black transition-colors shadow cursor-pointer"
                >
                    <svg
                        className={`w-4 h-4 transition-transform duration-300 ${colapsado ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b border-verde-3 dark:border-[#262E37] shrink-0">
                    {colapsado ? (
                        <span className="text-verde-6 dark:text-verde-5 font-bold text-xl tracking-wider">AVA</span>
                    ) : (
                        <img src="https://cdn.intrava.cl/v2/logos/Logotipo-isotipo-02.svg" alt="AVA Montajes" className="h-10 dark:brightness-125" />
                    )}
                </div>

                {/* Botón Principal: Nueva Tarjeta PARE */}
                <div className="p-4 border-b border-verde-3 dark:border-[#262E37] shrink-0">
                    <Link
                        href="/eventos/create"
                        className={`flex items-center justify-center gap-2 bg-verde-5 hover:bg-verde-6 text-black rounded-lg font-bold transition-colors shadow-lg shadow-verde-5/20 ${
                            colapsado ? 'h-10 w-10 p-0 rounded-full mx-auto' : 'px-4 py-3'
                        }`}
                        title="Nueva Tarjeta PARE"
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        {!colapsado && <span className="truncate">Nueva Tarjeta</span>}
                    </Link>
                </div>

                {/* Menú de Navegación por Roles */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {itemsVisibles.map((item) => {
                        if (item.subItems) {
                            const subItemsVisibles = item.subItems.filter((sub) => tieneAcceso(permisosUsuario, sub.permisos));
                            const subActivoEncontrado = subItemsVisibles.some((sub) => isRutaActiva(sub.href, rutaActual));
                            const abierto = Boolean(gruposAbiertos[item.label]);

                            if (colapsado) {
                                return (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => toggleGrupo(item.label)}
                                        title={item.label}
                                        className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors cursor-pointer ${
                                            subActivoEncontrado
                                                ? 'bg-verde-2 text-verde-6 font-bold'
                                                : 'text-gris-1 hover:text-gris-2 hover:bg-verde-1'
                                        }`}
                                    >
                                        <span className="font-bold text-center w-5">{item.label.charAt(0)}</span>
                                    </button>
                                );
                            }

                            return (
                                <div key={item.label} className="space-y-1">
                                    <button
                                        type="button"
                                        onClick={() => toggleGrupo(item.label)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer group ${
                                            subActivoEncontrado
                                                ? 'bg-verde-2/70 text-gris-2 font-bold'
                                                : 'text-gris-1 hover:text-gris-2 hover:bg-verde-1 font-medium'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span
                                                className={`font-bold text-center shrink-0 w-5 ${
                                                    subActivoEncontrado ? 'text-verde-6' : 'text-gris-1 group-hover:text-verde-6'
                                                }`}
                                            >
                                                {item.label.charAt(0)}
                                            </span>
                                            <span className="truncate">{item.label}</span>
                                        </div>
                                        <svg
                                            className={`w-4 h-4 text-gris-1 transition-transform duration-200 shrink-0 ${
                                                abierto ? 'rotate-90 text-verde-6' : 'group-hover:text-gris-2'
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    {abierto && (
                                        <div className="ml-5 pl-3 py-1 space-y-1 border-l-2 border-verde-3/70">
                                            {subItemsVisibles.map((sub) => {
                                                const subActivo = isRutaActiva(sub.href, rutaActual);
                                                return (
                                                    <Link
                                                        key={sub.href}
                                                        href={sub.href}
                                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                                                            subActivo
                                                                ? 'bg-verde-5 text-black font-extrabold shadow-sm'
                                                                : 'text-gris-1 hover:text-gris-2 hover:bg-verde-1 font-medium'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                                subActivo ? 'bg-black' : 'bg-verde-3'
                                                            }`}
                                                        />
                                                        <span className="truncate">{sub.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // Ítem regular simple
                        const activo = isRutaActiva(item.href!, rutaActual);

                        return (
                            <Link
                                key={item.href}
                                href={item.href!}
                                title={item.label}
                                className={
                                    activo
                                        ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-verde-2 text-verde-6 text-sm font-bold transition-colors'
                                        : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-gris-1 hover:text-gris-2 hover:bg-verde-1 text-sm transition-colors group'
                                }
                            >
                                <span
                                    className={`font-bold text-center shrink-0 w-5 ${
                                        activo ? 'text-verde-6' : 'text-gris-1 group-hover:text-verde-5'
                                    }`}
                                >
                                    {item.label.charAt(0)}
                                </span>
                                {!colapsado && <span className="truncate">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Contenedor Principal (Barra superior + Contenido) */}
            <div className={`flex flex-col flex-1 overflow-hidden ${bgClass}`}>
                {/* Header Global (Top bar) */}
                <header className="h-16 shrink-0 bg-white dark:bg-[#181D22] border-b border-verde-3 dark:border-[#262E37] flex items-center justify-end px-8 z-40 relative shadow-sm transition-colors duration-200">
                    <div className="flex items-center gap-4 relative">
                        {/* Selector Modo Oscuro a la izquierda del perfil */}
                        <ThemeToggle />

                        <button
                            onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
                            className="flex items-center gap-3 focus:outline-none p-1 rounded-lg transition-colors group cursor-pointer"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gris-2 dark:text-gray-100 leading-tight group-hover:text-verde-6 dark:group-hover:text-verde-5 transition-colors">
                                    {usuario?.email ?? 'Usuario'}
                                </p>
                                <p className="text-[11px] uppercase tracking-wider text-gris-1 dark:text-gray-400">
                                    {rolesUsuario.length > 0 ? rolesUsuario[0] : 'Sin rol'}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-verde-2 dark:bg-[#20272F] border border-verde-3 dark:border-[#2C353F] group-hover:border-verde-5 flex-shrink-0 flex items-center justify-center text-gris-2 dark:text-gray-100 font-bold transition-all text-sm">
                                {usuario?.email ? usuario.email.charAt(0).toUpperCase() : 'U'}
                            </div>
                        </button>

                        {/* Menú Flotante Perfil */}
                        {menuPerfilAbierto && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#1E242B] border border-verde-3 dark:border-[#2C353F] rounded-lg shadow-xl py-1 z-50 overflow-hidden flex flex-col">
                                <div className="px-4 py-3 border-b border-verde-3 dark:border-[#2C353F] bg-verde-1 dark:bg-[#151A1F]">
                                    <p className="text-sm text-gris-2 dark:text-gray-100 font-bold">Mi Cuenta</p>
                                    <p className="text-xs text-gris-1 dark:text-gray-400 truncate">{usuario?.email ?? '—'}</p>
                                </div>
                                <Link
                                    href={route('profile.edit')}
                                    className="block px-4 py-2.5 text-sm text-gris-1 dark:text-gray-300 hover:bg-verde-2 dark:hover:bg-[#242C35] hover:text-gris-2 dark:hover:text-white transition-colors"
                                >
                                    ⚙️ Configuración de cuenta
                                </Link>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="block w-full text-left px-4 py-2.5 text-sm text-rojo-1 hover:bg-rojo-1/10 transition-colors border-t border-verde-3 dark:border-[#2C353F] cursor-pointer"
                                >
                                    🚪 Cerrar Sesión
                                </Link>
                            </div>
                        )}
                    </div>
                </header>

                {/* Contenido Inyectado */}
                <main className="flex-1 overflow-y-auto dark:bg-[#111417] transition-colors duration-200">{children}</main>
            </div>
        </div>
    );
}
