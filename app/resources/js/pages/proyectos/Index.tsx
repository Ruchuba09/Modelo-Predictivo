import { Link } from '@inertiajs/react';
import { useProyectos } from "../../hooks/useProyectos";
import Table from "../../components/table/Table";
import { proyectosColumns } from "../../columns/proyectos.columns";
import AsignacionCuadrillas from "../../components/proyectos/AsignacionCuadrillas";
import MainLayout from '../../layouts/MainLayout';

export default function Index() {
    const { proyectos, loading, error, eliminar } = useProyectos();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#101010] text-white flex items-center justify-center">
                <p className="text-[#7a7f85]">Cargando proyectos...</p>
            </div>
        );
    }

    return (
        <MainLayout>
        <div className="min-h-screen bg-[#101010] text-white">
            <main className="max-w-[1700px] mx-auto p-6 lg:p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <div className="text-xs uppercase tracking-wider text-[#7a7f85] font-bold">
                            Gestión
                        </div>
                        <h1 className="text-3xl font-bold">Proyectos</h1>
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

                <Table
                    data={proyectos}
                    columns={proyectosColumns}
                    getRowId={(p) => p.id_proyecto}
                    emptyMessage="No hay proyectos registrados"
                    renderExpanded={(p) => <AsignacionCuadrillas idProyecto={p.id_proyecto} />}
                    rowActions={(p, { expanded, toggle }) => (
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={toggle}
                                className={expanded ? "text-[#a0f700]" : "text-[#d0d3d6] hover:text-[#a0f700]"}
                            >
                                Asignar cuadrilla
                            </button>
                            <button
                                onClick={() => eliminar(p.id_proyecto)}
                                className="text-red-400 hover:text-red-300"
                            >
                                Eliminar
                            </button>
                        </div>
                    )}
                />
            </main>
        </div>
        </MainLayout>
    );
}