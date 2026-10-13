import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import "../../../css/Trabajadores.css";
import Table from "../../components/table/Table";
import AsignacionCuadrilla from "../../components/trabajadores/AsignacionCuadrilla";
import { trabajadoresColumns } from "../../columns/trabajadores.columns";
import type { Trabajador } from "../../types/trabajador";
import MainLayout from '../../layouts/MainLayout';

interface TrabajadoresProps {
    trabajadores: Trabajador[];
}

const Trabajadores: React.FC<TrabajadoresProps> = ({ trabajadores }) => {
    const eliminar = (id: number) => {
        if (confirm("¿Seguro que deseas eliminar este trabajador?")) {
            router.delete(route("trabajadores.destroy", id));
        }
    };

    return (
        <>
            <Head title="Trabajadores" />
            <MainLayout>
            <div className="trabajadores-page">
                <div className="trabajadores-header">
                    <h2>Trabajadores</h2>
                    <Link className="trabajadores-link-nuevo" href={route("trabajadores.create")}>
                        + Nuevo trabajador
                    </Link>
                </div>

                <Table
                    data={trabajadores}
                    columns={trabajadoresColumns}
                    getRowId={(t) => t.id_trabajador}
                    emptyMessage="No hay trabajadores registrados"
                    renderExpanded={(t) => <AsignacionCuadrilla trabajador={t} />}
                    rowActions={(t, { expanded, toggle }) => (
                        <div className="flex justify-end gap-4">
                            <Link
                                className="trabajadores-link-accion"
                                href={route("trabajadores.show", t.id_trabajador)}
                            >
                                Ver
                            </Link>
                            <Link
                                className="trabajadores-link-accion"
                                href={route("trabajadores.edit", t.id_trabajador)}
                            >
                                Editar
                            </Link>
                            <button
                                onClick={toggle}
                                className={expanded ? "text-[#a0f700]" : "text-[#d0d3d6] hover:text-[#a0f700]"}
                            >
                                Asignar a cuadrilla
                            </button>
                            <button
                                className="trabajadores-btn-eliminar"
                                onClick={() => eliminar(t.id_trabajador)}
                            >
                                Eliminar
                            </button>
                        </div>
                    )}
                />
            </div>
            </MainLayout>
        </>
    );
};

export default Trabajadores;