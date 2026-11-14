import { useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import MainLayout from '@/layouts/MainLayout';
import { api } from '@/lib/api';
import { etiquetaTipo } from '@/lib/utils';
import { COLOR_OBJETIVO, mensajeError, NIVELES_ENTIDAD, OBJETIVOS, porcentaje, type FilaEvaluacion } from '@/lib/modeloPredictivo';

const nombreNivel = (clave: string) => NIVELES_ENTIDAD.find((n) => n.clave === clave)?.singular ?? clave;

/** Calibración: el riesgo predicho debería parecerse a la proporción en que ocurrió. */
function calibracion(fila: FilaEvaluacion): { texto: string; clase: string } {
    const diferencia = fila.riesgo_predicho - fila.tasa_real;
    if (fila.predicciones < 20) return { texto: 'Pocos datos', clase: 'bg-gray-100 text-gris-1' };
    if (Math.abs(diferencia) <= 0.05) return { texto: 'Calibrado', clase: 'bg-verde-2 text-verde-6' };
    return diferencia > 0
        ? { texto: 'Sobreestima', clase: 'bg-amber-100 text-amber-900' }
        : { texto: 'Subestima', clase: 'bg-red-100 text-red-800' };
}

export default function Evaluacion() {
    const [filas, setFilas] = useState<FilaEvaluacion[] | null>(null);
    const [error, setError] = useState('');
    const [objetivo, setObjetivo] = useState<string>('incidentes_reales');
    const [horizonte, setHorizonte] = useState<number | null>(null);

    useEffect(() => {
        api.get<{ evaluacion: FilaEvaluacion[] }>('/modelo-predictivo/evaluacion')
            .then(({ data }) => setFilas(data.evaluacion))
            .catch((err) => {
                setFilas([]);
                setError(mensajeError(err));
            });
    }, []);

    const horizontes = useMemo(() => [...new Set((filas ?? []).map((f) => f.horizonte))].sort((a, b) => a - b), [filas]);
    const plazo = horizonte ?? horizontes[0] ?? null;
    const seleccion = useMemo(
        () => (filas ?? []).filter((f) => f.tipo_objetivo === objetivo && f.horizonte === plazo)
            .sort((a, b) => NIVELES_ENTIDAD.findIndex((n) => n.clave === a.nivel) - NIVELES_ENTIDAD.findIndex((n) => n.clave === b.nivel)),
        [filas, objetivo, plazo],
    );

    return (
        <MainLayout>
            <Head title="Evaluación del modelo | AVA" />

            <div className="mx-auto max-w-[1200px] space-y-6 p-6 lg:p-8">
                <section className="flex flex-col justify-between gap-4 rounded-2xl border border-verde-3 bg-white p-5 shadow-sm lg:flex-row lg:items-end">
                    <div>
                        <h1 className="text-xl font-bold text-gris-2">¿Acertó el modelo?</h1>
                        <p className="mt-1 max-w-3xl text-sm text-gris-1">
                            Cada semana se guarda la primera predicción de cada entidad. Cuando su plazo termina, se compara con lo que ocurrió:
                            si el riesgo predicho se parece a la proporción real, las probabilidades son confiables.
                        </p>
                    </div>
                    {horizontes.length > 0 && (
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <label className="text-xs font-semibold text-gris-1">
                                Qué se predijo
                                <select value={objetivo} onChange={(e) => setObjetivo(e.target.value)} className="mt-1 block min-w-48 rounded-lg border-verde-3 text-sm text-gris-2">
                                    {OBJETIVOS.map((o) => <option key={o} value={o}>{etiquetaTipo(o)}</option>)}
                                </select>
                            </label>
                            <label className="text-xs font-semibold text-gris-1">
                                Plazo
                                <select value={plazo ?? ''} onChange={(e) => setHorizonte(Number(e.target.value))} className="mt-1 block min-w-32 rounded-lg border-verde-3 text-sm text-gris-2">
                                    {horizontes.map((h) => <option key={h} value={h}>{h} {h === 1 ? 'semana' : 'semanas'}</option>)}
                                </select>
                            </label>
                        </div>
                    )}
                </section>

                {error && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{error}</p>}
                {filas === null && <p className="text-sm text-gris-1" role="status">Comparando lo predicho con lo ocurrido…</p>}

                {filas !== null && !error && filas.length === 0 && (
                    <section className="rounded-2xl border border-verde-3 bg-white p-6 text-sm text-gris-1 shadow-sm">
                        <p className="font-semibold text-gris-2">Todavía no hay predicciones cuyo plazo haya terminado.</p>
                        <p className="mt-1">Las predicciones se registran cada semana; la de una semana podrá evaluarse una semana después, y la de 13 semanas, tres meses después.</p>
                    </section>
                )}

                {filas !== null && filas.length > 0 && (
                    seleccion.length === 0 ? (
                        <p className="rounded-2xl border border-verde-3 bg-white p-6 text-sm text-gris-1 shadow-sm">No hay evaluaciones para este objetivo y plazo.</p>
                    ) : (
                        <>
                            <section className="rounded-2xl border border-verde-3 bg-white p-5 shadow-sm">
                                <h2 className="text-base font-bold text-gris-2">Riesgo predicho y lo que ocurrió</h2>
                                <p className="mt-0.5 text-xs text-gris-1">Promedio de las probabilidades publicadas frente a la proporción de entidades con al menos un evento.</p>
                                <div className="mt-3 h-72" aria-label="Riesgo predicho frente a tasa real por nivel">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={seleccion.map((f) => ({ nivel: nombreNivel(f.nivel), predicho: f.riesgo_predicho, real: f.tasa_real }))}
                                            margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="nivel" tick={{ fontSize: 11 }} />
                                            <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} tick={{ fontSize: 10 }} />
                                            <Tooltip formatter={(v) => porcentaje(Number(v))} />
                                            <Legend wrapperStyle={{ fontSize: 12 }} />
                                            <Bar dataKey="predicho" name="Riesgo predicho" fill={COLOR_OBJETIVO[objetivo as keyof typeof COLOR_OBJETIVO] ?? '#3FAE29'} radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="real" name="Ocurrió" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>

                            <section className="overflow-x-auto rounded-2xl border border-verde-3 bg-white shadow-sm">
                                <table className="w-full min-w-[720px] text-left text-sm">
                                    <thead className="bg-verde-1 text-[11px] uppercase tracking-wider text-gris-1">
                                        <tr>
                                            <th scope="col" className="px-4 py-3">Entidad</th>
                                            <th scope="col" className="px-4 py-3">Predicciones</th>
                                            <th scope="col" className="px-4 py-3">Con evento</th>
                                            <th scope="col" className="px-4 py-3">Riesgo predicho</th>
                                            <th scope="col" className="px-4 py-3">Ocurrió</th>
                                            <th scope="col" className="px-4 py-3">Calibración</th>
                                            <th scope="col" className="px-4 py-3">AUC-ROC</th>
                                            <th scope="col" className="px-4 py-3">Brier</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-verde-3/70 text-gris-2">
                                        {seleccion.map((f) => {
                                            const estado = calibracion(f);
                                            return (
                                                <tr key={f.nivel}>
                                                    <th scope="row" className="px-4 py-3 text-left font-bold">{nombreNivel(f.nivel)}</th>
                                                    <td className="px-4 py-3">{f.predicciones}</td>
                                                    <td className="px-4 py-3">{f.ocurrieron}</td>
                                                    <td className="px-4 py-3">{porcentaje(f.riesgo_predicho)}</td>
                                                    <td className="px-4 py-3">{porcentaje(f.tasa_real)}</td>
                                                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${estado.clase}`}>{estado.texto}</span></td>
                                                    <td className="px-4 py-3">{f.auc_roc !== undefined ? f.auc_roc.toFixed(2) : '—'}</td>
                                                    <td className="px-4 py-3">{f.brier.toFixed(3)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <p className="px-4 py-3 text-xs text-gris-1">
                                    AUC-ROC: qué tan bien ordena las entidades por riesgo (0,5 es azar; solo con 20 o más predicciones y ambos resultados).
                                    Brier: error cuadrático de la probabilidad; más bajo es mejor.
                                </p>
                            </section>
                        </>
                    )
                )}
            </div>
        </MainLayout>
    );
}
