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
    emptyMessage = "No hay registros",
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
        <div className="bg-[#141414] border border-[#2d3238] rounded-2xl overflow-hidden">
            <table className="w-full">
                <thead className="bg-[#101010]">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`text-left p-4 text-xs uppercase text-[#7a7f85] ${col.headerClassName ?? ""}`}
                            >
                                {col.header}
                            </th>
                        ))}
                        {rowActions && <th className="p-4"></th>}
                    </tr>
                </thead>

                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={totalCols} className="p-8 text-center text-[#7a7f85]">
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
                                        <tr className="bg-[#101010]">
                                            <td colSpan={totalCols} className="p-4">
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
    );
}