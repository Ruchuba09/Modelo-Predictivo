import { useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { CalidadModelos, EvaluacionPredicciones } from '@/components/CalidadModelos';
import { AvisoHorizonte, SelectoresModelo } from '@/components/modelo/Elementos';
import { NIVELES_ENTIDAD, useEntidades, useFiltrosModelo } from '@/lib/modeloPredictivo';

export default function Calidad() {
    const { tipo, horizonte, tipos, cambiar } = useFiltrosModelo();
    const { datos, cargando, error } = useEntidades(tipo, horizonte);
    const [nivel, setNivel] = useState('proyecto');
    const calidad = datos?.modelos[nivel];
    const candidatos = Object.entries(calidad?.candidatos ?? {}).sort(([, a], [, b]) => a.log_loss - b.log_loss);
    const importancia = calidad?.importancia ?? [];
    const maximaImportancia = Math.max(...importancia.map((f) => f.importancia), 0.0001);

    return (
        <MainLayout>
            <Head title="Calidad del modelo | AVA" />

            <div className="max-w-[1200px] mx-auto p-6 lg:p-8 space-y-6">
                <section className="bg-white border border-verde-3 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gris-2">Calidad del modelo</h1>
                        <p className="text-sm text-gris-1 mt-1">Cuánto confiar en las predicciones, según semanas que el modelo no vio al entrenar.</p>
                    </div>
                    <SelectoresModelo tipo={tipo} horizonte={horizonte} tipos={tipos} cambiar={cambiar} />
                </section>

                <AvisoHorizonte dias={horizonte} />

                {error && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{error}</p>}
                {cargando && <p className="text-sm text-gris-1" role="status">Calculando. La primera vez puede tardar un par de minutos.</p>}

                {datos && <CalidadModelos modelos={datos.modelos} />}

                {datos && (
                    <section className="bg-white border border-verde-3 rounded-2xl shadow-md p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-gris-2">Comparación de modelos</h2>
                                <p className="text-xs text-gris-1 mt-1">Etapa de elección, ordenada de mejor a peor. Una log-loss más baja significa mejores probabilidades. La tabla superior muestra la confirmación del modelo publicado.</p>
                            </div>
                            <label className="text-xs font-semibold text-gris-1">
                                Entidad
                                <select value={nivel} onChange={(e) => setNivel(e.target.value)} className="mt-1 block min-w-40 rounded-lg border-verde-3 text-sm text-gris-2">
                                    {NIVELES_ENTIDAD.filter((n) => datos.modelos[n.clave]).map((n) => <option key={n.clave} value={n.clave}>{n.singular}</option>)}
                                </select>
                            </label>
                        </div>

                        {candidatos.length === 0 ? (
                            <p className="text-sm text-gris-1">{calidad?.motivo ?? 'No hay comparación disponible para esta entidad.'}</p>
                        ) : (
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-xs uppercase tracking-wider text-gris-1 border-b border-verde-3 text-left">
                                            <tr>
                                                <th scope="col" className="py-2 pr-3">Modelo</th>
                                                <th scope="col" className="py-2 pr-3">AUC-ROC</th>
                                                <th scope="col" className="py-2 pr-3">Log-loss</th>
                                                <th scope="col" className="py-2">Brier</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-verde-3 text-gris-2">
                                            {candidatos.map(([nombre, m]) => (
                                                <tr key={nombre} className={nombre === calidad?.modelo ? 'font-bold' : ''}>
                                                    <th scope="row" className="py-2 pr-3 text-left font-inherit">
                                                        {nombre}
                                                        {nombre === calidad?.modelo && <span className="ml-2 rounded-full bg-verde-2 px-2 py-0.5 text-[11px] text-verde-6">Publicado</span>}
                                                    </th>
                                                    <td className="py-2 pr-3">{m.auc_roc.toFixed(3)}</td>
                                                    <td className="py-2 pr-3">{m.log_loss.toFixed(3)}</td>
                                                    <td className="py-2">{m.brier.toFixed(3)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gris-2 mb-2">Variables que más ayudan a predecir</h3>
                                    {importancia.length === 0 ? (
                                        <p className="text-xs text-gris-1">Se publicó la tasa histórica, que no usa variables.</p>
                                    ) : (
                                        <ul className="space-y-1.5">
                                            {importancia.map((f) => (
                                                <li key={f.variable} className="grid grid-cols-[1fr_8rem] items-center gap-3 text-xs text-gris-2">
                                                    <span>{f.etiqueta}</span>
                                                    <span className="h-2 rounded-full bg-verde-2 overflow-hidden">
                                                        <span className="block h-full rounded-full bg-verde-5" style={{ width: `${(f.importancia / maximaImportancia) * 100}%` }} />
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                <EvaluacionPredicciones />
            </div>
        </MainLayout>
    );
}
