import { Link } from "@inertiajs/react";
import type { Column } from "../components/table/types";
import type { Trabajador } from "../types/trabajador";

const TIPO_STYLES: Record<string, string> = {
    obrero: "bg-verde-2 border border-verde-3 text-verde-6",
    supervisor: "bg-amarillo-1/10 border border-amarillo-1/30 text-amarillo-1",
    administrativo: "bg-azul-1/10 border border-azul-1/30 text-azul-1",
};

const TIPO_LABELS: Record<string, string> = {
    obrero: "Obrero",
    supervisor: "Supervisor",
    administrativo: "Administrativo",
};

export const trabajadoresColumns: Column<Trabajador>[] = [
    {
        key: "id_trabajador",
        header: "ID",
        className: "font-mono text-xs text-gris-1",
        render: (t) => `#${t.id_trabajador}`,
    },
    {
        key: "nombre",
        header: "Nombre",
        render: (t) => (
            <Link
                href={`/trabajadores/${t.id_trabajador}`}
                className="font-bold text-gris-2 hover:text-verde-6 transition-colors inline-flex items-center gap-1.5"
            >
                <span>{`${t.nombre_1} ${t.nombre_2 ?? ""}`.trim()}</span>
                <svg className="w-3.5 h-3.5 text-gris-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </Link>
        ),
    },
    {
        key: "apellido",
        header: "Apellido",
        className: "font-medium text-gris-2",
        render: (t) => `${t.apellido_1} ${t.apellido_2 ?? ""}`.trim(),
    },
    {
        key: "rut",
        header: "RUT",
        className: "font-mono text-xs text-gris-2 font-medium",
        render: (t) => t.rut || "—",
    },
    {
        key: "cargo",
        header: "Cargo",
        className: "text-gris-2 font-medium text-xs",
        render: (t) => t.cargo || "—",
    },
    {
        key: "id_tipo_trabajador",
        header: "Tipo",
        render: (t) => {
            const tipoKey = (t.id_tipo_trabajador || "").toLowerCase();
            const badgeStyle = TIPO_STYLES[tipoKey] ?? "bg-verde-2 border border-verde-3 text-gris-2";
            const label = TIPO_LABELS[tipoKey] ?? t.id_tipo_trabajador ?? "—";
            return (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeStyle}`}>
                    {label}
                </span>
            );
        },
    },
];