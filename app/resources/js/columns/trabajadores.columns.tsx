import type { Column } from "../components/table/types";
import type { Trabajador } from "../types/trabajador";

const TIPO_LABELS: Record<string, string> = {
    obrero: "Obrero",
    supervisor: "Supervisor",
    administrativo: "Administrativo",
};

export const trabajadoresColumns: Column<Trabajador>[] = [
    { key: "id_trabajador", header: "ID" },
    {
        key: "nombre",
        header: "Nombre",
        render: (t) => `${t.nombre_1} ${t.nombre_2 ?? ""}`.trim(),
    },
    {
        key: "apellido",
        header: "Apellido",
        render: (t) => `${t.apellido_1} ${t.apellido_2 ?? ""}`.trim(),
    },
    { key: "cargo", header: "Cargo" },
    {
        key: "id_tipo_trabajador",
        header: "Tipo Trabajador",
        render: (t) => TIPO_LABELS[t.id_tipo_trabajador] ?? t.id_tipo_trabajador,
    },
    { key: "rut", header: "RUT" },
];