import { Head, Link } from '@inertiajs/react';
import { useProyectos } from "../../hooks/useProyectos";
import Table from "../../components/table/Table";
import { proyectosColumns } from "../../columns/proyectos.columns";
import AsignacionCuadrillas from "../../components/proyectos/AsignacionCuadrillas";
import MainLayout from '../../layouts/MainLayout';

export default function Index() {
    const { proyectos, loading, error, eliminar } = useProyectos();

    if (loading) {
        return (
            <MainLayout>
                <Head title="Proyectos | AVA" />
                <div className="max-w-[1700px] mx-auto p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
                    <div className="bg-white border border-verde-3 rounded-2xl p-8 shadow-sm flex items-center gap-3 text-gris-1 text-sm font-semibold">
                        <svg className="animate-spin w-5 h-5 text-verde-6" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        Cargando proyectos...
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Head title="Proyectos | AVA" />

            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 flex flex-col h-full min-h-[calc(100vh-80px)]">
                {/* Cabecera */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gris-2 mb-1">Proyectos</h1>
                        <p className="text-gris-1 text-sm">Listado y administración de proyectos de faena.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-white border border-verde-3 rounded-2xl px-5 py-2.5 shadow-sm flex items-center gap-3">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-gris-1 font-bold">Total</p>
                                <p className="text-2xl font-black text-gris-2">{proyectos.length}</p>
                            </div>
                        </div>

                        <Link
                            href="/proyectos/create"
                            className="bg-verde-5 hover:bg-verde-6 text-black rounded-xl font-bold px-5 py-3 text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                            Nuevo proyecto
                        </Link>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 px-4 py-3 rounded-xl border border-rojo-1/40 bg-rojo-1/10 text-rojo-1 text-sm font-bold flex items-center gap-2">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Tabla de Proyectos */}
                <Table
                    data={proyectos}
                    columns={proyectosColumns}
                    getRowId={(p) => p.id_proyecto}
                    emptyMessage="No hay proyectos registrados en este momento."
                    renderExpanded={(p) => <AsignacionCuadrillas idProyecto={p.id_proyecto} />}
                    rowActions={(p, { expanded, toggle }) => (
                        <div className="flex justify-end items-center gap-2">
                            <button
                                type="button"
                                onClick={toggle}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    expanded
                                        ? "bg-verde-5 text-black font-extrabold shadow-sm"
                                        : "bg-white border border-verde-3 text-gris-2 hover:bg-verde-2"
                                }`}
                            >
                                {expanded ? "Cerrar cuadrillas" : "Asignar cuadrilla"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm(`¿Estás seguro de que deseas eliminar el proyecto "${p.nombre}"?`)) {
                                        eliminar(p.id_proyecto);
                                    }
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rojo-1/10 text-rojo-1 hover:bg-rojo-1 hover:text-white transition-all cursor-pointer"
                            >
                                Eliminar
                            </button>
                        </div>
                    )}
                />
            </div>
        </MainLayout>
    );
}