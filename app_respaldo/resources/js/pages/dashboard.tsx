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
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            
            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 flex flex-col h-full min-h-[calc(100vh-80px)]">
                
                {/* Header & Filtros Compactos */}
                <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gris-2 mb-1">Panel Estadístico</h1>
                        <p className="text-gris-1 text-sm">Resumen de hallazgos y reportes (Tarjeta PARE).</p>
                    </div>

                    {/* Barra de Filtros Ordenada */}
                    <div className="w-full xl:w-auto bg-white border border-verde-3 rounded-xl p-3 shadow-sm flex items-center justify-between gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 flex-1">
                            
                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase text-gris-1 font-bold tracking-wider mb-0.5">Proyecto</label>
                                <select 
                                    value={formFiltros.id_proyecto}
                                    onChange={(e) => handleFilterChange('id_proyecto', e.target.value)}
                                    className="bg-verde-1 border border-verde-3 rounded-md px-2 py-1.5 text-sm text-gris-2 font-medium focus:outline-none focus:border-verde-5 cursor-pointer w-full"
                                >
                                    <option value="">Todos los proyectos</option>
                                    {proyectos?.map((p: any) => (
                                        <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase text-gris-1 font-bold tracking-wider mb-0.5">Desde</label>
                                <input 
                                    type="date"
                                    value={formFiltros.fecha_inicio}
                                    onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                                    className="bg-verde-1 border border-verde-3 rounded-md px-2 py-1.5 text-sm text-gris-2 font-medium focus:outline-none focus:border-verde-5 cursor-pointer w-full"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase text-gris-1 font-bold tracking-wider mb-0.5">Hasta</label>
                                <input 
                                    type="date"
                                    value={formFiltros.fecha_fin}
                                    onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                                    className="bg-verde-1 border border-verde-3 rounded-md px-2 py-1.5 text-sm text-gris-2 font-medium focus:outline-none focus:border-verde-5 cursor-pointer w-full"
                                />
                            </div>
                        </div>

                        {tieneFiltrosActivos && (
                            <div className="pl-4 border-l border-verde-3/50 flex items-center justify-center h-full">
                                <button 
                                    onClick={limpiarFiltros}
                                    title="Limpiar Filtros"
                                    className="p-2 text-rojo-1 bg-rojo-1/10 rounded-md hover:bg-rojo-1 hover:text-white transition-colors flex items-center justify-center shrink-0"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )}
                    </div>
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

