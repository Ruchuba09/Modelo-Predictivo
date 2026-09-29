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

            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 lg:mt-2">
                <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gris-2 mb-2">Eventos</h1>
                        <p className="text-gris-1 text-sm">Listado de reportes registrados.</p>
                    </div>
                </div>

                {/* Filtros Globales */}
                <div className="bg-white border border-verde-3 rounded-2xl p-6 mb-6 shadow-xl flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-verde-3 pb-4 mb-2">
                        <h3 className="text-sm font-bold text-gris-2 uppercase tracking-wider">Filtros de Búsqueda</h3>
                        {tieneFiltrosActivos && (
                            <button 
                                onClick={limpiarFiltros}
                                className="text-xs text-rojo-1 hover:underline font-bold"
                            >
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Filtro Proyecto */}
                        <div>
                            <label className="block text-xs uppercase text-gris-1 mb-1 font-bold">Proyecto</label>
                            <select 
                                value={formFiltros.id_proyecto}
                                onChange={(e) => handleFilterChange('id_proyecto', e.target.value)}
                                className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2.5 text-sm text-gris-2 focus:outline-none focus:border-verde-5 transition-colors"
                            >
                                <option value="">Todos los proyectos</option>
                                {proyectos?.map(p => (
                                    <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro Condición */}
                        <div>
                            <label className="block text-xs uppercase text-gris-1 mb-1 font-bold">Condición</label>
                            <select 
                                value={formFiltros.condicion}
                                onChange={(e) => handleFilterChange('condicion', e.target.value)}
                                className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2.5 text-sm text-gris-2 focus:outline-none focus:border-verde-5 transition-colors"
                            >
                                <option value="">Todas</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(c => (
                                    <option key={c} value={c}>Condición {c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro Estado */}
                        <div>
                            <label className="block text-xs uppercase text-gris-1 mb-1 font-bold">Estado</label>
                            <select 
                                value={formFiltros.estado}
                                onChange={(e) => handleFilterChange('estado', e.target.value)}
                                className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2.5 text-sm text-gris-2 focus:outline-none focus:border-verde-5 transition-colors"
                            >
                                <option value="">Todos los estados</option>
                                <option value="abierta">Abierta</option>
                                <option value="proceso">Proceso</option>
                                <option value="cerrada">Cerrada</option>
                            </select>
                        </div>

                        {/* Filtro Fecha Desde */}
                        <div>
                            <label className="block text-xs uppercase text-gris-1 mb-1 font-bold">Desde</label>
                            <input 
                                type="date"
                                value={formFiltros.fecha_inicio}
                                onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                                className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2 text-sm text-gris-2 focus:outline-none focus:border-verde-5 transition-colors"
                                
                            />
                        </div>

                        {/* Filtro Fecha Hasta */}
                        <div>
                            <label className="block text-xs uppercase text-gris-1 mb-1 font-bold">Hasta</label>
                            <input 
                                type="date"
                                value={formFiltros.fecha_fin}
                                onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                                className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2 text-sm text-gris-2 focus:outline-none focus:border-verde-5 transition-colors"
                                
                            />
                        </div>
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
