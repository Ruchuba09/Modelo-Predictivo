import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import CerrarEvento from '@/components/eventos/CerrarEvento';
const ESTADO_STYLES: { [key: string]: string } = {
    abierto: 'bg-verde-5/10 text-verde-6 border-verde-5/40',
    en_revision: 'bg-amarillo-1/10 text-amarillo-1 border-amarillo-1/40',
    proceso: 'bg-amarillo-1/10 text-amarillo-1 border-amarillo-1/40',
    cerrado: 'bg-gris-1/10 text-gris-1 border-gris-1/40',
    cerrada: 'bg-gris-1/10 text-gris-1 border-gris-1/40',
};

interface Evento {
    id_evento: number;
    id_tipo_evento: number;
    condicion: number;
    descripcion: string;
    referencia: string;
    estado: string;
    fecha_creacion?: string;
    tipoEvento?: { id_tipo_evento: number; nombre: string };
    proyecto?: { id_proyecto: number; nombre: string };
    area?: { id_area: number; nombre: string } | null;
}

function EstadoBadge({ estado }: { estado: string }) {
    const style = ESTADO_STYLES[estado] ?? ESTADO_STYLES['abierto'];
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border whitespace-nowrap ${style}`}>
            {estado.replace('_', ' ')}
        </span>
    );
}

export default function Index() {
    const { eventos, proyectos, filtros } = usePage().props as unknown as { 
        eventos: Evento[], 
        proyectos: { id_proyecto: number; nombre: string }[],
        filtros: any
    };

    const [formFiltros, setFormFiltros] = useState({
        id_proyecto: filtros?.id_proyecto ?? '',
        condicion: filtros?.condicion ?? '',
        estado: filtros?.estado ?? '',
        fecha_inicio: filtros?.fecha_inicio ?? '',
        fecha_fin: filtros?.fecha_fin ?? '',
    });

    const handleFilterChange = (field: string, value: string) => {
        const newFilters = { ...formFiltros, [field]: value };
        setFormFiltros(newFilters);
        
        // Limpiar valores vacíos para la URL
        const cleanFilters = Object.fromEntries(
            Object.entries(newFilters).filter(([_, v]) => v !== '')
        );

        import('@inertiajs/react').then(({ router }) => {
            router.get(route('eventos.index'), cleanFilters, {
                preserveState: true,
                replace: true,
                preserveScroll: true
            });
        });
    };

    const limpiarFiltros = () => {
        setFormFiltros({
            id_proyecto: '',
            condicion: '',
            estado: '',
            fecha_inicio: '',
            fecha_fin: '',
        });
        import('@inertiajs/react').then(({ router }) => {
            router.get(route('eventos.index'), {}, { preserveState: true, replace: true });
        });
    };

    const tieneFiltrosActivos = Object.values(formFiltros).some(val => val !== '');

    return (
        <MainLayout>
            <Head title="Eventos | AVA" />

            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 flex flex-col h-full min-h-[calc(100vh-80px)]">
                {/* Header & Filtros Compactos */}
                <div className="mb-6 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gris-2 mb-1">Eventos</h1>
                        <p className="text-gris-1 text-sm">Listado de reportes registrados.</p>
                    </div>

                    {/* Barra de Filtros Compacta */}
                    <div className="flex flex-wrap items-center gap-2 bg-white border border-verde-3 rounded-lg p-2 shadow-sm">
                        
                        <div className="flex items-center gap-2 px-3 sm:border-r border-verde-3/50">
                            <span className="text-xs uppercase text-gris-1 font-bold hidden sm:inline">Proyecto:</span>
                            <select 
                                value={formFiltros.id_proyecto}
                                onChange={(e) => handleFilterChange('id_proyecto', e.target.value)}
                                className="bg-transparent text-sm text-gris-2 font-medium focus:outline-none cursor-pointer py-1 w-full sm:max-w-[140px]"
                            >
                                <option value="">Todos los proyectos</option>
                                {proyectos?.map(p => (
                                    <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-3 sm:border-r border-verde-3/50">
                            <span className="text-xs uppercase text-gris-1 font-bold hidden sm:inline">Condición:</span>
                            <select 
                                value={formFiltros.condicion}
                                onChange={(e) => handleFilterChange('condicion', e.target.value)}
                                className="bg-transparent text-sm text-gris-2 font-medium focus:outline-none cursor-pointer py-1 w-full sm:max-w-[120px]"
                            >
                                <option value="">Todas</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(c => (
                                    <option key={c} value={c}>Condición {c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-3 sm:border-r border-verde-3/50">
                            <span className="text-xs uppercase text-gris-1 font-bold hidden sm:inline">Estado:</span>
                            <select 
                                value={formFiltros.estado}
                                onChange={(e) => handleFilterChange('estado', e.target.value)}
                                className="bg-transparent text-sm text-gris-2 font-medium focus:outline-none cursor-pointer py-1 w-full sm:max-w-[110px]"
                            >
                                <option value="">Todos</option>
                                <option value="abierta">Abierta</option>
                                <option value="proceso">Proceso</option>
                                <option value="cerrada">Cerrada</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-3 sm:border-r border-verde-3/50">
                            <span className="text-xs uppercase text-gris-1 font-bold hidden xl:inline">Desde:</span>
                            <input 
                                type="date"
                                value={formFiltros.fecha_inicio}
                                onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                                className="bg-transparent text-sm text-gris-2 font-medium focus:outline-none cursor-pointer py-1"
                            />
                        </div>

                        <div className="flex items-center gap-2 px-3">
                            <span className="text-xs uppercase text-gris-1 font-bold hidden xl:inline">Hasta:</span>
                            <input 
                                type="date"
                                value={formFiltros.fecha_fin}
                                onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                                className="bg-transparent text-sm text-gris-2 font-medium focus:outline-none cursor-pointer py-1"
                            />
                        </div>

                        {tieneFiltrosActivos && (
                            <button 
                                onClick={limpiarFiltros}
                                title="Limpiar Filtros"
                                className="ml-1 p-1.5 text-rojo-1 bg-rojo-1/10 rounded-md hover:bg-rojo-1 hover:text-white transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                </div>
                {/* Tabla */}
                <div className="bg-white border border-verde-3 rounded-2xl shadow-2xl overflow-hidden">
                    {eventos.length === 0 ? (
                        <div className="p-10 text-center text-gris-1 text-sm">
                            No hay eventos que coincidan con los filtros seleccionados.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-verde-3 text-left">
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            #
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Referencia
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Proyecto
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Condición
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Fecha
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Estado
                                        </th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventos.map((evento) => (
                                        <tr
                                            key={evento.id_evento}
                                            className="border-b border-verde-3/60 last:border-b-0 hover:bg-verde-2 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-gris-1 font-bold">
                                                #{evento.id_evento}
                                            </td>
                                            <td className="px-6 py-4 text-gris-2">
                                                {evento.referencia || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-gris-1">
                                                {evento.proyecto?.nombre ?? '—'}
                                            </td>
                                            <td className="px-6 py-4 text-gris-1">#{evento.condicion}</td>
                                            <td className="px-6 py-4 text-gris-1">
                                                {evento.fecha_creacion
                                                    ? new Date(evento.fecha_creacion).toLocaleDateString('es-CL')
                                                    : '—'}
                                            </td>
                                            
                                            <td className="px-6 py-4">
                                                <CerrarEvento eventoId={evento.id_evento} estado={evento.estado} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <EstadoBadge estado={evento.estado} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={route('eventos.show', evento.id_evento)}
                                                    className="text-verde-6 hover:underline font-bold text-xs uppercase"
                                                >
                                                    Ver →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

