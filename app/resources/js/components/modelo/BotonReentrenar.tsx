import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTienePermiso } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { mensajeError } from '@/lib/modeloPredictivo';

/** Reentrena los tres modelos. Solo aparece con el permiso modelo-predictivo.entrenar. */
export function BotonReentrenar({ alTerminar }: { alTerminar: () => void }) {
    const puedeEntrenar = useTienePermiso('modelo-predictivo.entrenar');
    const [entrenando, setEntrenando] = useState(false);
    const [aviso, setAviso] = useState<{ texto: string; error: boolean } | null>(null);

    if (!puedeEntrenar) return null;

    const reentrenar = () => {
        setEntrenando(true);
        setAviso(null);
        api.post<{ message?: string }>('/modelo-predictivo/entrenar', null, { timeout: 300000 })
            .then(({ data }) => {
                setAviso({ texto: data.message ?? 'Modelos reentrenados con los datos actuales.', error: false });
                alTerminar();
            })
            .catch((err) => setAviso({ texto: mensajeError(err, 'No fue posible reentrenar los modelos.'), error: true }))
            .finally(() => setEntrenando(false));
    };

    return (
        <div className="flex flex-col items-start gap-2 sm:items-end">
            <button type="button" onClick={reentrenar} disabled={entrenando}
                className="inline-flex items-center gap-2 rounded-lg border border-verde-5 px-4 py-2 text-sm font-bold text-verde-6 hover:bg-verde-1 disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${entrenando ? 'animate-spin' : ''}`} aria-hidden />
                {entrenando ? 'Reentrenando… (alrededor de un minuto)' : 'Reentrenar modelos'}
            </button>
            {aviso && (
                <p role={aviso.error ? 'alert' : 'status'} className={`text-xs ${aviso.error ? 'text-rojo-1' : 'text-verde-6'}`}>{aviso.texto}</p>
            )}
        </div>
    );
}
