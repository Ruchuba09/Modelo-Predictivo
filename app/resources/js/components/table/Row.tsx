import type { ReactNode } from "react";
import type { Column } from "./types";

interface RowProps<T> {
    item: T;
    columns: Column<T>[];
    actions?: ReactNode;
    onClick?: (item: T) => void;
}

export default function Row<T>({ item, columns, actions, onClick }: RowProps<T>) {
    return (
        <tr
            onClick={onClick ? () => onClick(item) : undefined}
            className={`border-t border-verde-3/60 hover:bg-verde-1/50 transition-colors text-gris-2 ${
                onClick ? "cursor-pointer" : ""
            }`}
        >
            {columns.map((col) => (
                <td key={col.key} className={`p-4 text-sm text-gris-2 ${col.className ?? ""}`}>
                    {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? "")}
                </td>
            ))}

            {actions !== undefined && (
                <td className="p-4 text-right">{actions}</td>
            )}
        </tr>
    );
}