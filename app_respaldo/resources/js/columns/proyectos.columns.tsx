import { Link } from '@inertiajs/react';
import type { Column } from "../components/table/types";
import type { Proyecto } from "../types/proyecto";

export const proyectosColumns: Column<Proyecto>[] = [
    {
        key: "nombre",
        header: "Proyecto",
        render: (p) => (
            <Link
                href={`/proyectos/${p.id_proyecto}`}
                className="font-bold text-gris-2 hover:text-verde-6 transition-colors inline-flex items-center gap-1.5"
            >
                <span>{p.nombre}</span>
                <svg className="w-3.5 h-3.5 text-gris-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </Link>
        ),
    },
    {
        key: "cliente",
        header: "Cliente",
        className: "text-gris-1 font-medium",
        render: (p) => p.cliente?.nombre ?? "Sin cliente",
    },
    {
        key: "faena",
        header: "Faena",
        className: "text-gris-1 font-medium",
        render: (p) => p.faena?.nombre ?? "Sin faena",
    },
    {
        key: "estado",
        header: "Estado",
        render: (p) => {
            const estado = (p.estado || '').toLowerCase();
            if (estado === 'activo') {
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-verde-5/20 text-verde-6 border border-verde-5/40">
                        Activo
                    </span>
                );
            }
            if (estado === 'en_proceso' || estado === 'proceso') {
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amarillo-1/15 text-amarillo-1 border border-amarillo-1/40">
                        En proceso
                    </span>
                );
            }
            if (estado === 'pausado') {
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-naranjo-1/10 text-naranjo-1 border border-naranjo-1/30">
                        Pausado
                    </span>
                );
            }
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gris-1/10 text-gris-1 border border-gris-1/30">
                    {p.estado || 'Inactivo'}
                </span>
            );
        },
    },
];