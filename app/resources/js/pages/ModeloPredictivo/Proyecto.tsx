import { useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import MainLayout from '@/layouts/MainLayout';
import { api } from '@/lib/api';
import { etiquetaTipo } from '@/lib/utils';
import { BarraRiesgo, ListaFactores } from '@/components/modelo/Elementos';
import {
    COLOR_OBJETIVO, esperaMediaDias, etiquetaHorizonte, HORIZONTE_PREDETERMINADO, mensajeError, OBJETIVOS, plazoHorizonte,
    porcentaje, probabilidadDesdeTasa, type Factor, type Objetivo,
} from '@/lib/modeloPredictivo';

type ProyectoBasico = { id_proyecto: number; nombre: string };
type Props = { proyecto: ProyectoBasico; proyectos: ProyectoBasico[]; horizontes: number[] };

type Registro = Record<string, unknown> & { prob_evento?: number; tasa_semanal?: number; historico_eventos?: number };
type Respuesta = {
    modelo?: string;
    advertencia_modelo?: string;
    predicciones: Array<{ id_proyecto: number; prob_evento: number; tasa_semanal?: number; semana?: string; factores_principales?: Factor[] }>;
    analisis_entidades?: {
        entidades: { areas?: Registro[]; cuadrillas?: Registro[]; trabajadores?: Registro[]; actividades?: Registro[] };
        contexto: { evento_estimado?: { fecha_estimada?: string; area_probable?: string; actividad_probable?: string; trabajador_probable?: string } };
    };
};

const DIAS_CURVA = [1, 2, 5, 7, 14, 21, 30, 45, 60, 75, 90];
const eventosEsperados = (tasa: number, dias: number) => tasa * dias / 7;

function Ranking({ titulo, registros, nombre }: { titulo: string; registros: Registro[]; nombre: (r: Registro) => string }) {
    return (
        <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gris-1">{titulo}</h3>
            {registros.length === 0 ? (
                <p className="mt-2 text-xs text-gris-1">Sin datos vigentes.</p>
            ) : (
                <ul className="mt-2 space-y-2">
                    {registros.slice(0, 5).map((r, i) => (
                        <li key={i} className="text-sm">
                            <div className="flex justify-between gap-3">
                                <span className="truncate font-semibold text-gris-2" title={nombre(r)}>{nombre(r)}</span>
                                <span className="text-xs text-gris-1">{r.historico_eventos ?? 0} eventos</span>
                            </div>
                            <BarraRiesgo probabilidad={Number(r.prob_evento ?? 0)} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function Proyecto({ proyecto, proyectos, horizontes }: Props) {
    const [dias, setDias] = useState(HORIZONTE_PREDETERMINADO);
    const [respuestas, setRespuestas] = useState<Partial<Record<Objetivo, Respuesta>>>({});
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [detalle, setDetalle] = useState<Objetivo>('incidentes_reales');

    useEffect(() => {
        let vigente = true;
        setCargando(true);
        setError('');
        Promise.all(OBJETIVOS.map((objetivo) => api
            .get<Respuesta>(`/proyectos/${proyecto.id_proyecto}/predicciones`, { params: { tipo_objetivo: objetivo, horizonte_dias: dias } })
            .then(({ data }) => [objetivo, data] as const)))
            .then((pares) => vigente && setRespuestas(Object.fromEntries(pares)))
            .catch((err) => vigente && setError(mensajeError(err)))
            .finally(() => vigente && setCargando(false));
        return () => { vigente = false; };
    }, [proyecto.id_proyecto, dias]);

    const tasa = (objetivo: Objetivo) => respuestas[objetivo]?.predicciones[0]?.tasa_semanal;
    const sinPrediccion = !cargando && !error && OBJETIVOS.every((o) => tasa(o) === undefined);

    const curva = useMemo(() => DIAS_CURVA.map((d) => ({
        dias: d,
        ...Object.fromEntries(OBJETIVOS.map((o) => {
            const t = respuestas[o]?.predicciones[0]?.tasa_semanal;
            return [o, t === undefined ? null : probabilidadDesdeTasa(t, d)];
        })),
    })), [respuestas]);

    // Una fila por área con la probabilidad de cada objetivo.
    const areas = useMemo(() => {
        const filas = new Map<string, { id: string; nombre: string; valores: Partial<Record<Objetivo, Registro>> }>();
        for (const objetivo of OBJETIVOS) {
            for (const area of respuestas[objetivo]?.analisis_entidades?.entidades.areas ?? []) {
                const clave = String(area.id_area);
                const fila = filas.get(clave) ?? { id: clave, nombre: String(area.nombre ?? `Área ${clave}`), valores: {} };
                fila.valores[objetivo] = area;
                filas.set(clave, fila);
            }
        }
        return [...filas.values()].sort((a, b) => Number(b.valores.incidentes_reales?.prob_evento ?? 0) - Number(a.valores.incidentes_reales?.prob_evento ?? 0));
    }, [respuestas]);

    const entidades = respuestas[detalle]?.analisis_entidades?.entidades;
    const estimado = respuestas[detalle]?.analisis_entidades?.contexto.evento_estimado;

    return (
        <MainLayout>
            <Head title={`Riesgo de ${proyecto.nombre} | AVA`} />

            <div className="mx-auto max-w-[1200px] space-y-6 p-6 lg:p-8">
                <section className="flex flex-col justify-between gap-4 rounded-2xl border border-verde-3 bg-white p-5 shadow-sm lg:flex-row lg:items-end">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gris-1">Riesgo del proyecto</p>
                        <h1 className="text-xl font-bold text-gris-2">{proyecto.nombre}</h1>
                        <p className="mt-1 text-sm text-gris-1">Los tres modelos para este proyecto: probabilidad en el plazo, eventos esperados y dónde se concentra el riesgo.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <label className="text-xs font-semibold text-gris-1">
                            Proyecto
                            <select value={proyecto.id_proyecto} onChange={(e) => router.visit(`/modelo-predictivo/proyectos/${e.target.value}`)}
                                className="mt-1 block min-w-56 rounded-lg border-verde-3 text-sm text-gris-2">
                                {proyectos.map((p) => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}
                            </select>
                        </label>
                        <label className="text-xs font-semibold text-gris-1">
                            Plazo
                            <select value={dias} onChange={(e) => setDias(Number(e.target.value))} className="mt-1 block min-w-32 rounded-lg border-verde-3 text-sm text-gris-2">
                                {horizontes.map((h) => <option key={h} value={h}>{etiquetaHorizonte(h)}</option>)}
                            </select>
                        </label>
                    </div>
                </section>

                {error && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{error}</p>}
                {cargando && <p className="text-sm text-gris-1" role="status">Calculando el riesgo del proyecto…</p>}
                {sinPrediccion && (
                    <p className="rounded-2xl border border-verde-3 bg-white p-6 text-sm text-gris-1 shadow-sm">
                        {respuestas.incidentes_reales?.advertencia_modelo ?? 'Este proyecto no está vigente o no tiene semanas con datos: no hay predicción.'}
                    </p>
                )}

                {!sinPrediccion && Object.keys(respuestas).length > 0 && (
                    <>
                        <div className="grid gap-4 md:grid-cols-3">
                            {OBJETIVOS.map((objetivo) => {
                                const t = tasa(objetivo);
                                const espera = t === undefined ? null : esperaMediaDias(t);
                                return (
                                    <article key={objetivo} className="rounded-2xl border border-verde-3 bg-white p-5 shadow-sm" style={{ borderTopColor: COLOR_OBJETIVO[objetivo], borderTopWidth: 4 }}>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gris-1">{etiquetaTipo(objetivo)}</p>
                                        <p className="mt-2 text-3xl font-black" style={{ color: COLOR_OBJETIVO[objetivo] }}>
                                            {t === undefined ? '—' : porcentaje(probabilidadDesdeTasa(t, dias))}
                                        </p>
                                        <p className="text-xs text-gris-1">de al menos uno en {plazoHorizonte(dias)}</p>
                                        <dl className="mt-3 grid grid-cols-2 gap-1 text-xs">
                                            <dt className="text-gris-1">Esperados en el plazo</dt>
                                            <dd className="text-right font-semibold text-gris-2">{t === undefined ? '—' : eventosEsperados(t, dias).toFixed(2)}</dd>
                                            <dt className="text-gris-1">Espera media</dt>
                                            <dd className="text-right font-semibold text-gris-2">{espera === null ? '—' : `${Math.round(espera)} días`}</dd>
                                        </dl>
                                        <Link href={`/modelo-predictivo/proyectos/${proyecto.id_proyecto}/evento-estimado?tipo_objetivo=${objetivo}&horizonte_dias=${dias}`}
                                            className="mt-3 inline-block text-xs font-bold text-verde-6 hover:underline">Próximo evento estimado</Link>
                                    </article>
                                );
                            })}
                        </div>

                        <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
                            <article className="rounded-2xl border border-verde-3 bg-white p-5 shadow-sm">
                                <h2 className="text-base font-bold text-gris-2">Probabilidad según el plazo</h2>
                                <p className="mt-0.5 text-xs text-gris-1">Sale de la tasa semanal de cada modelo; las lesiones nunca superan a los incidentes.</p>
                                <div className="mt-3 h-64" aria-label="Probabilidad del proyecto según el plazo">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={curva} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="dias" type="number" domain={[0, 90]} ticks={[7, 14, 30, 60, 90]} tickFormatter={(v) => `${v} d`} tick={{ fontSize: 10 }} />
                                            <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} tick={{ fontSize: 10 }} />
                                            <Tooltip formatter={(v) => porcentaje(Number(v))} labelFormatter={(v) => `${v} días`} />
                                            <Legend wrapperStyle={{ fontSize: 12 }} />
                                            {OBJETIVOS.map((o) => (
                                                <Line key={o} type="monotone" dataKey={o} name={etiquetaTipo(o)} stroke={COLOR_OBJETIVO[o]} strokeWidth={2} dot={false} />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </article>

                            <article className="rounded-2xl border border-verde-3 bg-white p-5 shadow-sm">
                                <h2 className="text-base font-bold text-gris-2">Qué mueve el riesgo de incidentes</h2>
                                <p className="mt-0.5 text-xs text-gris-1">Cambio en la probabilidad si cada variable volviera a su valor típico.</p>
                                <div className="mt-3">
                                    {(respuestas.incidentes_reales?.predicciones[0]?.factores_principales ?? []).length === 0
                                        ? <p className="text-xs text-gris-1">El modelo publicado es la tasa histórica: no usa variables.</p>
                                        : <ListaFactores factores={respuestas.incidentes_reales?.predicciones[0]?.factores_principales} />}
                                </div>
                                {respuestas.incidentes_reales?.modelo && <p className="mt-3 text-xs text-gris-1">Modelo: {respuestas.incidentes_reales.modelo}</p>}
                            </article>
                        </section>

                        <section className="overflow-x-auto rounded-2xl border border-verde-3 bg-white shadow-sm">
                            <div className="px-5 pt-5">
                                <h2 className="text-base font-bold text-gris-2">Riesgo por área</h2>
                                <p className="mt-0.5 text-xs text-gris-1">Probabilidad de al menos un evento en {plazoHorizonte(dias)}. El proyecto es la suma de sus áreas.</p>
                            </div>
                            {areas.length === 0 ? (
                                <p className="px-5 py-4 text-sm text-gris-1">Este proyecto no tiene áreas con eventos ni áreas de su faena.</p>
                            ) : (
                                <table className="mt-3 w-full min-w-[640px] text-left text-sm">
                                    <thead className="bg-verde-1 text-[11px] uppercase tracking-wider text-gris-1">
                                        <tr>
                                            <th scope="col" className="px-5 py-3">Área</th>
                                            {OBJETIVOS.map((o) => <th key={o} scope="col" className="px-5 py-3">{etiquetaTipo(o)}</th>)}
                                            <th scope="col" className="px-5 py-3">Eventos históricos</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-verde-3/70">
                                        {areas.map((fila) => (
                                            <tr key={fila.id}>
                                                <th scope="row" className="px-5 py-3 text-left font-semibold text-gris-2">{fila.nombre}</th>
                                                {OBJETIVOS.map((o) => (
                                                    <td key={o} className="w-48 px-5 py-3">
                                                        {fila.valores[o] ? <BarraRiesgo probabilidad={Number(fila.valores[o]?.prob_evento ?? 0)} /> : '—'}
                                                    </td>
                                                ))}
                                                <td className="px-5 py-3 text-gris-1">{fila.valores.todos?.historico_eventos ?? 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>

                        <section className="rounded-2xl border border-verde-3 bg-white p-5 shadow-sm">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                                <div>
                                    <h2 className="text-base font-bold text-gris-2">Dónde se concentra</h2>
                                    <p className="mt-0.5 text-xs text-gris-1">Parte del riesgo del proyecto que corresponde a cada entidad, según sus eventos de los últimos dos años.</p>
                                </div>
                                <div className="flex gap-1 rounded-lg bg-verde-1 p-1" role="tablist" aria-label="Objetivo">
                                    {OBJETIVOS.map((o) => (
                                        <button key={o} type="button" role="tab" aria-selected={detalle === o} onClick={() => setDetalle(o)}
                                            className={`rounded-md px-3 py-1.5 text-xs font-bold ${detalle === o ? 'bg-white text-gris-2 shadow-sm' : 'text-gris-1'}`}>
                                            {etiquetaTipo(o)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {estimado && (
                                <p className="mt-3 rounded-lg bg-verde-1/60 p-3 text-xs text-gris-2">
                                    Lo más probable: {[estimado.area_probable && `área ${estimado.area_probable}`, estimado.actividad_probable && `actividad ${estimado.actividad_probable}`,
                                        estimado.trabajador_probable && `trabajador ${estimado.trabajador_probable}`].filter(Boolean).join(' · ') || 'sin datos suficientes'}
                                    {estimado.fecha_estimada ? `. Espera media hasta el ${estimado.fecha_estimada}.` : '.'}
                                </p>
                            )}
                            <div className="mt-4 grid gap-6 md:grid-cols-3">
                                <Ranking titulo="Cuadrillas" registros={entidades?.cuadrillas ?? []} nombre={(r) => String(r.nombre ?? `Cuadrilla ${r.id_cuadrilla}`)} />
                                <Ranking titulo="Trabajadores" registros={entidades?.trabajadores ?? []} nombre={(r) => String(r.nombre_trabajador ?? `Trabajador ${r.id_trabajador}`)} />
                                <Ranking titulo="Actividades" registros={entidades?.actividades ?? []} nombre={(r) => String(r.actividad ?? `Actividad ${r.id_actividad}`)} />
                            </div>
                            <Link href={`/modelo-predictivo/entidades?id_proyecto=${proyecto.id_proyecto}&nivel=trabajador`} className="mt-4 inline-block text-sm font-bold text-verde-6 hover:underline">
                                Ver todas sus entidades
                            </Link>
                        </section>
                    </>
                )}
            </div>
        </MainLayout>
    );
}
