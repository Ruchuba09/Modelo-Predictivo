import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { useProyectos } from '../../hooks/useProyectos';

interface PageProps {
    id: number;
    [key: string]: unknown;
}

const ESTADO_ESTILOS: Record<string, string> = {
    activo: 'bg-verde-5/20 text-verde-6 border border-verde-5/40',
    en_proceso: 'bg-amarillo-2 text-amarillo-1 border border-amarillo-1/40',
    pausado: 'bg-naranja-2 text-naranja-1 border border-naranja-1/40',
    finalizado: 'bg-verde-2 text-gris-1 border border-verde-3',
    cerrado: 'bg-verde-2 text-gris-1 border border-verde-3',
};

const ESTADO_LABELS: Record<string, string> = {
    activo: 'Activo',
    en_proceso: 'En proceso',
    pausado: 'Pausado',
    finalizado: 'Finalizado',
    cerrado: 'Cerrado',
};

export default function Show() {
    const { id } = usePage<PageProps>().props;
    const { proyecto, loading, error } = useProyectos(id ? Number(id) : undefined);

    if (loading) {
        return (
            <MainLayout>
                <Head title="Cargando proyecto | AVA" />
                <div className="max-w-[1100px] mx-auto p-6 lg:p-8">
                    <div className="bg-white border border-verde-3 rounded-2xl p-10 shadow-2xl text-center text-gris-1 text-sm">
                        Cargando proyecto...
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (error || !proyecto) {
        return (
            <MainLayout>
                <Head title="Proyecto no encontrado | AVA" />
                <div className="max-w-[1100px] mx-auto p-6 lg:p-8">
                    <div className="bg-white border border-verde-3 rounded-2xl p-8 shadow-2xl">
                        <h1 className="text-2xl font-bold text-gris-2">Proyecto no encontrado</h1>
                        <p className="text-gris-1 text-sm mt-2">{error || 'No se pudo encontrar el proyecto solicitado.'}</p>
                        <Link
                            href="/proyectos"
                            className="inline-flex items-center mt-6 px-4 py-2.5 rounded-lg text-sm font-bold bg-white text-verde-6 border border-verde-5 hover:bg-verde-5 hover:text-black transition-all shadow-sm"
                        >
                            ← Volver al listado
                        </Link>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const estadoKey = (proyecto.estado || '').toLowerCase();
    const badgeClass = ESTADO_ESTILOS[estadoKey] ?? 'bg-verde-2 text-verde-6 border border-verde-3';

    return (
        <MainLayout>
            <Head title={`${proyecto.nombre} | AVA`} />

            <div className="max-w-[1100px] mx-auto p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gris-1 font-bold">
                            Proyecto #{proyecto.id_proyecto}
                        </p>
                        <h1 className="text-3xl font-bold text-gris-2 mt-1">{proyecto.nombre}</h1>
                    </div>

                    <Link
                        href="/proyectos"
                        className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-bold bg-white text-verde-6 border border-verde-5 hover:bg-verde-5 hover:text-black transition-all shadow-sm"
                    >
                        ← Volver al listado
                    </Link>
                </div>

                {/* Tarjetas de resumen */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-verde-3 rounded-2xl p-5 shadow-md">
                        <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">Cliente</p>
                        <p className="text-base font-bold text-gris-2 mt-1.5">
                            {proyecto.cliente?.razon_social ?? proyecto.cliente?.nombre ?? 'Sin cliente'}
                        </p>
                    </div>

                    <div className="bg-white border border-verde-3 rounded-2xl p-5 shadow-md">
                        <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">Faena</p>
                        <p className="text-base font-bold text-gris-2 mt-1.5">
                            {proyecto.faena?.nombre ?? 'Sin faena'}
                        </p>
                    </div>

                    <div className="bg-white border border-verde-3 rounded-2xl p-5 shadow-md">
                        <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">Estado</p>
                        <div className="mt-2">
                            <span
                                className={`inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${badgeClass}`}
                            >
                                {ESTADO_LABELS[estadoKey] ?? proyecto.estado}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white border border-verde-3 rounded-2xl p-5 shadow-md">
                        <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">Ubicación</p>
                        <p className="text-base font-bold text-gris-2 mt-1.5">
                            {proyecto.ubicacion ?? 'Sin ubicación'}
                        </p>
                    </div>
                </div>

                {/* Detalle completo */}
                <div className="bg-white border border-verde-3 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6">
                    <div className="border-b border-verde-3 pb-3">
                        <h2 className="text-lg font-bold text-gris-2">Detalles del proyecto</h2>
                    </div>

                    <div>
                        <p className="text-xs uppercase tracking-wider text-gris-1 font-bold mb-2">Descripción</p>
                        <p className="text-sm text-gris-2 bg-verde-1 border border-verde-3 rounded-xl p-4 whitespace-pre-line">
                            {proyecto.descripcion || 'Sin descripción registrada.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-verde-3">
                        <div className="bg-verde-1 border border-verde-3 rounded-xl p-4">
                            <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">Fecha de inicio</p>
                            <p className="text-sm font-bold text-gris-2 mt-1">
                                {proyecto.fecha_inicio ?? 'No definida'}
                            </p>
                        </div>

                        <div className="bg-verde-1 border border-verde-3 rounded-xl p-4">
                            <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">Fecha de término</p>
                            <p className="text-sm font-bold text-gris-2 mt-1">
                                {proyecto.fecha_termino ?? 'No definida'}
                            </p>
                        </div>
                        <div className="bg-verde-1 border border-verde-3 rounded-xl p-4">
                            <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">ID proyecto INTRAVA</p>
                            <p className="text-sm font-bold text-gris-2 mt-1">{proyecto.id_proyecto_intrava ?? 'No vinculado'}</p>
                        </div>
                        <div className="bg-verde-1 border border-verde-3 rounded-xl p-4">
                            <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">Centro de costo</p>
                            <p className="text-sm font-bold text-gris-2 mt-1">{proyecto.centro_costo ?? 'No definido'}</p>
                        </div>
                        <div className="bg-verde-1 border border-verde-3 rounded-xl p-4">
                            <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">Alias INTRAVA</p>
                            <p className="text-sm font-bold text-gris-2 mt-1">{proyecto.alias ?? 'No definido'}</p>
                        </div>
                        <div className="bg-verde-1 border border-verde-3 rounded-xl p-4">
                            <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">Número de contrato</p>
                            <p className="text-sm font-bold text-gris-2 mt-1">{proyecto.num_contrato ?? 'No definido'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
