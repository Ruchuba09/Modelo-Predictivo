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

                    <Link
                        to="/proyectos/create"
                        className="px-4 py-2 rounded-lg bg-[#a0f700] text-black font-semibold"
                    >
                        Nuevo proyecto
                    </Link>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400">
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