import { Head, Link } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { useProyectos } from '../../hooks/useProyectos';

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

export default function Index() {
    const { proyectos, loading, error, eliminar } = useProyectos();

    const handleEliminar = (id: number, nombre: string) => {
        if (confirm(`¿Seguro que deseas eliminar el proyecto "${nombre}"?`)) {
            eliminar(id);
        }
    };

    return (
        <MainLayout>
            <Head title="Proyectos | AVA" />

            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 flex flex-col h-full min-h-[calc(100vh-80px)]">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gris-2 mb-1">Proyectos</h1>
                        <p className="text-gris-1 text-sm">Gestión de proyectos, clientes y faenas asociadas.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-verde-2 border border-verde-3 rounded-xl px-5 py-3">
                            <p className="text-[10px] uppercase tracking-wider text-gris-1 font-bold">Total</p>
                            <p className="text-2xl font-bold text-verde-6">{proyectos.length}</p>
                        </div>

                        <Link
                            href="/proyectos/create"
                            className="bg-verde-5 hover:bg-verde-6 text-gris-2 rounded-lg font-bold px-5 py-3 text-sm transition-colors shadow-lg shadow-verde-5/20"
                        >
                            + Nuevo proyecto
                        </Link>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 px-4 py-3 rounded-lg border border-rojo-1/40 bg-rojo-1/10 text-rojo-1 text-sm font-bold">
                        {error}
                    </div>
                )}

                {/* Tabla */}
                <div className="bg-white border border-verde-3 rounded-2xl shadow-2xl overflow-hidden flex-1 flex flex-col min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center flex-1 p-10 text-gris-1 text-sm">
                            Cargando proyectos...
                        </div>
                    ) : proyectos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 p-10 text-center">
                            <div className="w-16 h-16 rounded-full bg-verde-2 flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-verde-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-gris-2">No hay proyectos registrados</h2>
                            <p className="text-sm text-gris-1 mt-1">Crea el primer proyecto para comenzar.</p>
                        </div>
                    ) : (
                        <div className="overflow-auto flex-1 relative">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                    <tr className="border-b border-verde-3">
                                        <th className="text-center px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            ID
                                        </th>
                                        <th className="text-left px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Proyecto
                                        </th>
                                        <th className="text-left px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Cliente
                                        </th>
                                        <th className="text-left px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Faena
                                        </th>
                                        <th className="text-center px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Estado
                                        </th>
                                        <th className="text-center px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {proyectos.map((proyecto) => {
                                        const estadoKey = (proyecto.estado || '').toLowerCase();
                                        const badgeClass =
                                            ESTADO_ESTILOS[estadoKey] ??
                                            'bg-verde-2 text-verde-6 border border-verde-3';

                                        return (
                                            <tr
                                                key={proyecto.id_proyecto}
                                                className="border-b border-verde-3/60 last:border-b-0 hover:bg-verde-2 transition-colors"
                                            >
                                                <td className="px-6 py-4 text-gris-1 font-bold text-center whitespace-nowrap">
                                                    #{proyecto.id_proyecto}
                                                </td>

                                                <td className="px-6 py-4 text-left">
                                                    <Link
                                                        href={`/proyectos/${proyecto.id_proyecto}`}
                                                        className="text-gris-2 font-bold hover:text-verde-6 transition-colors"
                                                    >
                                                        {proyecto.nombre}
                                                    </Link>
                                                </td>

                                                <td className="px-6 py-4 text-gris-1 text-left">
                                                    {proyecto.cliente?.nombre ?? 'Sin cliente'}
                                                </td>

                                                <td className="px-6 py-4 text-gris-1 text-left">
                                                    {proyecto.faena?.nombre ?? 'Sin faena'}
                                                </td>

                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <span
                                                        className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
                                                    >
                                                        {ESTADO_LABELS[estadoKey] ?? proyecto.estado}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <Link
                                                            href={`/proyectos/${proyecto.id_proyecto}`}
                                                            className="text-verde-6 hover:underline font-bold text-xs uppercase"
                                                        >
                                                            Ver ➔
                                                        </Link>
                                                        <button
                                                            onClick={() =>
                                                                handleEliminar(proyecto.id_proyecto, proyecto.nombre)
                                                            }
                                                            className="text-rojo-1 hover:underline font-bold text-xs uppercase"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}