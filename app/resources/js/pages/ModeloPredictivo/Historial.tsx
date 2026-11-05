import { Head } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { HistorialReal } from '@/components/CalidadModelos';
import { useEntidades, useFiltrosModelo } from '@/lib/modeloPredictivo';

export default function Historial() {
    const { tipo, horizonte } = useFiltrosModelo();
    const { datos, cargando, error } = useEntidades(tipo, horizonte);

    return (
        <MainLayout>
            <Head title="Historial de incidentes | AVA" />

            <div className="max-w-[1200px] mx-auto p-6 lg:p-8 space-y-4">
                {error && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{error}</p>}
                {cargando && <p className="text-sm text-gris-1" role="status">Cargando el historial.</p>}

                {datos?.historial && <HistorialReal historial={datos.historial} horizonte={horizonte} />}

                {datos && !datos.historial && (
                    <section className="bg-white border border-dashed border-verde-3 rounded-2xl p-10 text-center">
                        <h1 className="text-lg font-bold text-gris-2">Aún no se ha importado el historial</h1>
                        <p className="text-sm text-gris-1 mt-2 max-w-xl mx-auto">
                            Esta vista muestra los patrones y el riesgo por cliente según los logs de incidentes de AVA. Para activarla, importa los Excel con <code>python/data/importar_logs.py</code>; no se guardan nombres, RUT ni descripciones.
                        </p>
                    </section>
                )}
            </div>
        </MainLayout>
    );
}
