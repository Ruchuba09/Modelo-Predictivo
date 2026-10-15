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
            className={`border-t border-[#2d3238] hover:bg-[#1a1a1a] ${
                onClick ? "cursor-pointer" : ""
            }`}
        >
            {columns.map((col) => (
                <td key={col.key} className={`p-4 ${col.className ?? ""}`}>
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