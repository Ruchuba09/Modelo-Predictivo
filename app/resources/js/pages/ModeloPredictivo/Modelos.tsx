import { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import MainLayout from '@/layouts/MainLayout';
import type { CalidadNivel } from '@/components/CalidadModelos';
import { BotonReentrenar } from '@/components/modelo/BotonReentrenar';
import {
    COLOR_OBJETIVO, etiquetaHorizonte, porcentaje, probabilidadDesdeTasa, useResumenModelos,
    type ObjetivoResumen,
} from '@/lib/modeloPredictivo';

type Props = { horizontes: number[] };

const NIVELES_MODELO = [
    { clave: 'proyecto', nombre: 'Proyecto' },
    { clave: 'area', nombre: 'Área' },
];

const numero = (valor: number | undefined, decimales = 2) => (valor === undefined ? '—' : valor.toLocaleString('es-CL', { maximumFractionDigits: decimales }));

function Metrica({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
    return (
        <div className="rounded-xl bg-verde-1/60 px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gris-1">{titulo}</p>
            <p className="text-lg font-black text-gris-2">{valor}</p>
            {nota && <p className="text-[11px] text-gris-1">{nota}</p>}
        </div>
    );
}

/** Calidad en validación temporal: AUC y mejora respecto de la tasa histórica. */
function CalidadEnNivel({ nombre, calidad }: { nombre: string; calidad?: CalidadNivel }) {
    if (!calidad) return null;
    return (
        <div className="rounded-xl border border-verde-3 p-3">
            <p className="text-xs font-bold text-gris-2">{nombre}</p>
            <p className="mt-1 text-sm text-gris-2">{calidad.modelo ?? 'Sin modelo'}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <dt className="text-gris-1">AUC-ROC</dt>
                <dd className="text-right font-semibold text-gris-2">
                    {calidad.metricas ? `${calidad.metricas.auc_roc.toFixed(2)} (${calidad.discriminacion})` : '—'}
                </dd>
                <dt className="text-gris-1">Mejora vs. histórico</dt>
                <dd className="text-right font-semibold text-gris-2">
                    {calidad.mejora_log_loss_pct !== undefined ? `${calidad.mejora_log_loss_pct.toFixed(1)} %` : '—'}
                </dd>
                <dt className="text-gris-1">Semanas con eventos</dt>
                <dd className="text-right font-semibold text-gris-2">{calidad.positivos ?? '—'} de {calidad.filas ?? '—'}</dd>
            </dl>
        </div>
    );
}

function TarjetaObjetivo({ objetivo, proyectos }: { objetivo: ObjetivoResumen; proyectos: number }) {
    const area = objetivo.calidad.area;
    const importancia = area?.importancia ?? objetivo.calidad.proyecto?.importancia ?? [];
    const maxima = Math.max(...importancia.map((f) => f.importancia), 0.0001);
    const tasaMedia = proyectos > 0 && objetivo.tasa_semanal_total !== undefined ? objetivo.tasa_semanal_total / proyectos : undefined;

    return (
        <article className="flex flex-col rounded-2xl border border-verde-3 bg-white p-5 shadow-sm">
            <header className="flex items-start gap-3">
                <span className="rounded-lg px-2.5 py-1 text-sm font-black text-white" style={{ backgroundColor: COLOR_OBJETIVO[objetivo.tipo_objetivo] }}>
                    {objetivo.clave}
                </span>
                <div>
                    <h2 className="text-base font-bold text-gris-2">{objetivo.nombre}</h2>
                    <p className="mt-0.5 text-xs text-gris-1">{objetivo.predice}</p>
                </div>
            </header>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <Metrica titulo="Esperados en 30 días" valor={numero(objetivo.eventos_esperados_30_dias, 1)} nota="en todos los proyectos vigentes" />
                <Metrica titulo="Proyecto promedio" valor={tasaMedia === undefined ? '—' : porcentaje(probabilidadDesdeTasa(tasaMedia, 30))} nota="probabilidad en 30 días" />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {NIVELES_MODELO.map((n) => <CalidadEnNivel key={n.clave} nombre={n.nombre} calidad={objetivo.calidad[n.clave]} />)}
            </div>

            {area?.motivo && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">{area.motivo}</p>}

            <div className="mt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gris-1">Variables que más pesan</h3>
                {importancia.length === 0 ? (
                    <p className="mt-1 text-xs text-gris-1">Se publicó la tasa histórica de cada área, que no usa variables.</p>
                ) : (
                    <ul className="mt-2 space-y-1.5">
                        {importancia.slice(0, 5).map((f) => (
                            <li key={f.variable} className="grid grid-cols-[1fr_6rem] items-center gap-3 text-xs text-gris-2">
                                <span>{f.etiqueta}</span>
                                <span className="h-2 overflow-hidden rounded-full bg-verde-2">
                                    <span className="block h-full rounded-full" style={{ width: `${(f.importancia / maxima) * 100}%`, backgroundColor: COLOR_OBJETIVO[objetivo.tipo_objetivo] }} />
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </article>
    );
}

export default function Modelos({ horizontes }: Props) {
    const [version, setVersion] = useState(0);
    const { datos, cargando, error } = useResumenModelos(version);
    const proyectos = datos?.proyectos_vigentes ?? 0;

    // Probabilidad de un proyecto promedio según el plazo: la misma tasa semanal da todos los plazos.
    const curva = useMemo(() => horizontes.map((dias) => ({
        plazo: etiquetaHorizonte(dias),
        ...Object.fromEntries((datos?.objetivos ?? []).map((o) => [
            o.tipo_objetivo,
            proyectos > 0 && o.tasa_semanal_total !== undefined ? probabilidadDesdeTasa(o.tasa_semanal_total / proyectos, dias) : null,
        ])),
    })), [datos, horizontes, proyectos]);

    const lesion = datos?.modelo_lesion;

    return (
        <MainLayout>
            <Head title="Los tres modelos | AVA" />

            <div className="mx-auto max-w-[1200px] space-y-6 p-6 lg:p-8">
                <section className="flex flex-col justify-between gap-4 rounded-2xl border border-verde-3 bg-white p-5 shadow-sm lg:flex-row lg:items-end">
                    <div>
                        <h1 className="text-xl font-bold text-gris-2">Los tres modelos</h1>
                        <p className="mt-1 max-w-3xl text-sm text-gris-1">
                            El sistema predice tasas semanales por área y proyecto. Con ellas calcula la probabilidad de cualquier plazo,
                            y reparte el riesgo de cada proyecto entre sus cuadrillas, trabajadores y actividades.
                        </p>
                        {datos && (
                            <p className="mt-2 text-xs text-gris-1">
                                Datos hasta la semana del {datos.semana_base ?? '—'} · {proyectos} proyectos vigentes
                                {datos.entrenado_en ? ` · entrenado el ${new Date(datos.entrenado_en).toLocaleString('es-CL')}` : ''}
                            </p>
                        )}
                    </div>
                    <BotonReentrenar alTerminar={() => setVersion((v) => v + 1)} />
                </section>

                {error && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{error}</p>}
                {cargando && <p className="text-sm text-gris-1" role="status">Cargando los modelos. Si es la primera consulta de la semana, el servicio puede tardar alrededor de un minuto.</p>}

                {datos && (
                    <>
                        <div className="grid gap-5 lg:grid-cols-3">
                            {datos.objetivos.map((o) => <TarjetaObjetivo key={o.tipo_objetivo} objetivo={o} proyectos={proyectos} />)}
                        </div>

                        <section className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
                            <article className="rounded-2xl border border-verde-3 bg-white p-5 shadow-sm">
                                <header className="flex items-start gap-3">
                                    <span className="rounded-lg bg-gris-2 px-2.5 py-1 text-sm font-black text-white">{lesion?.clave ?? 'B'}</span>
                                    <div>
                                        <h2 className="text-base font-bold text-gris-2">{lesion?.nombre ?? 'Probabilidad de lesión'}</h2>
                                        <p className="mt-0.5 text-xs text-gris-1">{lesion?.predice}</p>
                                    </div>
                                </header>
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <Metrica titulo="Lesión por incidente" valor={lesion?.probabilidad_media === undefined ? '—' : porcentaje(lesion.probabilidad_media)} nota="promedio de las áreas vigentes" />
                                    <Metrica titulo="Incidentes evaluados" valor={numero(lesion?.calidad.filas, 0)} nota={`${lesion?.calidad.positivos ?? '—'} con lesión`} />
                                </div>
                                <div className="mt-3">
                                    <CalidadEnNivel nombre="Por incidente" calidad={lesion?.calidad} />
                                </div>
                                {lesion?.calidad.motivo && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">{lesion.calidad.motivo}</p>}
                                <p className="mt-3 text-xs text-gris-1">
                                    La tasa de lesiones es la de incidentes (A) por esta probabilidad (B), así que nunca supera a la de incidentes.
                                </p>
                            </article>

                            <article className="rounded-2xl border border-verde-3 bg-white p-5 shadow-sm">
                                <h2 className="text-base font-bold text-gris-2">Del ritmo semanal al plazo</h2>
                                <p className="mt-0.5 text-xs text-gris-1">
                                    Probabilidad de al menos un evento en un proyecto promedio: P = 1 − e<sup>−tasa × días / 7</sup>. Un plazo más largo nunca da menos riesgo.
                                </p>
                                <div className="mt-3 h-64" aria-label="Probabilidad según el plazo para cada objetivo">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={curva} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="plazo" tick={{ fontSize: 10 }} />
                                            <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} tick={{ fontSize: 10 }} />
                                            <Tooltip formatter={(v) => porcentaje(Number(v))} />
                                            <Legend wrapperStyle={{ fontSize: 12 }} />
                                            {datos.objetivos.map((o) => (
                                                <Line key={o.tipo_objetivo} type="monotone" dataKey={o.tipo_objetivo} name={o.nombre}
                                                    stroke={COLOR_OBJETIVO[o.tipo_objetivo]} strokeWidth={2} dot={{ r: 3 }} />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </article>
                        </section>

                        <section className="rounded-2xl border border-verde-3 bg-white p-5 shadow-sm">
                            <h2 className="text-base font-bold text-gris-2">Cómo llega el riesgo a cada entidad</h2>
                            <ol className="mt-3 grid gap-3 text-sm text-gris-2 md:grid-cols-4">
                                <li className="rounded-xl bg-verde-1/60 p-3"><strong>1. Área.</strong> Cada modelo estima la tasa semanal de cada área del proyecto, con lo ocurrido en las semanas anteriores.</li>
                                <li className="rounded-xl bg-verde-1/60 p-3"><strong>2. Proyecto.</strong> Es la suma de sus áreas, incluida la de eventos sin área. Clientes y faenas suman sus proyectos.</li>
                                <li className="rounded-xl bg-verde-1/60 p-3"><strong>3. Cuadrillas, trabajadores y actividades.</strong> Reparten la tasa del proyecto según sus eventos de los últimos dos años, suavizados por su tamaño.</li>
                                <li className="rounded-xl bg-verde-1/60 p-3"><strong>4. Plazo.</strong> Cada tasa se convierte en la probabilidad del plazo elegido, de 1 a 90 días.</li>
                            </ol>
                            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
                                <Link href="/modelo-predictivo" className="text-verde-6 hover:underline">Ver predicciones por proyecto</Link>
                                <Link href="/modelo-predictivo/entidades" className="text-verde-6 hover:underline">Ver riesgo por entidad</Link>
                                <Link href="/modelo-predictivo/calidad" className="text-verde-6 hover:underline">Comparar candidatos</Link>
                                <Link href="/modelo-predictivo/evaluacion" className="text-verde-6 hover:underline">¿Acertó el modelo?</Link>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </MainLayout>
    );
}
