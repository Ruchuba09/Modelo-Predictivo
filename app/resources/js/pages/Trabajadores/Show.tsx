import React from 'react';
import { Head, Link } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Trabajador {
    id_trabajador?: number;
    id?: number;
    nombre_1: string;
    nombre_2: string;
    apellido_1: string;
    apellido_2: string;
    cargo: string;
    estado?: string | null;
    id_tipo_trabajador: string;
    rut: string;
    email: string;
}

interface ShowProps {
    trabajador: Trabajador;
}

const TIPO_LABELS: Record<string, string> = {
    obrero: 'Obrero',
    supervisor: 'Supervisor',
    administrativo: 'Administrativo',
};

const Show: React.FC<ShowProps> = ({ trabajador }) => {
    const idTrabajador = trabajador.id_trabajador ?? trabajador.id ?? 0;
    const nombreCompleto = [
        trabajador.nombre_1,
        trabajador.nombre_2,
        trabajador.apellido_1,
        trabajador.apellido_2,
    ]
        .filter(Boolean)
        .join(' ');
    const tipoKey = (trabajador.id_tipo_trabajador || '').toLowerCase();

    return (
        <MainLayout>
            <Head title={`Trabajador #${idTrabajador} | AVA`} />

            <div className="max-w-[1100px] mx-auto p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gris-1 font-bold">
                            Ficha de trabajador #{idTrabajador}
                        </p>
                        <h1 className="text-3xl font-bold text-gris-2 mt-1">
                            {nombreCompleto || 'Trabajador'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={route('trabajadores.edit', idTrabajador)}
                            className="bg-verde-5 hover:bg-verde-6 text-black rounded-lg font-bold px-5 py-2.5 text-sm transition-colors shadow-lg shadow-verde-5/20"
                        >
                            Editar trabajador
                        </Link>
                        <Link
                            href={route('trabajadores.index')}
                            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-bold bg-white text-verde-6 border border-verde-5 hover:bg-verde-5 hover:text-black transition-all shadow-sm"
                        >
                            ← Volver al listado
                        </Link>
                    </div>
                </div>

                {/* Tarjeta de detalle */}
                <div className="bg-white border border-verde-3 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6">
                    <div className="flex items-center justify-between border-b border-verde-3 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gris-2">Información general</h2>
                            <p className="text-xs text-gris-1 mt-0.5">
                                Datos personales y laborales registrados en el sistema.
                            </p>
                        </div>
                        <span className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-verde-5/20 text-verde-6 border border-verde-5/40">
                            {TIPO_LABELS[tipoKey] ?? trabajador.id_tipo_trabajador ?? 'Sin tipo'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-verde-1 border border-verde-3 rounded-xl p-4">
                            <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">
                                ID Trabajador
                            </p>
                            <p className="text-sm font-bold text-gris-2 mt-1">#{idTrabajador}</p>
                        </div>

                        <div className="bg-verde-1 border border-verde-3 rounded-xl p-4">
                            <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">RUT</p>
                            <p className="text-sm font-bold text-gris-2 mt-1">{trabajador.rut || '—'}</p>
                        </div>

                        <div className="bg-verde-1 border border-verde-3 rounded-xl p-4">
                            <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">
                                Nombres
                            </p>
                            <p className="text-sm font-bold text-gris-2 mt-1">
                                {[trabajador.nombre_1, trabajador.nombre_2].filter(Boolean).join(' ') || '—'}
                            </p>
                        </div>

                        <div className="bg-verde-1 border border-verde-3 rounded-xl p-4">
                            <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">
                                Apellidos
                            </p>
                            <p className="text-sm font-bold text-gris-2 mt-1">
                                {[trabajador.apellido_1, trabajador.apellido_2].filter(Boolean).join(' ') || '—'}
                            </p>
                        </div>

                        <div className="bg-verde-1 border border-verde-3 rounded-xl p-4">
                            <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">Cargo</p>
                            <p className="text-sm font-bold text-gris-2 mt-1">{trabajador.cargo || '—'}</p>
                        </div>

                        <div className="bg-verde-1 border border-verde-3 rounded-xl p-4">
                            <p className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">
                                Correo electrónico
                            </p>
                            <p className="text-sm font-bold text-gris-2 mt-1">{trabajador.email || '—'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Show;