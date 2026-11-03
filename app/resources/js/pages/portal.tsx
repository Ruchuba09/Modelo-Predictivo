import { Head, Link } from '@inertiajs/react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '@/hooks/use-auth';

interface PortalCard {
    href: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}

export default function Portal() {
    const usuario = useAuth();
    const roles = usuario?.roles ?? [];

    const esAdmin = roles.some((r) => r.toLowerCase() === 'administrador');
    const esSupervisor = roles.some((r) => r.toLowerCase() === 'supervisor');

    const cards: PortalCard[] = [];

    // Opciones para Administrador
    if (esAdmin) {
        cards.push(
            {
                href: '/dashboard',
                title: 'Dashboard Operativo',
                description: 'Visualiza indicadores y métricas globales del sistema.',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                ),
            },
            {
                href: '/eventos',
                title: 'Reportes Tarjeta PARE',
                description: 'Administra y supervisa todos los reportes de seguridad de la empresa.',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                ),
            },
            {
                href: '/eventos/create',
                title: 'Nueva Tarjeta PARE',
                description: 'Registra un nuevo hallazgo o reporte de seguridad.',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                ),
            },
            {
                href: '/eventos/estadisticas',
                title: 'Estadísticas Predictivas',
                description: 'Métricas predictivas, causas comunes y análisis de seguridad.',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                ),
            },
            {
                href: '/usuarios',
                title: 'Gestión del Sistema',
                description: 'Administra usuarios, roles y permisos de acceso.',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                ),
            }
        );
    } else if (esSupervisor) {
        // Opciones para Supervisor
        cards.push(
            {
                href: '/dashboard',
                title: 'Dashboard Operativo',
                description: 'Visualiza indicadores y métricas de seguridad de tu cuadrilla.',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                ),
            },
            {
                href: '/eventos',
                title: 'Reportes de Cuadrilla',
                description: 'Supervisa y revisa los reportes de tu cuadrilla y los tuyos.',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                ),
            },
            {
                href: '/eventos/create',
                title: 'Nueva Tarjeta PARE',
                description: 'Registra un nuevo hallazgo o reporte de seguridad.',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                ),
            },
            {
                href: '/eventos/mis-reportes',
                title: 'Mis Reportes',
                description: 'Consulta los eventos reportados por ti.',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                ),
            },
            {
                href: '/cuadrillas',
                title: 'Cuadrillas',
                description: 'Consulta los equipos de trabajo asignados.',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                ),
            }
        );
    } else {
        // Opciones para Trabajador / Obrero
        cards.push(
            {
                href: '/eventos/create',
                title: 'Nueva Tarjeta PARE',
                description: 'Registra un evento detallando el riesgo o condición detectada.',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                ),
            },
            {
                href: '/eventos/mis-reportes',
                title: 'Mis Reportes',
                description: 'Revisa y haz seguimiento a los reportes de seguridad que has registrado.',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                ),
            }
        );
    }

    return (
        <MainLayout>
            <Head title="Portal de Aplicaciones | AVA" />

            <div className="max-w-[1200px] mx-auto p-6 lg:p-12 mt-4">
                <div className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gris-2 dark:text-white mb-2">Bienvenido</h1>
                        <p className="text-sm text-gris-1 dark:text-gray-400">
                            {esAdmin
                                ? 'Panel de control administrativo y gestión general del sistema'
                                : esSupervisor
                                ? 'Panel de supervisión operativa y cuadrillas asignadas'
                                : 'Acceso a reporte de incidentes y seguimiento de tarjetas PARE'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card) => (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="group bg-white dark:bg-[#1E252B] border border-verde-3 dark:border-[#2C353F] hover:border-verde-5 dark:hover:border-verde-5 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 block shadow-sm"
                        >
                            <div className="w-12 h-12 bg-verde-2 dark:bg-[#20272F] group-hover:bg-verde-5 dark:group-hover:bg-verde-5 text-verde-6 dark:text-verde-5 group-hover:text-black dark:group-hover:text-black rounded-xl flex items-center justify-center mb-6 transition-colors shadow-sm">
                                {card.icon}
                            </div>
                            <h2 className="text-lg font-bold text-gris-2 dark:text-white mb-2 group-hover:text-verde-6 dark:group-hover:text-verde-5 transition-colors">
                                {card.title}
                            </h2>
                            <p className="text-sm text-gris-1 dark:text-gray-400">
                                {card.description}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}
