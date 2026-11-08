import { useCallback, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { AvisoCoherencia, AvisoHorizonte, BarraRiesgo, OpcionesHorizonte } from '@/components/modelo/Elementos';
import { api } from '@/lib/api';
import { HORIZONTE_PREDETERMINADO, etiquetaHorizonte, horizonteDerivado, NIVELES_ENTIDAD, useEntidades } from '@/lib/modeloPredictivo';
import { esAviso, etiquetaTipo } from '@/lib/utils';

type Metricas = { auc_roc?: number; log_loss: number; brier: number };

type Comparacion = {
    positivos_prueba: number;
    filas_prueba: number;
    red: Metricas;
    logistica?: Metricas;
    prevalencia: Metricas;
    supera_referencias: boolean;
    mejora_log_loss_pct: number;
};

type ResumenRed = {
    evaluacion: Record<string, Comparacion>;
    por_grupo: Record<string, Comparacion>;
    filas_entrenamiento: number;
    filas_validacion: number;
    filas_prueba: number;
    variables: number;
};

type EstadoRed = {
    estado: 'sin_entrenar' | 'entrenando' | 'listo' | 'error';
    mensaje?: string;
    entrenado_en?: string;
    eventos?: ResumenRed;
    entidades?: ResumenRed | null;
    conversion_dias?: Record<string, Record<string, MedidaDias>> | null;
};

type MedidaDias = {
    filas: number;
    positivos: number;
    riesgo_predicho: number;
    tasa_real: number;
    auc_roc?: number;
    log_loss: number;
    log_loss_referencia: number;
    supera_referencia: boolean;
};

type PrediccionRed = {
    mensaje?: string;
    coherencia?: { completa: boolean; plazos_pendientes: number[] };
    eventos: Array<{ objetivo: string; prob_evento: number; calidad: Comparacion }>;
    entidades: Record<string, Array<{ id: number; nombre: string; detalle?: string | null; prob_evento: number }>>;
};

const singular = (nivel: string) => NIVELES_ENTIDAD.find((n) => n.clave === nivel)?.singular ?? nivel;
const plural = (nivel: string) => NIVELES_ENTIDAD.find((n) => n.clave === nivel)?.plural ?? nivel;
const decimal = (valor?: number) => (valor == null ? '—' : valor.toFixed(3));
const mensajeDeError = (err: any, general: string) => err.response?.data?.detail ?? err.response?.data?.message ?? general;

function Respaldo({ supera }: { supera: boolean }) {
    return supera
        ? <span className="rounded-full bg-verde-2 px-2 py-0.5 text-[11px] font-bold text-verde-6">Supera referencias</span>
        : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">Sin mejora comprobada</span>;
}

function TablaEvaluacion({ titulo, filas, nombre }: { titulo: string; filas: Record<string, Comparacion>; nombre: (clave: string) => string }) {
    return (
        <div className="overflow-x-auto">
            <h3 className="text-sm font-bold text-gris-2 mb-2">{titulo}</h3>
            <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-gris-1 border-b border-verde-3 text-left">
                    <tr>
                        <th scope="col" className="py-2 pr-3">Qué predice</th>
                        <th scope="col" className="py-2 pr-3">AUC red</th>
                        <th scope="col" className="py-2 pr-3">AUC logística</th>
                        <th scope="col" className="py-2 pr-3">Log-loss red</th>
                        <th scope="col" className="py-2 pr-3">Log-loss prevalencia</th>
                        <th scope="col" className="py-2">Resultado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-verde-3 text-gris-2">
                    {Object.entries(filas).map(([clave, fila]) => (
                        <tr key={clave}>
                            <th scope="row" className="py-2 pr-3 text-left font-semibold">
                                {nombre(clave)}
                                <span className="block text-[11px] font-normal text-gris-1">{fila.positivos_prueba} positivos en {fila.filas_prueba} filas</span>
                            </th>
                            <td className="py-2 pr-3">{decimal(fila.red.auc_roc)}</td>
                            <td className="py-2 pr-3">{decimal(fila.logistica?.auc_roc)}</td>
                            <td className="py-2 pr-3">{decimal(fila.red.log_loss)}</td>
                            <td className="py-2 pr-3">{decimal(fila.prevalencia.log_loss)}</td>
                            <td className="py-2"><Respaldo supera={fila.supera_referencias} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function RedNeuronal() {
    const [horizonte, setHorizonte] = useState(HORIZONTE_PREDETERMINADO);
    const [estado, setEstado] = useState<EstadoRed | null>(null);
    const [errorEstado, setErrorEstado] = useState('');
    const [idProyecto, setIdProyecto] = useState<number | null>(null);
    const [prediccion, setPrediccion] = useState<PrediccionRed | null>(null);
    const [cargandoPrediccion, setCargandoPrediccion] = useState(false);
    const [errorPrediccion, setErrorPrediccion] = useState('');
    const { datos } = useEntidades('incidentes_reales', horizonte);
    const proyectos = datos?.niveles.proyecto ?? [];
    const entrenando = estado?.estado === 'entrenando';
    const entrenadoEn = estado?.entrenado_en;

    const consultarEstado = useCallback(() => {
        api.get<EstadoRed>('/modelo-predictivo/red-neuronal', { params: { horizonte_dias: horizonte } })
            .then(({ data }) => { setEstado(data); setErrorEstado(''); })
            .catch((err) => setErrorEstado(mensajeDeError(err, 'No fue posible consultar la red neuronal.')));
    }, [horizonte]);

    useEffect(consultarEstado, [consultarEstado]);

    useEffect(() => {
        if (!entrenando) return undefined;
        const temporizador = window.setInterval(consultarEstado, 5000);
        return () => window.clearInterval(temporizador);
    }, [entrenando, consultarEstado]);

    useEffect(() => {
        if (idProyecto === null && proyectos.length > 0) setIdProyecto(proyectos[0].id);
    }, [idProyecto, proyectos]);

    useEffect(() => {
        setPrediccion(null);
        setErrorPrediccion('');
        if (idProyecto === null || !entrenadoEn) return undefined;
        let vigente = true;
        setCargandoPrediccion(true);
        api.get<PrediccionRed>(`/proyectos/${idProyecto}/red-neuronal`, { params: { horizonte_dias: horizonte } })
            .then(({ data }) => vigente && setPrediccion(data))
            .catch((err) => vigente && setErrorPrediccion(mensajeDeError(err, 'No fue posible calcular la predicción.')))
            .finally(() => vigente && setCargandoPrediccion(false));
        return () => { vigente = false; };
    }, [idProyecto, horizonte, entrenadoEn]);

    const entrenar = () => {
        setErrorEstado('');
        api.post<EstadoRed>('/modelo-predictivo/red-neuronal/entrenar', null, { params: { horizonte_dias: horizonte } })
            .then(({ data }) => setEstado(data))
            .catch((err) => setErrorEstado(mensajeDeError(err, 'No fue posible iniciar el entrenamiento.')));
    };

    return (
        <MainLayout>
            <Head title="Red neuronal | AVA" />

            <div className="max-w-[1200px] mx-auto p-6 lg:p-8 space-y-6">
                <section className="bg-white border border-verde-3 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gris-2">Red neuronal del proyecto</h1>
                        <p className="text-sm text-gris-1 mt-1">Estima cada tipo de evento y entidad sin usar el historial propio de la entidad.</p>
                        {entrenadoEn && <p className="text-xs text-gris-1 mt-1">Último entrenamiento: {new Date(entrenadoEn).toLocaleString('es-CL')}</p>}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                        <label className="text-xs font-semibold text-gris-1">
                            Horizonte
                            <select value={horizonte} onChange={(e) => setHorizonte(Number(e.target.value))} className="mt-1 block min-w-32 rounded-lg border-verde-3 text-sm text-gris-2">
                                <OpcionesHorizonte />
                            </select>
                        </label>
                        <button type="button" onClick={entrenar} disabled={entrenando} className="rounded-lg bg-verde-6 px-4 py-2 text-sm font-bold text-gris-2 hover:opacity-90 disabled:opacity-60">
                            {entrenando ? 'Entrenando…' : 'Entrenar con los datos actuales'}
                        </button>
                    </div>
                </section>

                <AvisoHorizonte dias={horizonte} />

                {errorEstado && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{errorEstado}</p>}
                {estado?.estado === 'error' && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">El último entrenamiento falló: {estado.mensaje}</p>}
                {entrenando && <p className="text-sm text-gris-1" role="status">Entrenando la red. Suele tardar uno o dos minutos; puedes seguir usando el sistema.</p>}
                {estado?.estado === 'sin_entrenar' && <p className="rounded-lg border border-verde-3 bg-white p-4 text-sm text-gris-1">Aún no hay una red entrenada para este horizonte.</p>}

                {entrenadoEn && (
                    <section className="bg-white border border-verde-3 rounded-2xl shadow-md p-6 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                            <h2 className="text-lg font-bold text-gris-2">Predicción por proyecto</h2>
                            <label className="text-xs font-semibold text-gris-1">
                                Proyecto
                                <select value={idProyecto ?? ''} onChange={(e) => setIdProyecto(Number(e.target.value))} className="mt-1 block min-w-64 rounded-lg border-verde-3 text-sm text-gris-2">
                                    {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </label>
                        </div>
                        {errorPrediccion && <p className="text-sm text-rojo-1" role="alert">{errorPrediccion}</p>}
                        {cargandoPrediccion && <p className="text-sm text-gris-1" role="status">Calculando la predicción…</p>}
                        {prediccion?.mensaje && <p className="text-sm text-gris-1">{prediccion.mensaje}</p>}
                        <AvisoCoherencia coherencia={prediccion?.coherencia} />
                        {prediccion && prediccion.eventos.length > 0 && (
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div>
                                    <h3 className="text-sm font-bold text-gris-2 mb-3">Tipos de evento</h3>
                                    <ul className="space-y-3">
                                        {prediccion.eventos.map((evento) => (
                                            <li key={evento.objetivo}>
                                                <div className="flex items-center justify-between gap-2 mb-1 text-xs font-semibold text-gris-2">
                                                    {etiquetaTipo(evento.objetivo)}
                                                    <Respaldo supera={evento.calidad.supera_referencias} />
                                                </div>
                                                <BarraRiesgo probabilidad={evento.prob_evento} aviso={esAviso(evento.objetivo)} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gris-2">Entidades</h3>
                                    {Object.keys(prediccion.entidades).length === 0 && <p className="text-xs text-gris-1">Este proyecto no tiene entidades vigentes.</p>}
                                    {Object.entries(prediccion.entidades).map(([nivel, filas]) => (
                                        <div key={nivel}>
                                            <p className="flex items-center justify-between gap-2 text-xs font-bold text-gris-1 mb-2">
                                                {plural(nivel)}
                                                {estado?.entidades?.por_grupo[nivel] && <Respaldo supera={estado.entidades.por_grupo[nivel].supera_referencias} />}
                                            </p>
                                            <ul className="space-y-2">
                                                {filas.map((fila) => (
                                                    <li key={fila.id} className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-3 text-xs text-gris-2">
                                                        <span>{fila.nombre}{fila.detalle && <span className="text-gris-1"> · {fila.detalle}</span>}</span>
                                                        <BarraRiesgo probabilidad={fila.prob_evento} />
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {horizonteDerivado(horizonte) && estado?.conversion_dias && (
                    <section className="bg-white border border-verde-3 rounded-2xl shadow-md p-6 space-y-3">
                        <div>
                            <h2 className="text-lg font-bold text-gris-2">Calidad de la estimación a {etiquetaHorizonte(horizonte)}</h2>
                            <p className="text-xs text-gris-1 mt-1">
                                Comparación con lo ocurrido en semanas no vistas, contando desde el lunes. Si el riesgo predicho se aleja de la tasa real, el supuesto de riesgo parejo no se cumple.
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs uppercase tracking-wider text-gris-1 border-b border-verde-3 text-left">
                                    <tr>
                                        <th scope="col" className="py-2 pr-3">Entidad</th>
                                        <th scope="col" className="py-2 pr-3">Riesgo predicho</th>
                                        <th scope="col" className="py-2 pr-3">Tasa real</th>
                                        <th scope="col" className="py-2 pr-3">AUC</th>
                                        <th scope="col" className="py-2 pr-3">Log-loss</th>
                                        <th scope="col" className="py-2 pr-3">Log-loss referencia</th>
                                        <th scope="col" className="py-2">Resultado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-verde-3 text-gris-2">
                                    {Object.entries(estado.conversion_dias).map(([nivel, medidas]) => {
                                        const medida = medidas[String(horizonte)];
                                        if (!medida) return null;
                                        return (
                                            <tr key={nivel}>
                                                <th scope="row" className="py-2 pr-3 text-left font-semibold">
                                                    {singular(nivel)}
                                                    <span className="block text-[11px] font-normal text-gris-1">{medida.positivos} positivos en {medida.filas} filas</span>
                                                </th>
                                                <td className="py-2 pr-3">{(medida.riesgo_predicho * 100).toFixed(1)}%</td>
                                                <td className="py-2 pr-3">{(medida.tasa_real * 100).toFixed(1)}%</td>
                                                <td className="py-2 pr-3">{decimal(medida.auc_roc)}</td>
                                                <td className="py-2 pr-3">{decimal(medida.log_loss)}</td>
                                                <td className="py-2 pr-3">{decimal(medida.log_loss_referencia)}</td>
                                                <td className="py-2"><Respaldo supera={medida.supera_referencia} /></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {estado?.eventos && (
                    <section className="bg-white border border-verde-3 rounded-2xl shadow-md p-6 space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-gris-2">Calidad en semanas no vistas</h2>
                            <p className="text-xs text-gris-1 mt-1">
                                Una log-loss más baja significa mejores probabilidades. «Sin mejora comprobada» indica que conviene no decidir solo con esa estimación.
                            </p>
                        </div>
                        <TablaEvaluacion titulo="Tipos de evento" filas={estado.eventos.evaluacion} nombre={etiquetaTipo} />
                        {estado.entidades && <TablaEvaluacion titulo="Entidades" filas={estado.entidades.por_grupo} nombre={singular} />}
                    </section>
                )}
            </div>
        </MainLayout>
    );
}
