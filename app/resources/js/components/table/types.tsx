import type { ReactNode } from "react";

export interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => ReactNode;
    className?: string;
    headerClassName?: string;
}

export interface RowActionsContext {
    expanded: boolean;
    toggle: () => void;
}