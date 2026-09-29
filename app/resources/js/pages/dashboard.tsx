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
            
            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 lg:mt-2">
                <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gris-2 mb-2">Panel Estadístico</h1>
                        <p className="text-gris-1 text-sm">Resumen de hallazgos y reportes (Tarjeta PARE).</p>
                    </div>
                </div>

                {/* Filtros Globales */}
                <div className="bg-white border border-verde-3 rounded-2xl p-6 mb-6 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-verde-3 pb-4 mb-2">
                        <h3 className="text-sm font-bold text-gris-2 uppercase tracking-wider">Filtros del Panel</h3>
                        {tieneFiltrosActivos && (
                            <button 
                                onClick={limpiarFiltros}
                                className="text-xs text-rojo-1 hover:underline font-bold"
                            >
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Filtro Proyecto */}
                        <div>
                            <label className="block text-xs uppercase text-gris-1 mb-1 font-bold">Proyecto</label>
                            <select 
                                value={formFiltros.id_proyecto}
                                onChange={(e) => handleFilterChange('id_proyecto', e.target.value)}
                                className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2.5 text-sm text-gris-2 focus:outline-none focus:border-verde-5 focus:ring-1 focus:ring-verde-5 transition-colors"
                            >
                                <option value="">Todos los proyectos</option>
                                {proyectos?.map((p: any) => (
                                    <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro Fecha Desde */}
                        <div>
                            <label className="block text-xs uppercase text-gris-1 mb-1 font-bold">Desde</label>
                            <input 
                                type="date"
                                value={formFiltros.fecha_inicio}
                                onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                                className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2 text-sm text-gris-2 focus:outline-none focus:border-verde-5 focus:ring-1 focus:ring-verde-5 transition-colors"
                            />
                        </div>

                        {/* Filtro Fecha Hasta */}
                        <div>
                            <label className="block text-xs uppercase text-gris-1 mb-1 font-bold">Hasta</label>
                            <input 
                                type="date"
                                value={formFiltros.fecha_fin}
                                onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                                className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2 text-sm text-gris-2 focus:outline-none focus:border-verde-5 focus:ring-1 focus:ring-verde-5 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">

                        {/* Solo admin y supervisor ven el gráfico predictivo */}
                        {(esAdmin || esSupervisor) && (
                            <div className="xl:col-span-2">
                                <GraficoPredictivo datosReales={props.datosGrafico} />
                            </div>
                        )}

                        {/* Bloque exclusivo de admin */}
                        {esAdmin && (
                            <div className="bg-verde-2 border border-verde-5 p-5 rounded-xl shadow-sm">
                                <p className="text-verde-6 text-sm font-bold uppercase mb-2">Panel de Administración</p>
                                <p className="text-gris-2 text-sm">Aquí van controles exclusivos para administradores (gestión de usuarios, roles, permisos, etc).</p>
                            </div>
                        )}
                    </div>
                </div>
        </AuthenticatedLayout>
    );
}