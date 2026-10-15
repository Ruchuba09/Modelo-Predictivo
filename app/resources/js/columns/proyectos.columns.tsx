import { Link } from '@inertiajs/react';
import type { Column } from "../components/table/types";
import type { Proyecto } from "../types/proyecto";

export const proyectosColumns: Column<Proyecto>[] = [
    {
        key: "nombre",
        header: "Proyecto",
        render: (p) => (
            <Link
                to={`/proyectos/${p.id_proyecto}`}
                className="font-semibold hover:text-[#a0f700]"
            >
                {p.nombre}
            </Link>
        ),
    },
    {
        key: "cliente",
        header: "Cliente",
        className: "text-[#d0d3d6]",
        render: (p) => p.cliente?.nombre ?? "Sin cliente",
    },
    {
        key: "faena",
        header: "Faena",
        className: "text-[#d0d3d6]",
        render: (p) => p.faena?.nombre ?? "Sin faena",
    },
    {
        key: "estado",
        header: "Estado",
        render: (p) => (
            <span className="px-3 py-1 rounded-full text-sm bg-[#a0f700]/10 text-[#a0f700] border border-[#a0f700]/40">
                {p.estado}
            </span>
        ),
    },
];