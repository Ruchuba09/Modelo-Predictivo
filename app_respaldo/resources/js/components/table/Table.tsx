import { Fragment, useState } from "react";
import type { ReactNode } from "react";
import Row from "./Row";
import type { Column, RowActionsContext } from "./types";

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    getRowId: (item: T) => string | number;
    rowActions?: (item: T, ctx: RowActionsContext) => ReactNode;
    renderExpanded?: (item: T) => ReactNode;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    components?: { Row?: typeof Row };
}

export default function Table<T>({
    data,
    columns,
    getRowId,
    rowActions,
    renderExpanded,
    onRowClick,
    emptyMessage = "No hay registros disponibles",
    components,
}: TableProps<T>) {
    const RowComponent = components?.Row ?? Row;
    const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set());

    const toggle = (id: string | number) =>
        setExpandedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const totalCols = columns.length + (rowActions ? 1 : 0);

    return (
        <div className="bg-white border border-verde-3 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-verde-2 border-b border-verde-3">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`p-4 text-[11px] uppercase tracking-wider font-bold text-gris-1 ${col.headerClassName ?? ""}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                            {rowActions && (
                                <th className="p-4 text-[11px] uppercase tracking-wider font-bold text-gris-1 text-right">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-verde-3/60 bg-white">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={totalCols} className="p-8 text-center text-gris-1 text-sm bg-verde-1/30">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => {
                                const id = getRowId(item);
                                const expanded = expandedIds.has(id);

                                return (
                                    <Fragment key={id}>
                                        <RowComponent
                                            item={item}
                                            columns={columns}
                                            onClick={onRowClick}
                                            actions={rowActions?.(item, {
                                                expanded,
                                                toggle: () => toggle(id),
                                            })}
                                        />
                                        {expanded && renderExpanded && (
                                            <tr className="bg-verde-1/30">
                                                <td colSpan={totalCols} className="p-4 border-t border-verde-3/40">
                                                    {renderExpanded(item)}
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}