import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Trabajador {
    id_trabajador: number;
    id?: number;
    nombre_1: string;
    nombre_2?: string | null;
    apellido_1: string;
    apellido_2?: string | null;
    cargo: string;
    estado?: string | null;
    id_tipo_trabajador: string;
    rut: string;
    email?: string | null;
}

interface TrabajadoresProps {
    trabajadores: Trabajador[];
}

const TIPO_LABELS: Record<string, string> = {
    obrero: 'Obrero',
    supervisor: 'Supervisor',
    administrativo: 'Administrativo',
};

const TIPO_ESTILOS: Record<string, string> = {
    obrero: 'bg-verde-2 text-verde-6 border border-verde-3',
    supervisor: 'bg-verde-5/20 text-verde-6 border border-verde-5/40',
    administrativo: 'bg-amarillo-2 text-amarillo-1 border border-amarillo-1/40',
};

const Trabajadores: React.FC<TrabajadoresProps> = ({ trabajadores }) => {
    const eliminar = (id: number, nombre: string) => {
        if (confirm(`¿Seguro que deseas eliminar al trabajador "${nombre}"?`)) {
            router.delete(route('trabajadores.destroy', id));
        }
    };

    return (
        <MainLayout>
            <Head title="Trabajadores | AVA" />

            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 flex flex-col h-full min-h-[calc(100vh-80px)]">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gris-2 mb-1">Trabajadores</h1>
                        <p className="text-gris-1 text-sm">
                            Listado general de trabajadores, cargos y roles asignados en terreno.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-verde-2 border border-verde-3 rounded-xl px-5 py-3">
                            <p className="text-[10px] uppercase tracking-wider text-gris-1 font-bold">Total</p>
                            <p className="text-2xl font-bold text-verde-6">{trabajadores.length}</p>
                        </div>

                        <Link
                            href={route('trabajadores.create')}
                            className="bg-verde-5 hover:bg-verde-6 text-gris-2 rounded-lg font-bold px-5 py-3 text-sm transition-colors shadow-lg shadow-verde-5/20"
                        >
                            + Nuevo trabajador
                        </Link>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white border border-verde-3 rounded-2xl shadow-2xl overflow-hidden flex-1 flex flex-col min-h-0">
                    {trabajadores.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 p-10 text-center">
                            <div className="w-16 h-16 rounded-full bg-verde-2 flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-verde-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-gris-2">No hay trabajadores registrados</h2>
                            <p className="text-sm text-gris-1 mt-1">Registra el primer trabajador para comenzar.</p>
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
                                            Nombre Completo
                                        </th>
                                        <th className="text-center px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            RUT
                                        </th>
                                        <th className="text-left px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Cargo
                                        </th>
                                        <th className="text-center px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Tipo Trabajador
                                        </th>
                                        <th className="text-center px-6 py-4 text-[12px] uppercase tracking-wider text-gris-1 font-bold">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {trabajadores.map((trabajador) => {
                                        const idTrab = trabajador.id_trabajador ?? trabajador.id ?? 0;
                                        const nombreCompleto = [
                                            trabajador.nombre_1,
                                            trabajador.nombre_2,
                                            trabajador.apellido_1,
                                            trabajador.apellido_2,
                                        ]
                                            .filter(Boolean)
                                            .join(' ');
                                        const tipoKey = (trabajador.id_tipo_trabajador || '').toLowerCase();
                                        const badgeClass =
                                            TIPO_ESTILOS[tipoKey] ??
                                            'bg-verde-2 text-gris-1 border border-verde-3';

                                        return (
                                            <tr
                                                key={idTrab}
                                                className="border-b border-verde-3/60 last:border-b-0 hover:bg-verde-2 transition-colors"
                                            >
                                                <td className="px-6 py-4 text-gris-1 font-bold text-center whitespace-nowrap">
                                                    #{idTrab}
                                                </td>
                                                <td className="px-6 py-4 text-left">
                                                    <div className="font-bold text-gris-2">
                                                        {nombreCompleto || 'Sin nombre'}
                                                    </div>
                                                    {trabajador.email && (
                                                        <div className="text-xs text-gris-1 mt-0.5">
                                                            {trabajador.email}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gris-1 font-medium text-center whitespace-nowrap">
                                                    {trabajador.rut || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-gris-2 text-left">
                                                    {trabajador.cargo || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <span
                                                        className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
                                                    >
                                                        {TIPO_LABELS[tipoKey] ??
                                                            trabajador.id_tipo_trabajador ??
                                                            'Sin asignar'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <Link
                                                            href={route('trabajadores.show', idTrab)}
                                                            className="text-verde-6 hover:underline font-bold text-xs uppercase"
                                                        >
                                                            Ver ➔
                                                        </Link>
                                                        <Link
                                                            href={route('trabajadores.edit', idTrab)}
                                                            className="text-gris-2 hover:text-verde-6 hover:underline font-bold text-xs uppercase"
                                                        >
                                                            Editar
                                                        </Link>
                                                        <button
                                                            onClick={() => eliminar(idTrab, nombreCompleto)}
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
};

export default Trabajadores;
