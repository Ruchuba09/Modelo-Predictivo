import React, { useState, useMemo } from "react";
import { Head, Link, router } from "@inertiajs/react";
import Table from "../../components/table/Table";
import AsignacionCuadrilla from "../../components/trabajadores/AsignacionCuadrilla";
import { trabajadoresColumns } from "../../columns/trabajadores.columns";
import type { Trabajador } from "../../types/trabajador";
import MainLayout from "../../layouts/MainLayout";

interface TrabajadoresProps {
    trabajadores: Trabajador[];
}

const Trabajadores: React.FC<TrabajadoresProps> = ({ trabajadores = [] }) => {
    const [busqueda, setBusqueda] = useState("");

    const trabajadoresFiltrados = useMemo(() => {
        if (!busqueda.trim()) return trabajadores;
        const q = busqueda.toLowerCase().trim();
        return trabajadores.filter((t) => {
            const nombre = `${t.nombre_1} ${t.nombre_2 ?? ""} ${t.apellido_1} ${t.apellido_2 ?? ""}`.toLowerCase();
            const rut = (t.rut ?? "").toLowerCase();
            const cargo = (t.cargo ?? "").toLowerCase();
            const tipo = (t.id_tipo_trabajador ?? "").toLowerCase();
            return nombre.includes(q) || rut.includes(q) || cargo.includes(q) || tipo.includes(q);
        });
    }, [trabajadores, busqueda]);

    const totalObreros = useMemo(
        () => trabajadores.filter((t) => (t.id_tipo_trabajador || "").toLowerCase() === "obrero").length,
        [trabajadores]
    );

    const totalSupervisores = useMemo(
        () => trabajadores.filter((t) => (t.id_tipo_trabajador || "").toLowerCase() === "supervisor").length,
        [trabajadores]
    );

    const eliminar = (id: number, nombre?: string) => {
        const mensaje = nombre
            ? `¿Seguro que deseas eliminar al trabajador "${nombre}"?`
            : "¿Seguro que deseas eliminar este trabajador?";
        if (confirm(mensaje)) {
            router.delete(route("trabajadores.destroy", id));
        }
    };

    return (
        <MainLayout>
            <Head title="Trabajadores | AVA" />

            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 flex flex-col h-full min-h-[calc(100vh-80px)]">
                {/* Cabecera */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gris-2 mb-1">Trabajadores</h1>
                        <p className="text-gris-1 text-sm">Listado y administración del personal de la empresa.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Tarjeta de métricas */}
                        <div className="bg-white border border-verde-3 rounded-2xl px-5 py-2.5 shadow-sm flex items-center gap-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-gris-1 font-bold">Total</p>
                                <p className="text-2xl font-black text-gris-2">{trabajadores.length}</p>
                            </div>
                            <div className="h-8 w-px bg-verde-3/80" />
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-gris-1 font-bold">Obreros</p>
                                <p className="text-lg font-bold text-verde-6">{totalObreros}</p>
                            </div>
                            <div className="h-8 w-px bg-verde-3/80" />
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-gris-1 font-bold">Supervisores</p>
                                <p className="text-lg font-bold text-amarillo-1">{totalSupervisores}</p>
                            </div>
                        </div>

                        {/* Botón Crear */}
                        <Link
                            href={route("trabajadores.create")}
                            className="bg-verde-5 hover:bg-verde-6 text-black rounded-xl font-bold px-5 py-3 text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                            Nuevo trabajador
                        </Link>
                    </div>
                </div>

                {/* Barra de búsqueda y filtros */}
                <div className="mb-5 bg-white border border-verde-3 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <svg
                            className="w-4 h-4 text-gris-1 absolute left-3.5 top-1/2 -translate-y-1/2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por nombre, RUT, cargo o tipo..."
                            className="w-full bg-verde-1/50 border border-verde-3 rounded-xl pl-10 pr-4 py-2 text-xs text-gris-2 placeholder-gris-1 focus:outline-none focus:border-verde-5 font-medium transition-colors"
                        />
                        {busqueda && (
                            <button
                                type="button"
                                onClick={() => setBusqueda("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gris-1 hover:text-gris-2 text-xs font-bold"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="text-xs text-gris-1 font-semibold flex items-center gap-2">
                        <span>Mostrando</span>
                        <span className="font-bold text-gris-2">{trabajadoresFiltrados.length}</span>
                        <span>de</span>
                        <span className="font-bold text-gris-2">{trabajadores.length}</span>
                        <span>trabajadores</span>
                    </div>
                </div>

                {/* Tabla de Trabajadores */}
                <Table
                    data={trabajadoresFiltrados}
                    columns={trabajadoresColumns}
                    getRowId={(t) => t.id_trabajador}
                    emptyMessage="No hay trabajadores registrados en este momento."
                    renderExpanded={(t) => <AsignacionCuadrilla trabajador={t} />}
                    rowActions={(t, { expanded, toggle }) => (
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
                                {expanded ? "Cerrar cuadrilla" : "Cuadrilla"}
                            </button>
                            <Link
                                href={route("trabajadores.show", t.id_trabajador)}
                                className="px-3 py-1.5 rounded-lg border border-verde-3 bg-white hover:bg-verde-2 text-gris-2 text-xs font-bold transition-all"
                            >
                                Ver
                            </Link>
                            <Link
                                href={route("trabajadores.edit", t.id_trabajador)}
                                className="px-3 py-1.5 rounded-lg border border-verde-3 bg-white hover:bg-verde-2 text-gris-2 text-xs font-bold transition-all"
                            >
                                Editar
                            </Link>
                            <button
                                type="button"
                                onClick={() => eliminar(t.id_trabajador, `${t.nombre_1} ${t.apellido_1}`)}
                                className="px-3 py-1.5 rounded-lg border border-rojo-1/30 bg-rojo-1/10 hover:bg-rojo-1 text-rojo-1 hover:text-white text-xs font-bold transition-all cursor-pointer"
                            >
                                Eliminar
                            </button>
                        </div>
                    )}
                />
            </div>
        </MainLayout>
    );
};

export default Trabajadores;