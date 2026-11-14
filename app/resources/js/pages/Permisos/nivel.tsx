/** RF-23 E-3: Nivel del Permiso. El backend envía las etiquetas en la prop "niveles". */
export type Nivel = 1 | 2 | 3;

export const NIVELES: Record<Nivel, string> = { 1: 'Básico', 2: 'Intermedio', 3: 'Crítico' };

const estilos: Record<Nivel, string> = {
    1: 'border-verde-5/30 bg-verde-2 text-verde-6',
    2: 'border-amber-400/40 bg-amber-50 text-amber-700',
    3: 'border-red-400/40 bg-red-50 text-red-500',
};

/** Etiqueta del nivel; sin nivel muestra el texto de RF-25.2.3. */
export function NivelPermiso({ nivel }: { nivel: number | null | undefined }) {
    if (nivel !== 1 && nivel !== 2 && nivel !== 3) {
        return <span className="text-xs text-gris-1">Sin nivel definido</span>;
    }

    return <span className={`rounded-md border px-2 py-0.5 text-xs ${estilos[nivel]}`}>{NIVELES[nivel]}</span>;
}
