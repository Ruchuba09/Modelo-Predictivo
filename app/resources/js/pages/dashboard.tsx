import AuthenticatedLayout from '../layouts/MainLayout';
import { Head, router } from '@inertiajs/react';
import GraficoPredictivo from '../components/GraficoPredictivo';
import { useTieneRol } from '@/hooks/use-auth';
import { useState } from 'react';

export default function Dashboard(props: any) {
    const esAdmin = useTieneRol('Administrador');
    const esSupervisor = useTieneRol('supervisor');

    const { proyectos, filtros, datosGrafico } = props;

    const [formFiltros, setFormFiltros] = useState({
        id_proyecto: filtros?.id_proyecto ?? '',
        fecha_inicio: filtros?.fecha_inicio ?? '',
        fecha_fin: filtros?.fecha_fin ?? '',
    });

    const handleFilterChange = (field: string, value: string) => {
        const newFilters = { ...formFiltros, [field]: value };
        setFormFiltros(newFilters);
        
        const cleanFilters = Object.fromEntries(
            Object.entries(newFilters).filter(([_, v]) => v !== '')
        );

        router.get(route('dashboard'), cleanFilters, {
            preserveState: true,
            replace: true,
            preserveScroll: true
        });
    };

    const limpiarFiltros = () => {
        setFormFiltros({
            id_proyecto: '',
            fecha_inicio: '',
            fecha_fin: '',
        });
        router.get(route('dashboard'), {}, { preserveState: true, replace: true });
    };

    const tieneFiltrosActivos = Object.values(formFiltros).some(val => val !== '');

    return (
        <AuthenticatedLayout title="Panel Estadístico" subtitle="Resumen de hallazgos y reportes (Tarjeta PARE)">
            <Head title="Dashboard | AVA" />
            
            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 flex flex-col h-full min-h-[calc(100vh-80px)]">
                
                {/* Barra de Filtros Espaciosa */}
                <div className="mb-6 bg-white dark:bg-[#1E242B] border border-verde-3 dark:border-[#2A333E] rounded-xl p-3.5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 transition-colors">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                        
                        <div className="flex flex-col">
                            <label className="text-[11px] uppercase text-gris-1 dark:text-gray-400 font-bold tracking-wider mb-1 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-verde-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Proyecto
                            </label>
                            <select 
                                value={formFiltros.id_proyecto}
                                onChange={(e) => handleFilterChange('id_proyecto', e.target.value)}
                                className="bg-verde-1 dark:bg-[#151A1F] border border-verde-3 dark:border-[#2A333E] rounded-lg px-3 py-2 text-sm text-gris-2 dark:text-white font-medium focus:outline-none focus:border-verde-5 cursor-pointer w-full transition-colors"
                            >
                                <option value="">Todos los proyectos</option>
                                {proyectos?.map((p: any) => (
                                    <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-[11px] uppercase text-gris-1 dark:text-gray-400 font-bold tracking-wider mb-1 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-verde-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Desde
                            </label>
                            <input 
                                type="date"
                                value={formFiltros.fecha_inicio}
                                onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                                className="bg-verde-1 dark:bg-[#151A1F] border border-verde-3 dark:border-[#2A333E] rounded-lg px-3 py-2 text-sm text-gris-2 dark:text-white font-medium focus:outline-none focus:border-verde-5 cursor-pointer w-full transition-colors"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-[11px] uppercase text-gris-1 dark:text-gray-400 font-bold tracking-wider mb-1 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-verde-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Hasta
                            </label>
                            <input 
                                type="date"
                                value={formFiltros.fecha_fin}
                                onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                                className="bg-verde-1 dark:bg-[#151A1F] border border-verde-3 dark:border-[#2A333E] rounded-lg px-3 py-2 text-sm text-gris-2 dark:text-white font-medium focus:outline-none focus:border-verde-5 cursor-pointer w-full transition-colors"
                            />
                        </div>
                    </div>

                    {tieneFiltrosActivos && (
                        <div className="lg:pl-4 lg:border-l lg:border-verde-3/50 dark:lg:border-[#2A333E] flex items-center self-end lg:self-center">
                            <button 
                                onClick={limpiarFiltros}
                                title="Limpiar Filtros"
                                className="px-3.5 py-2 text-xs font-bold text-rojo-1 bg-rojo-1/10 hover:bg-rojo-1 hover:text-white rounded-lg transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Limpiar Filtros</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Dashboard Principal */}
                <div className="flex-1 flex flex-col min-h-0">
                    {(esAdmin || esSupervisor) ? (
                        <div className="flex-1 w-full h-full pb-4">
                            <GraficoPredictivo datosReales={props.datosGrafico} />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-verde-3 rounded-2xl bg-white">
                            <p className="text-gris-1 font-medium">No tienes los permisos necesarios para ver el panel estadístico.</p>
                        </div>
                    )}
                </div>

            </div>
        </AuthenticatedLayout>
    );
}

