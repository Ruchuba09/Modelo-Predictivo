import { Link } from '@inertiajs/react';

export interface Paginado<T> {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

const CLASE_BASE = 'min-w-9 px-3 py-1.5 rounded-lg text-xs font-bold text-center border transition-colors';

function textoEnlace(indice: number, total: number, etiqueta: string): string {
    if (indice === 0) return 'Anterior';
    if (indice === total - 1) return 'Siguiente';
    return etiqueta;
}

export default function Paginacion({ pagina }: { pagina: Paginado<unknown> }) {
    if (pagina.total === 0) return null;

    return (
        <nav
            aria-label="Paginación"
            className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-t border-verde-3 shrink-0"
        >
            <span className="text-xs text-gris-1">
                {pagina.from
                    ? `Mostrando ${pagina.from}–${pagina.to} de ${pagina.total}`
                    : `Esta página está vacía; hay ${pagina.total} en total`}
            </span>

            {pagina.last_page > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {pagina.links.map((enlace, indice) => {
                        const texto = textoEnlace(indice, pagina.links.length, enlace.label);

                        if (!enlace.url) {
                            return (
                                <span key={indice} className={`${CLASE_BASE} border-transparent text-gris-1/50`}>
                                    {texto}
                                </span>
                            );
                        }

                        return (
                            <Link
                                key={indice}
                                href={enlace.url}
                                preserveState
                                aria-current={enlace.active ? 'page' : undefined}
                                className={`${CLASE_BASE} ${
                                    enlace.active
                                        ? 'bg-verde-5 border-verde-5 text-black'
                                        : 'border-verde-3 text-gris-2 hover:border-verde-5'
                                }`}
                            >
                                {texto}
                            </Link>
                        );
                    })}
                </div>
            )}
        </nav>
    );
}
