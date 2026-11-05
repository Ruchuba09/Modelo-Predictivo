import { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { AvisoHorizonte, OpcionesHorizonte } from '@/components/modelo/Elementos';
import { api } from '@/lib/api';
import { etiquetaHorizonte, HORIZONTE_PREDETERMINADO, horizonteDerivado, NIVELES_ENTIDAD } from '@/lib/modeloPredictivo';
import { etiquetaTipo } from '@/lib/utils';

type Prueba = {
    clave: string;
    nombre: string;
    descripcion: string;
    criterio: string;
    valor: Record<string, unknown>;
    aprobada: boolean;
};

type FilaCurva = { umbral: number; vp: number; fp: number; fn: number; vn: number };
type Ejemplo = { entidad: string; semana: string; prob: number; ocurrio: boolean };

type Medidas = FilaCurva & { exactitud: number; precision: number | null; sensibilidad: number | null; especificidad: number | null; exactitud_mayoria: number };

type Salida = {
    clave: string;
    grupo: 'eventos' | 'entidades';
    filas: number;
    positivos: number;
    semanas: number;
    tasa_real: number;
    riesgo_predicho: number;
    evidencia_suficiente: boolean;
    auc: number | null;
    auc_intervalo: [number, number] | null;
    log_loss: number;
    brier: number;
    umbral_validacion: Medidas;
    umbral_exactitud: Medidas;
    curva: FilaCurva[];
    calibracion: Array<{ predicho: number; real: number; filas: number }>;
    error_calibracion: number;
    pruebas: Prueba[];
    aprobadas: number;
    total_pruebas: number;
    ejemplos: { mayor_riesgo: Ejemplo[]; sorpresas: Ejemplo[] };
};

type Resultado = { entrenado_en: string; semanas_modelo: number; desde: string; hasta: string; salidas: Salida[] };

const AZUL = '#2a78d6';
const pct = (valor: number | null | undefined, decimales = 0) => (valor == null ? '—' : `${(valor * 100).toFixed(decimales).replace('.', ',')}%`);
const num = (valor: unknown, decimales = 3) => (typeof valor === 'number' ? valor.toFixed(decimales).replace('.', ',') : '—');
const nombreSalida = (salida: Salida) => (salida.grupo === 'entidades'
    ? NIVELES_ENTIDAD.find((n) => n.clave === salida.clave)?.singular ?? salida.clave
    : etiquetaTipo(salida.clave).replace(/^./, (letra) => letra.toUpperCase()));

function Estado({ aprobada }: { aprobada: boolean }) {
    return aprobada
        ? <span className="inline-flex items-center gap-1 rounded-full bg-verde-2 px-2 py-0.5 text-[11px] font-bold text-gris-2"><span aria-hidden="true">✓</span>Aprobada</span>
        : <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800"><span aria-hidden="true">✕</span>No aprobada</span>;
}

function detalle(prueba: Prueba): string {
    const v = prueba.valor;
    switch (prueba.clave) {
        case 'azar': {
            const rango = v.intervalo as [number, number] | null;
            return `AUC ${num(v.auc)}${rango ? ` (entre ${num(rango[0])} y ${num(rango[1])})` : ''}`;
        }
        case 'tasa':
        case 'logistica':
            return `Log-loss ${num(v.red)} contra ${num(v.referencia)}`;
        case 'calibracion':
            return `Error de ${pct(v.error as number, 1)}, límite ${pct(v.limite as number, 1)}`;
        case 'mayoria':
            return `Exactitud ${pct(v.exactitud as number, 1)} contra ${pct(v.referencia as number, 1)}`;
        case 'prioriza':
            return `${pct(v.tasa_grupo as number, 1)} contra ${pct(v.tasa_general as number, 1)} general (${num(v.veces, 2)} veces)`;
        case 'estable':
            return `AUC ${num(v.auc_inicio)} y luego ${num(v.auc_final)}`;
        default:
            return '';
    }
}

function Tarjeta({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: React.ReactNode }) {
    return (
        <section className="bg-white border border-verde-3 rounded-2xl shadow-sm p-5 min-w-0">
            <h2 className="text-base font-bold text-gris-2">{titulo}</h2>
            {descripcion && <p className="text-xs text-gris-1 mt-1 mb-3 max-w-3xl">{descripcion}</p>}
            {children}
        </section>
    );
}

/** Si la red está bien calibrada, los puntos quedan cerca de la diagonal. */
function GraficoCalibracion({ grupos }: { grupos: Salida['calibracion'] }) {
    const [activo, setActivo] = useState<number | null>(null);
    const ancho = 420;
    const alto = 320;
    const margen = { izq: 50, der: 16, arr: 12, aba: 44 };
    const maximo = Math.min(Math.max(...grupos.flatMap((g) => [g.predicho, g.real]), 0.01) * 1.1, 1);
    const x = (v: number) => margen.izq + (v / maximo) * (ancho - margen.izq - margen.der);
    const y = (v: number) => margen.arr + (1 - v / maximo) * (alto - margen.arr - margen.aba);
    const marcas = Array.from({ length: 5 }, (_, i) => (maximo * i) / 4);
    const decimales = maximo < 0.1 ? 1 : 0;
    const seleccion = activo === null ? null : grupos[activo];
    return (
        <div>
            <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full max-w-lg" role="img" aria-label="Riesgo predicho contra tasa real por grupo de riesgo">
                {marcas.map((marca) => (
                    <g key={marca}>
                        <line x1={margen.izq} x2={ancho - margen.der} y1={y(marca)} y2={y(marca)} stroke="#e5e7eb" />
                        <text x={margen.izq - 8} y={y(marca) + 4} textAnchor="end" fontSize="11" className="fill-gris-1">{pct(marca, decimales)}</text>
                        <text x={x(marca)} y={alto - margen.aba + 16} textAnchor="middle" fontSize="11" className="fill-gris-1">{pct(marca, decimales)}</text>
                    </g>
                ))}
                <text x={(margen.izq + ancho - margen.der) / 2} y={alto - 6} textAnchor="middle" fontSize="11" className="fill-gris-1">Riesgo predicho</text>
                <text transform={`translate(13 ${(margen.arr + alto - margen.aba) / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" className="fill-gris-1">Tasa real</text>
                <line x1={x(0)} y1={y(0)} x2={x(maximo)} y2={y(maximo)} stroke="#9ca3af" strokeDasharray="4 4" />
                <text x={x(maximo) - 4} y={y(maximo) + 16} textAnchor="end" fontSize="11" className="fill-gris-1">Calibración perfecta</text>
                <path d={grupos.map((g, i) => `${i === 0 ? 'M' : 'L'}${x(g.predicho)} ${y(g.real)}`).join(' ')} fill="none" stroke={AZUL} strokeWidth="2" strokeLinejoin="round" />
                {grupos.map((g, i) => (
                    <g key={i} onMouseEnter={() => setActivo(i)} onMouseLeave={() => setActivo(null)}>
                        <circle cx={x(g.predicho)} cy={y(g.real)} r="12" fill="transparent" />
                        <circle cx={x(g.predicho)} cy={y(g.real)} r={activo === i ? 6 : 4.5} fill={AZUL} stroke="#ffffff" strokeWidth="2" />
                    </g>
                ))}
            </svg>
            <p className="min-h-5 text-xs text-gris-2" role="status">
                {seleccion
                    ? `Grupo de ${seleccion.filas} filas: predijo ${pct(seleccion.predicho, 1)} y ocurrió ${pct(seleccion.real, 1)}`
                    : 'Pasa el cursor por un punto. Cada uno agrupa filas con riesgo parecido.'}
            </p>
        </div>
    );
}

function MatrizConfusion({ salida }: { salida: Salida }) {
    const inicial = salida.umbral_validacion.umbral;
    const [umbral, setUmbral] = useState(inicial);
    const fila = salida.curva.find((c) => c.umbral === umbral) ?? salida.curva[0];
    const total = fila.vp + fila.fp + fila.fn + fila.vn;
    const exactitud = (fila.vp + fila.vn) / total;
    const precision = fila.vp + fila.fp ? fila.vp / (fila.vp + fila.fp) : null;
    const sensibilidad = fila.vp + fila.fn ? fila.vp / (fila.vp + fila.fn) : null;
    const especificidad = fila.vn + fila.fp ? fila.vn / (fila.vn + fila.fp) : null;
    const celdas = [
        { valor: fila.vp, titulo: 'Predijo evento y ocurrió', tono: 'bg-verde-2' },
        { valor: fila.fp, titulo: 'Predijo evento y no ocurrió', tono: 'bg-amber-100' },
        { valor: fila.fn, titulo: 'No predijo evento y ocurrió', tono: 'bg-red-100' },
        { valor: fila.vn, titulo: 'No predijo evento y no ocurrió', tono: 'bg-verde-2' },
    ];
    return (
        <div className="space-y-4">
            <label className="block text-xs font-semibold text-gris-1">
                Avisar desde un riesgo de {pct(umbral)}{umbral === inicial && ' (prioriza anticipar eventos)'}
                <input type="range" min={0.01} max={0.99} step={0.01} value={umbral} onChange={(e) => setUmbral(Number(Number(e.target.value).toFixed(2)))} className="mt-2 block w-full accent-verde-6" />
            </label>
            <div className="grid grid-cols-2 gap-2">
                {celdas.map((celda) => (
                    <div key={celda.titulo} className={`rounded-xl p-3 ${celda.tono}`}>
                        <p className="text-2xl font-black text-gris-2">{celda.valor.toLocaleString('es-CL')}</p>
                        <p className="text-xs text-gris-2">{celda.titulo}</p>
                    </div>
                ))}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
                <div><dt className="text-gris-1">Exactitud</dt><dd className="text-base font-black text-gris-2">{pct(exactitud, 1)}</dd></div>
                <div><dt className="text-gris-1">Precisión</dt><dd className="text-base font-black text-gris-2">{pct(precision, 1)}</dd></div>
                <div><dt className="text-gris-1">Sensibilidad</dt><dd className="text-base font-black text-gris-2">{pct(sensibilidad, 1)}</dd></div>
                <div><dt className="text-gris-1">Especificidad</dt><dd className="text-base font-black text-gris-2">{pct(especificidad, 1)}</dd></div>
            </dl>
            <p className="text-xs text-gris-1">
                Responder siempre lo más común acertaría {pct(salida.umbral_exactitud.exactitud_mayoria, 1)}; el umbral que más acierta ({pct(salida.umbral_exactitud.umbral)}) logra {pct(salida.umbral_exactitud.exactitud, 1)}. Precisión: de los avisos, cuántos fueron correctos. Sensibilidad: de los eventos, cuántos se anticiparon.
            </p>
        </div>
    );
}

function TablaEjemplos({ filas, vacio }: { filas: Ejemplo[]; vacio: string }) {
    if (filas.length === 0) return <p className="text-xs text-gris-1">{vacio}</p>;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead className="text-gris-1 text-left border-b border-verde-3">
                    <tr>
                        <th scope="col" className="py-1.5 pr-3 font-semibold">Entidad</th>
                        <th scope="col" className="py-1.5 pr-3 font-semibold">Semana</th>
                        <th scope="col" className="py-1.5 pr-3 font-semibold">Riesgo</th>
                        <th scope="col" className="py-1.5 font-semibold">¿Ocurrió?</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-verde-3 text-gris-2">
                    {filas.map((fila, i) => (
                        <tr key={`${fila.entidad}-${fila.semana}-${i}`}>
                            <th scope="row" className="py-1.5 pr-3 text-left font-medium">{fila.entidad}</th>
                            <td className="py-1.5 pr-3 whitespace-nowrap">{fila.semana}</td>
                            <td className="py-1.5 pr-3">{pct(fila.prob, 1)}</td>
                            <td className="py-1.5">{fila.ocurrio ? 'Sí' : 'No'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function PruebaRed() {
    const [horizonte, setHorizonte] = useState(HORIZONTE_PREDETERMINADO);
    const [resultado, setResultado] = useState<Resultado | null>(null);
    const [clave, setClave] = useState<string | null>(null);
    const [ejecutando, setEjecutando] = useState(false);
    const [error, setError] = useState('');

    const seleccion = useMemo(() => resultado?.salidas.find((s) => `${s.grupo}-${s.clave}` === clave) ?? resultado?.salidas[0] ?? null, [resultado, clave]);

    const ejecutar = () => {
        setEjecutando(true);
        setError('');
        setResultado(null);
        api.get<Resultado>('/modelo-predictivo/red-neuronal/prueba', { params: { horizonte_dias: horizonte }, timeout: 0 })
            .then(({ data }) => setResultado(data))
            .catch((err) => setError(err.response?.data?.detail ?? err.response?.data?.message ?? 'No fue posible ejecutar las pruebas.'))
            .finally(() => setEjecutando(false));
    };

    return (
        <MainLayout>
            <Head title="Pruebas de la red | AVA" />

            <div className="max-w-[1200px] mx-auto p-6 lg:p-8 space-y-5">
                <section className="bg-white border border-verde-3 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gris-2">Pruebas de la red</h1>
                        <p className="text-sm text-gris-1 mt-1">Mide su nivel de acierto en las semanas más recientes, que no usó para aprender.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                        <label className="text-xs font-semibold text-gris-1">
                            Horizonte
                            <select
                                value={horizonte}
                                disabled={ejecutando}
                                onChange={(e) => { setHorizonte(Number(e.target.value)); setResultado(null); setClave(null); setError(''); }}
                                className="mt-1 block min-w-32 rounded-lg border-verde-3 text-sm text-gris-2 disabled:opacity-60"
                            >
                                <OpcionesHorizonte />
                            </select>
                        </label>
                        <button type="button" onClick={ejecutar} disabled={ejecutando} className="rounded-lg bg-verde-6 px-4 py-2 text-sm font-bold text-gris-2 hover:opacity-90 disabled:opacity-60">
                            {ejecutando ? 'Ejecutando…' : 'Ejecutar pruebas'}
                        </button>
                    </div>
                </section>

                <AvisoHorizonte dias={horizonte} />
                {error && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{error}</p>}
                {ejecutando && <p className="text-sm text-gris-1" role="status">Ejecutando las pruebas. Puede tardar unos segundos.</p>}
                {!resultado && !ejecutando && !error && (
                    <p className="rounded-lg border border-verde-3 bg-white p-4 text-sm text-gris-1">
                        Elige un horizonte y pulsa «Ejecutar pruebas» para evaluar la red a {etiquetaHorizonte(horizonte)}.
                    </p>
                )}

                {resultado && seleccion && (
                    <>
                        <p className="text-xs text-gris-1">
                            Periodo de prueba: {resultado.desde} a {resultado.hasta} · Modelo entrenado el {new Date(resultado.entrenado_en).toLocaleString('es-CL')}
                            {horizonteDerivado(horizonte) ? ' · Modelo de 1 semana, contando eventos desde el lunes.' : ` · Modelo de ${resultado.semanas_modelo} ${resultado.semanas_modelo === 1 ? 'semana' : 'semanas'}.`}
                            {' '}Se evalúa la red antes del ajuste entre plazos.
                        </p>

                        <Tarjeta titulo="Resumen por salida" descripcion="Elige una fila para ver el detalle. Exactitud con el umbral que más acierta en validación, comparada con responder siempre lo más común.">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs uppercase tracking-wider text-gris-1 border-b border-verde-3 text-left">
                                        <tr>
                                            <th scope="col" className="py-2 pr-3">Qué predice</th>
                                            <th scope="col" className="py-2 pr-3">Pruebas</th>
                                            <th scope="col" className="py-2 pr-3">AUC</th>
                                            <th scope="col" className="py-2 pr-3">Exactitud</th>
                                            <th scope="col" className="py-2 pr-3">Siempre lo común</th>
                                            <th scope="col" className="py-2">Filas con evento</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-verde-3 text-gris-2">
                                        {resultado.salidas.map((salida) => {
                                            const id = `${salida.grupo}-${salida.clave}`;
                                            const activa = salida === seleccion;
                                            return (
                                                <tr key={id} className={activa ? 'bg-verde-2/60 font-bold' : ''}>
                                                    <th scope="row" className="py-2 pr-3 text-left font-inherit">
                                                        <button type="button" onClick={() => setClave(id)} aria-pressed={activa} className="underline decoration-verde-5 underline-offset-2 text-left">{nombreSalida(salida)}</button>
                                                        {salida.grupo === 'entidades' && <span className="block text-[11px] font-normal text-gris-1">Entidad</span>}
                                                    </th>
                                                    <td className="py-2 pr-3 whitespace-nowrap">{salida.aprobadas} de {salida.total_pruebas}</td>
                                                    <td className="py-2 pr-3">{num(salida.auc, 2)}</td>
                                                    <td className="py-2 pr-3">{pct(salida.umbral_exactitud.exactitud, 1)}</td>
                                                    <td className="py-2 pr-3">{pct(salida.umbral_exactitud.exactitud_mayoria, 1)}</td>
                                                    <td className="py-2">
                                                        {salida.positivos} de {salida.filas.toLocaleString('es-CL')}
                                                        {!salida.evidencia_suficiente && <span className="block text-[11px] font-normal text-amber-900">Poca evidencia</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Tarjeta>

                        <Tarjeta
                            titulo={`Pruebas: ${nombreSalida(seleccion)}`}
                            descripcion={`Aprobó ${seleccion.aprobadas} de ${seleccion.total_pruebas}. Los criterios son una propuesta inicial, y conviene validarlos con AVA.`}
                        >
                            {!seleccion.evidencia_suficiente && (
                                <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                                    Hay menos de 30 casos de alguna clase en la prueba: estos resultados pueden cambiar mucho con pocos datos nuevos.
                                </p>
                            )}
                            <ul className="divide-y divide-verde-3">
                                {seleccion.pruebas.map((prueba) => (
                                    <li key={prueba.clave} className="grid gap-2 py-3 md:grid-cols-[1fr_auto] md:items-center">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gris-2">{prueba.nombre}</p>
                                            <p className="text-xs text-gris-1">{prueba.descripcion}</p>
                                            <p className="text-xs text-gris-2 mt-1"><span className="text-gris-1">Criterio:</span> {prueba.criterio}. <span className="font-semibold">{detalle(prueba)}.</span></p>
                                        </div>
                                        <Estado aprobada={prueba.aprobada} />
                                    </li>
                                ))}
                            </ul>
                        </Tarjeta>

                        <div className="grid gap-5 lg:grid-cols-2">
                            <Tarjeta titulo="Nivel de acierto" descripcion="Mueve el umbral: avisar antes anticipa más eventos, pero aumenta las falsas alarmas.">
                                <MatrizConfusion key={`${seleccion.grupo}-${seleccion.clave}-${horizonte}`} salida={seleccion} />
                            </Tarjeta>
                            <Tarjeta titulo="Calibración" descripcion={`Riesgo predicho medio de ${pct(seleccion.riesgo_predicho, 1)} y tasa real de ${pct(seleccion.tasa_real, 1)}.`}>
                                <GraficoCalibracion grupos={seleccion.calibracion} />
                            </Tarjeta>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                            <Tarjeta titulo="Casos de mayor riesgo" descripcion="Lo que la red marcó como más riesgoso, y si ocurrió.">
                                <TablaEjemplos filas={seleccion.ejemplos.mayor_riesgo} vacio="Sin casos para mostrar." />
                            </Tarjeta>
                            <Tarjeta titulo="Eventos menos anticipados" descripcion="Eventos que sí ocurrieron y a los que la red dio menos riesgo.">
                                <TablaEjemplos filas={seleccion.ejemplos.sorpresas} vacio="No hubo eventos en el periodo de prueba." />
                            </Tarjeta>
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
}
