import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Flash {
    success?: string | null;
    error?: string | null;
}

const DURACION_MS = 6000;

/**
 * Mensaje de resultado que el servidor deja tras una operación
 * ("Tarjeta PARE registrada exitosamente", "Situación crítica actualizada", etc.).
 * Se muestra sobre el contenido y se cierra solo o con el botón.
 */
export default function AvisoFlash() {
    const { flash } = usePage().props as unknown as { flash?: Flash };
    const mensaje = flash?.error || flash?.success || null;
    const esError = Boolean(flash?.error);
    const [visible, setVisible] = useState(false);

    // Cada visita trae un objeto flash nuevo: se vuelve a mostrar aunque el texto se repita.
    useEffect(() => {
        if (!mensaje) {
            setVisible(false);
            return;
        }
        setVisible(true);
        const temporizador = window.setTimeout(() => setVisible(false), DURACION_MS);
        return () => window.clearTimeout(temporizador);
    }, [flash, mensaje]);

    if (!mensaje || !visible) return null;

    return (
        <div className="sticky top-0 z-30 px-6 pt-4 lg:px-8">
            <div
                role={esError ? 'alert' : 'status'}
                className={`mx-auto flex max-w-[1400px] items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm shadow-sm ${
                    esError
                        ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950 dark:text-red-200'
                        : 'border-verde-5/40 bg-verde-2 text-gris-2 dark:border-verde-5/30 dark:bg-[#1E242B] dark:text-gray-100'
                }`}
            >
                <span>{mensaje}</span>
                <button
                    type="button"
                    onClick={() => setVisible(false)}
                    aria-label="Cerrar aviso"
                    className="shrink-0 font-bold leading-none opacity-60 hover:opacity-100"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
