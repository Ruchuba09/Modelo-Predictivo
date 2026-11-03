import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Prediction = {
    id_proyecto: number;
    semana: string;
    prob_evento: number;
    variables?: Record<string, string | number | boolean | null>;
};
type EntityAnalysis = { entidades: Record<string, unknown>; contexto: Record<string, unknown> };

const HORIZONTES = [1, 4, 12];

export default function PrediccionProyecto({ idProyecto }: { idProyecto: number }) {
    const [tipos, setTipos] = useState<string[]>(['todos']);
    const [tipo, setTipo] = useState('todos');
    const [horizonte, setHorizonte] = useState(4);
    const [prediccion, setPrediccion] = useState<Prediction | null>(null);
    const [analisis, setAnalisis] = useState<EntityAnalysis | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get<{ tipos: string[] }>('/modelo-predictivo/tipos')
            .then(({ data }) => setTipos(data.tipos?.length ? data.tipos : ['todos']))
            .catch(() => setError('No se pudieron cargar los tipos de evento.'));
    }, []);

    useEffect(() => {
        let vigente = true;
        setCargando(true);
        setError('');
        api.get<{ predicciones?: Prediction[]; analisis_entidades?: EntityAnalysis }>(`/proyectos/${idProyecto}/predicciones`, {
            params: { tipo_objetivo: tipo, horizonte },
        })
            .then(({ data }) => {
                if (vigente) setPrediccion(data.predicciones?.[0] ?? null);
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
                            {tipos.map((opcion) => <option key={opcion} value={opcion}>{opcion === 'todos' ? 'Todos los eventos' : opcion.replace(/_/g, ' ')}</option>)}
                        </select>
                    </label>
                    <label className="text-xs font-semibold text-gris-1">
                        Horizonte
                        <select value={horizonte} onChange={(event) => setHorizonte(Number(event.target.value))} className="mt-1 block w-full rounded-lg border-verde-3 text-sm text-gris-2">
                            {HORIZONTES.map((semanas) => <option key={semanas} value={semanas}>{semanas} {semanas === 1 ? 'semana' : 'semanas'}</option>)}
                        </select>
                    </label>
                </div>
            </div>

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
                            <span className="font-bold text-gris-2">Dentro de {horizonte} {horizonte === 1 ? 'semana' : 'semanas'}</span>
                            <p className="text-xs mt-1">Semana base: {prediccion.semana}</p>
                        </div>
                        {prediccion.variables && <details className="sm:col-span-3 text-xs text-gris-1">
                            <summary className="cursor-pointer font-semibold">Variables consideradas por el modelo</summary>
                            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(prediccion.variables).map(([nombre, valor]) => (
                                    <div key={nombre} className="flex gap-1"><dt className="font-semibold">{nombre}:</dt><dd>{valor === null ? 'Sin dato' : String(valor)}</dd></div>
                                ))}
                            </dl>
                        </details>}
                    </div>
                ) : (
                    <p className="text-sm text-gris-1">No hay predicción disponible para este proyecto.</p>
                )}
            </div>
            {!cargando && !error && analisis && <div className="mt-4 border-t border-verde-3 pt-4">
                <h3 className="font-bold text-gris-2">Riesgo por entidad del proyecto</h3>
                <p className="mt-1 text-xs text-gris-1">Las estimaciones se suavizan hacia el riesgo del proyecto; revisa nivel de evidencia y exposición estimada.</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {Object.entries(analisis.entidades).map(([clave, valor]) => {
                        const items = Array.isArray(valor) ? valor as Array<Record<string, unknown>> : [valor as Record<string, unknown>];
                        const titulos: Record<string, string> = { trabajadores: 'Trabajadores', trabajador_actividad: 'Trabajador por actividad', cuadrillas: 'Cuadrillas', actividades: 'Actividades', areas: 'Áreas', faena: 'Faena', cliente: 'Cliente' };
                        return <details key={clave} className="rounded-lg border border-verde-3/70 p-3 text-xs text-gris-1">
                            <summary className="cursor-pointer font-bold text-gris-2">{titulos[clave] ?? clave} ({items.length})</summary>
                            <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                                {items.map((item, index) => <div key={`${clave}-${index}`} className="rounded-md bg-verde-1 p-2">
                                    <p className="font-semibold">{String(item.nombre_trabajador ?? item.nombre ?? item.actividad ?? `${clave} ${item.id_trabajador ?? item.id_cuadrilla ?? item.id_area ?? ''}`)} · {Math.round(Number(item.prob_evento ?? 0) * 100)}%</p>
                                    <p>Historial: {String(item.historico_eventos ?? item.historico_eventos_asociados ?? 0)} · evidencia: {String(item.evidencia ?? 'baja')}</p>
                                    <details className="mt-1"><summary className="cursor-pointer">Información completa</summary><pre className="mt-1 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre></details>
                                </div>)}
                            </div>
                        </details>;
                    })}
                </div>
            </div>}
        </section>
    );
}
