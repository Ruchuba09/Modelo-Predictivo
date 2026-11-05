import { AvisoHorizonte, OpcionesHorizonte } from '@/components/modelo/Elementos';
import { HORIZONTE_PREDETERMINADO, plazoHorizonte } from '@/lib/modeloPredictivo';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Link } from '@inertiajs/react';
import { etiquetaTipo } from '../lib/utils';
import { DetalleRiesgo, ListaFactores } from './modelo/Elementos';
import type { Factor } from '../lib/modeloPredictivo';

type Prediction = {
    id_proyecto: number;
    semana: string;
    prob_evento: number;
    variables?: Record<string, string | number | boolean | null>;
    factores_principales?: Factor[];
};
type EntityAnalysis = { entidades: Record<string, unknown>; contexto: Record<string, unknown> };

export default function PrediccionProyecto({ idProyecto }: { idProyecto: number }) {
    const [tipos, setTipos] = useState<string[]>(['incidentes_reales', 'todos']);
    const [tipo, setTipo] = useState('incidentes_reales');
    const [horizonte, setHorizonte] = useState(HORIZONTE_PREDETERMINADO);
    const [prediccion, setPrediccion] = useState<Prediction | null>(null);
    const [analisis, setAnalisis] = useState<EntityAnalysis | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get<{ tipos: string[] }>('/modelo-predictivo/tipos')
            .then(({ data }) => setTipos(data.tipos?.length ? data.tipos : ['incidentes_reales', 'todos']))
            .catch(() => setError('No se pudieron cargar los tipos de evento.'));
    }, []);

    useEffect(() => {
        let vigente = true;
        setCargando(true);
        setError('');
        api.get<{ predicciones?: Prediction[]; analisis_entidades?: EntityAnalysis }>(`/proyectos/${idProyecto}/predicciones`, {
            params: { tipo_objetivo: tipo, horizonte_dias: horizonte },
        })
            .then(({ data }) => {
                if (vigente) setPrediccion(data.predicciones?.find((p) => p.id_proyecto === idProyecto) ?? null);
                if (vigente) setAnalisis(data.analisis_entidades ?? null);
            })
            .catch((err) => {
                if (vigente) {
                    setPrediccion(null);
                    setAnalisis(null);
                    setError(err.response?.data?.detail ?? err.response?.data?.message ?? 'No fue posible calcular la predicción.');
                }
            })
            .finally(() => vigente && setCargando(false));
        return () => { vigente = false; };
    }, [idProyecto, tipo, horizonte]);

    const probabilidad = prediccion ? Math.round(prediccion.prob_evento * 100) : 0;
    return (
        <section className="bg-white border border-verde-3 rounded-2xl p-6 shadow-md mb-6" aria-labelledby="prediccion-proyecto">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h2 id="prediccion-proyecto" className="text-lg font-bold text-gris-2">Riesgo predictivo</h2>
                    <p className="text-sm text-gris-1 mt-1">Probabilidad de registrar al menos un evento dentro del horizonte seleccionado.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <label className="text-xs font-semibold text-gris-1">
                        Tipo de evento
                        <select value={tipo} onChange={(event) => setTipo(event.target.value)} className="mt-1 block w-full rounded-lg border-verde-3 text-sm text-gris-2">
                            {tipos.map((opcion) => <option key={opcion} value={opcion}>{etiquetaTipo(opcion)}</option>)}
                        </select>
                    </label>
                    <label className="text-xs font-semibold text-gris-1">
                        Horizonte
                        <select value={horizonte} onChange={(event) => setHorizonte(Number(event.target.value))} className="mt-1 block w-full rounded-lg border-verde-3 text-sm text-gris-2">
                            <OpcionesHorizonte />
                        </select>
                    </label>
                </div>
            </div>

            <div className="mt-4"><AvisoHorizonte dias={horizonte} /></div>

            <div className="mt-6 min-h-24 flex items-center">
                {cargando ? (
                    <p className="text-sm text-gris-1">Calculando con el historial semanal...</p>
                ) : error ? (
                    <p role="alert" className="text-sm text-rojo-1">{error}</p>
                ) : prediccion ? (
                    <div className="w-full grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-gris-1 font-bold">Probabilidad estimada</p>
                            <p className="text-4xl font-black mt-1 text-verde-6">{probabilidad}%</p>
                        </div>
                        <div className="h-3 rounded-full bg-verde-2 overflow-hidden" role="progressbar" aria-label="Probabilidad de evento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={probabilidad}>
                            <div className="h-full rounded-full bg-verde-5 transition-all" style={{ width: `${probabilidad}%` }} />
                        </div>
                        <div className="text-sm text-gris-1">
                            <span className="font-bold text-gris-2">En {plazoHorizonte(horizonte)}</span>
                            <p className="text-xs mt-1">Semana base: {prediccion.semana}</p>
                        </div>
                        {prediccion.factores_principales && prediccion.factores_principales.length > 0 && (
                            <div className="sm:col-span-3">
                                <p className="text-xs font-bold text-gris-2 mb-1.5">Qué mueve este riesgo</p>
                                <ListaFactores factores={prediccion.factores_principales} />
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-gris-1">No hay predicción disponible para este proyecto.</p>
                )}
            </div>
            {!cargando && !error && analisis && <div className="mt-4 border-t border-verde-3 pt-4">
                <h3 className="font-bold text-gris-2">Riesgo por entidad del proyecto</h3>
                <p className="mt-1 text-xs text-gris-1">
                    Revisa el nivel de evidencia y la exposición de cada estimación.{' '}
                    <Link href={`/modelo-predictivo/entidades?id_proyecto=${idProyecto}&nivel=trabajador`} className="font-bold text-verde-6 hover:underline">Abrir en Riesgo por entidad</Link>
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {Object.entries(analisis.entidades).map(([clave, valor]) => {
                        const items = Array.isArray(valor) ? valor as Array<Record<string, unknown>> : [valor as Record<string, unknown>];
                        const titulos: Record<string, string> = { trabajadores: 'Trabajadores', trabajador_actividad: 'Trabajador por actividad', cuadrillas: 'Cuadrillas', actividades: 'Actividades', areas: 'Áreas', dimensiones_operativas: 'Factores operativos', faena: 'Faena', cliente: 'Cliente' };
                        return <details key={clave} className="rounded-lg border border-verde-3/70 p-3 text-xs text-gris-1">
                            <summary className="cursor-pointer font-bold text-gris-2">{titulos[clave] ?? clave} ({items.length})</summary>
                            <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                                {items.map((item, index) => <div key={`${clave}-${index}`} className="rounded-md bg-verde-1 p-2">
                                    <p className="font-semibold">{clave === 'dimensiones_operativas' ? `${String(item.dimension).replace(/_/g, ' ')}: ${String(item.nombre ?? item.valor)}` : String(item.nombre_trabajador ?? item.nombre ?? item.actividad ?? `${titulos[clave] ?? clave} ${item.id_trabajador ?? item.id_cuadrilla ?? item.id_area ?? ''}`)} · {Math.round(Number(item.prob_evento ?? 0) * 100)}%</p>
                                    <p>Historial: {String(item.historico_eventos ?? item.historico_eventos_asociados ?? 0)} · evidencia: {String(item.evidencia ?? 'baja')}</p>
                                    <details className="mt-1"><summary className="cursor-pointer">Ver detalle</summary><div className="mt-1"><DetalleRiesgo registro={item} /></div></details>
                                </div>)}
                            </div>
                        </details>;
                    })}
                </div>
            </div>}
        </section>
    );
}
