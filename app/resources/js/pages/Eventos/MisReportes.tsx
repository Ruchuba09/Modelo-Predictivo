import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';
import MainLayout from '../../layouts/MainLayout';

const ESTADO_STYLES: { [key: string]: string } = {
    abierta: 'bg-verde-5/10 text-verde-6 border-verde-5/40',
    abierto: 'bg-verde-5/10 text-verde-6 border-verde-5/40',
    en_revision: 'bg-amarillo-1/10 text-amarillo-1 border-amarillo-1/40',
    proceso: 'bg-amarillo-1/10 text-amarillo-1 border-amarillo-1/40',
    cerrada: 'bg-gris-1/10 text-gris-1 border-gris-1/40',
    cerrado: 'bg-gris-1/10 text-gris-1 border-gris-1/40',
};

interface Evento {
    id_evento: number;
    id_tipo_evento: number;
    id_trabajador: number;
    condicion: number;
    descripcion: string;
    referencia: string;
    estado: string;
    fecha_creacion?: string;
    proyecto?: {
        id_proyecto: number;
        nombre: string;
    };
}

interface Props {
    eventos: Evento[];
    proyectos?: { id_proyecto: number; nombre: string }[];
    filtros?: any;
}

function EstadoBadge({ estado }: { estado: string }) {
    const style = ESTADO_STYLES[estado] ?? ESTADO_STYLES['abierta'];

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase border whitespace-nowrap ${style}`}
        >
            {estado.replace('_', ' ')}
        </span>
    );
}

export default function MisReportes() {
    const { eventos = [], proyectos = [], filtros = {} } = usePage().props as unknown as Props;

    const [formFiltros, setFormFiltros] = useState({
        id_evento: filtros?.id_evento ?? '',
        id_proyecto: filtros?.id_proyecto ?? '',
        estado: filtros?.estado ?? filtros?.condicion ?? '',
        fecha_inicio: filtros?.fecha_inicio ?? '',
        fecha_fin: filtros?.fecha_fin ?? '',
    });

    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const ejecutarFiltro = (newFilters: typeof formFiltros) => {
        const cleanFilters = Object.fromEntries(
            Object.entries(newFilters).filter(([_, v]) => v !== '')
        );

        import('@inertiajs/react').then(({ router }) => {
            router.get(route('eventos.mis-reportes'), cleanFilters, {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            });
        });
    };

    const handleFilterChange = (field: string, value: string) => {
        const newFilters = { ...formFiltros, [field]: value };
        setFormFiltros(newFilters);

        if (field === 'id_evento') {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                ejecutarFiltro(newFilters);
            }, 350);
        } else {
            ejecutarFiltro(newFilters);
        }
    };

    const limpiarFiltros = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setFormFiltros({
            id_evento: '',
            id_proyecto: '',
            estado: '',
            fecha_inicio: '',
            fecha_fin: '',
        });
        import('@inertiajs/react').then(({ router }) => {
            router.get(route('eventos.mis-reportes'), {}, { preserveState: true, replace: true });
        });
    };

    const tieneFiltrosActivos = Object.values(formFiltros).some((val) => val !== '');

    return (
        <MainLayout>
            <Head title="Mis Reportes | AVA" />

            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 flex flex-col h-full min-h-[calc(100vh-80px)]">
                {/* Barra de Filtros Espaciosa */}
                <div className="mb-6 bg-white dark:bg-[#1E242B] border border-verde-3 dark:border-[#2A333E] rounded-xl p-3.5 shadow-sm flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 shrink-0 transition-colors">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 flex-1">
                        {/* 1. N° Reporte / ID (primero y escrito) */}
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase text-gris-1 dark:text-gray-400 font-bold tracking-wider mb-1">
                                N° Reporte (ID)
                            </label>
                            <input
                                type="text"
                                value={formFiltros.id_evento}
                                onChange={(e) => handleFilterChange('id_evento', e.target.value)}
                                placeholder="Ej: 15"
                                className="bg-verde-1 dark:bg-[#151A1F] border border-verde-3 dark:border-[#2A333E] rounded-md px-2.5 py-1.5 text-sm text-gris-2 dark:text-white font-medium focus:outline-none focus:border-verde-5 w-full transition-colors"
                            />
                        </div>

                        {/* 2. Proyecto */}
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase text-gris-1 dark:text-gray-400 font-bold tracking-wider mb-1">
                                Proyecto
                            </label>
                            <select
                                value={formFiltros.id_proyecto}
                                onChange={(e) => handleFilterChange('id_proyecto', e.target.value)}
                                className="bg-verde-1 dark:bg-[#151A1F] border border-verde-3 dark:border-[#2A333E] rounded-md px-2.5 py-1.5 text-sm text-gris-2 dark:text-white font-medium focus:outline-none focus:border-verde-5 cursor-pointer w-full transition-colors"
                            >
                                <option value="">Todos los proyectos</option>
                                {proyectos?.map((p) => (
                                    <option key={p.id_proyecto} value={p.id_proyecto}>
                                        {p.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Condición (solamente abierto o cerrado) */}
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase text-gris-1 dark:text-gray-400 font-bold tracking-wider mb-1">
                                Condición
                            </label>
                            <select
                                value={formFiltros.estado}
                                onChange={(e) => handleFilterChange('estado', e.target.value)}
                                className="bg-verde-1 dark:bg-[#151A1F] border border-verde-3 dark:border-[#2A333E] rounded-md px-2.5 py-1.5 text-sm text-gris-2 dark:text-white font-medium focus:outline-none focus:border-verde-5 cursor-pointer w-full transition-colors"
                            >
                                <option value="">Todas</option>
                                <option value="abierto">Abierto</option>
                                <option value="cerrado">Cerrado</option>
                            </select>
                        </div>

                        {/* 4. Desde */}
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase text-gris-1 dark:text-gray-400 font-bold tracking-wider mb-1">
                                Desde
                            </label>
                            <input
                                type="date"
                                value={formFiltros.fecha_inicio}
                                onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                                className="bg-verde-1 dark:bg-[#151A1F] border border-verde-3 dark:border-[#2A333E] rounded-md px-2.5 py-1.5 text-sm text-gris-2 dark:text-white font-medium focus:outline-none focus:border-verde-5 cursor-pointer w-full transition-colors"
                            />
                        </div>

                        {/* 5. Hasta */}
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase text-gris-1 dark:text-gray-400 font-bold tracking-wider mb-1">
                                Hasta
                            </label>
                            <input
                                type="date"
                                value={formFiltros.fecha_fin}
                                onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                                className="bg-verde-1 dark:bg-[#151A1F] border border-verde-3 dark:border-[#2A333E] rounded-md px-2.5 py-1.5 text-sm text-gris-2 dark:text-white font-medium focus:outline-none focus:border-verde-5 cursor-pointer w-full transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end 2xl:self-center">
                        {tieneFiltrosActivos && (
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="text-xs font-bold text-rojo-1 hover:underline px-2 py-1.5 cursor-pointer whitespace-nowrap"
                            >
                                Limpiar filtros ✕
                            </button>
                        )}
                        <div className="bg-white dark:bg-[#151A1F] border border-verde-3 dark:border-[#2A333E] rounded-lg px-3 py-1.5 shadow-sm flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-gris-1 dark:text-gray-400 font-bold">
                                Total:
                            </span>
                            <span className="text-sm font-black text-verde-6">{eventos.length}</span>
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white border border-verde-3 rounded-2xl shadow-2xl overflow-hidden flex-1 flex flex-col min-h-0">
                    {eventos.length === 0 ? (
                        <div className="p-10 text-center text-gris-1 text-sm">
                            No tienes reportes registrados en este momento.
                        </div>
                    ) : (
                        <div className="overflow-auto flex-1 relative">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                    <tr className="border-b border-verde-3 text-left">
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold text-center w-16">
                                            ID
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Área/Zona
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Proyecto
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold text-center">
                                            Condición
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold text-center">
                                            Fecha
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold text-center">
                                            Estado
                                        </th>
                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold text-center">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventos.map((evento) => (
                                        <tr
                                            key={evento.id_evento}
                                            className="border-b border-verde-3/60 last:border-b-0 hover:bg-verde-2 transition-colors"
                                        >
                                            {/* ID */}
                                            <td className="px-6 py-4 text-gris-1 font-bold text-center">
                                                {evento.id_evento}
                                            </td>

                                            {/* Área/Zona */}
                                            <td className="px-6 py-4 text-gris-1">
                                                {evento.referencia ?? '—'}
                                            </td>

                                            {/* Proyecto */}
                                            <td className="px-6 py-4 text-gris-1">
                                                {evento.proyecto?.nombre ?? '—'}
                                            </td>

                                            {/* Condición */}
                                            <td className="px-6 py-4 text-gris-1 font-bold text-center whitespace-nowrap">
                                                {evento.condicion != null && evento.condicion !== ''
                                                    ? parseInt(String(evento.condicion), 10)
                                                    : '—'}
                                            </td>

                                            {/* Fecha */}
                                            <td className="px-6 py-4 text-gris-1 text-center whitespace-nowrap">
                                                {evento.fecha_creacion
                                                    ? new Date(evento.fecha_creacion).toLocaleDateString('es-CL')
                                                    : '—'}
                                            </td>

                                            {/* Estado */}
                                            <td className="px-6 py-4 text-center">
                                                <EstadoBadge estado={evento.estado} />
                                            </td>

                                            {/* Acciones */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center">
                                                    <Link
                                                        href={route('eventos.show', evento.id_evento)}
                                                        className="text-verde-6 hover:underline font-bold text-xs uppercase"
                                                    >
                                                        Ver ➔
                                                    </Link>
                                                </div>
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