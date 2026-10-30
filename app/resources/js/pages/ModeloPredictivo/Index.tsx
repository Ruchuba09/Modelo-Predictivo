import { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Activity, RefreshCw, Sparkles } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { api } from '@/lib/api';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Proyecto = { id_proyecto: number; nombre: string };
type EventoEstimado = {
    id_proyecto: number;
    nombre_proyecto: string;
    cliente?: string | null;
    faena?: string | null;
    area_probable?: string | null;
    tipo_evento_probable?: string | null;
    espera_estimada_dias: number;
    fecha_estimada: string;
    prob_evento_horizonte: number;
    probabilidad_30_dias: number;
    probabilidad_90_dias: number;
    evidencia: string;
    advertencia: string;
};
type Prediccion = {
    id_proyecto: number;
    nombre_proyecto?: string | null;
    semana: string;
    prob_evento: number;
    variables?: Record<string, string | number | boolean | null>;
};
type RespuestaPredicciones = {
    tipo_objetivo: string;
    horizonte_semanas: number;
    unidad_analisis: string;
    evento: string;
    modelo: string;
    predicciones: Prediccion[];
    advertencia_modelo?: string | null;
    analisis_entidades?: {
        contexto: Record<string, any>;
        entidades: Record<string, unknown>;
    } | null;
    analisis_global?: { cuadrillas: Array<Record<string, unknown>>; proximo_evento?: EventoEstimado | null };
    diagnostico?: { base_datos: string; esquema: string; cuadrillas_registradas: number; cuadrillas_predichas: number };
};
type PageProps = { proyectos: Proyecto[]; [key: string]: unknown };

const HORIZONTES = [1, 4, 12];

function mensajeError(error: any): string {
    return error.response?.data?.detail
        ?? error.response?.data?.message
        ?? 'No fue posible generar las predicciones. Intenta nuevamente.';
}

export default function Index() {
    const { proyectos = [] } = usePage<PageProps>().props;
    const [tipos, setTipos] = useState<string[]>(['todos']);
    const [tipo, setTipo] = useState('todos');
    const [horizonte, setHorizonte] = useState(4);
    const [idProyecto, setIdProyecto] = useState('todos');
    const [analisis, setAnalisis] = useState<RespuestaPredicciones['analisis_entidades']>(null);
    const [cuadrillasGlobales, setCuadrillasGlobales] = useState<Array<Record<string, unknown>>>([]);
    const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
    const [metadatos, setMetadatos] = useState<Omit<RespuestaPredicciones, 'predicciones'> | null>(null);
    const [advertenciaModelo, setAdvertenciaModelo] = useState('');
    const [cargandoTipos, setCargandoTipos] = useState(true);
    const [generando, setGenerando] = useState(false);
    const [generada, setGenerada] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let vigente = true;
        api.get<{ tipos: string[] }>('/modelo-predictivo/tipos')
            .then(({ data }) => {
                if (vigente) setTipos(data.tipos?.length ? data.tipos : ['todos']);
            })
            .catch((err) => {
                if (vigente) setError(mensajeError(err));
            })
            .finally(() => vigente && setCargandoTipos(false));
        return () => { vigente = false; };
    }, []);

    const proyectosPorId = useMemo(
        () => new Map<number, string>(proyectos.map((proyecto) => [proyecto.id_proyecto, proyecto.nombre] as const)),
        [proyectos],
    );

    const resultados = useMemo(
        () => predicciones
            .filter((item) => idProyecto === 'todos' || item.id_proyecto === Number(idProyecto))
            .sort((a, b) => b.prob_evento - a.prob_evento),
        [idProyecto, predicciones],
    );

    const generar = useCallback(async () => {
        setGenerando(true);
        setError('');
        setAnalisis(null);
        setCuadrillasGlobales([]);
        setMetadatos(null);
        setAdvertenciaModelo('');
        try {
            const { data } = await api.get<RespuestaPredicciones>('/modelo-predictivo/predicciones', {
                params: { tipo_objetivo: tipo, horizonte, ...(idProyecto !== 'todos' ? { id_proyecto: Number(idProyecto) } : {}) },
            });
            setPredicciones(data.predicciones ?? []);
            setAnalisis(data.analisis_entidades ?? null);
            setCuadrillasGlobales(data.analisis_global?.cuadrillas ?? []);
            setAdvertenciaModelo(data.advertencia_modelo ?? '');
            const { predicciones: _predicciones, ...resumen } = data;
            setMetadatos(resumen);
            setGenerada(true);
        } catch (err) {
            setPredicciones([]);
            setGenerada(false);
            setError(mensajeError(err));
        } finally {
            setGenerando(false);
        }
    }, [horizonte, idProyecto, tipo]);

    useEffect(() => {
        if (!cargandoTipos && idProyecto && !generada && !generando && !error) {
            void generar();
        }
    }, [cargandoTipos, idProyecto, generada, generando, error, generar]);

    const promedio = resultados.length
        ? Math.round(resultados.reduce((total, item) => total + item.prob_evento, 0) / resultados.length * 100)
        : 0;
    const maxima = resultados[0];
    const eventoEstimado: EventoEstimado | null = idProyecto === 'todos'
        ? metadatos?.analisis_global?.proximo_evento ?? null
        : analisis?.contexto.evento_estimado ?? null;

    return (
        <MainLayout>
            <Head title="Modelo Predictivo | AVA" />

            <div className="max-w-[1200px] mx-auto p-6 lg:p-8 space-y-6">
                <section className="bg-white border border-verde-3 rounded-2xl p-6 lg:p-8 shadow-md">
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-verde-1 px-3 py-1 text-xs font-bold text-verde-6 mb-3">
                                <Activity className="h-4 w-4" /> Análisis por proyecto
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gris-2">Predicciones de eventos</h1>
                            <p className="text-sm text-gris-1 mt-2">
                                Genera una estimación de la probabilidad de registrar al menos un evento en los proyectos vigentes.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                            <label className="text-xs font-semibold text-gris-1">
                                Proyecto
                                <select value={idProyecto} onChange={(event) => { setIdProyecto(event.target.value); setGenerada(false); setPredicciones([]); setAnalisis(null); setCuadrillasGlobales([]); setError(''); }} disabled={generando} className="mt-1 block min-w-48 rounded-lg border-verde-3 text-sm text-gris-2">
                                    <option value="todos">Todos los proyectos</option>
                                    {proyectos.map((proyecto) => <option key={proyecto.id_proyecto} value={proyecto.id_proyecto}>{proyecto.nombre}</option>)}
                                </select>
                            </label>
                            <label className="text-xs font-semibold text-gris-1">
                                Tipo de evento
                                <select
                                    value={tipo}
                                    onChange={(event) => {
                                        setTipo(event.target.value);
                                        setGenerada(false);
                                        setPredicciones([]);
                                        setError('');
                                    }}
                                    disabled={cargandoTipos || generando}
                                    className="mt-1 block min-w-48 rounded-lg border-verde-3 text-sm text-gris-2 disabled:opacity-60"
                                >
                                    {tipos.map((opcion) => (
                                        <option key={opcion} value={opcion}>
                                            {opcion === 'todos' ? 'Todos los eventos' : opcion.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-xs font-semibold text-gris-1">
                                Horizonte
                                <select
                                    value={horizonte}
                                    onChange={(event) => {
                                        setHorizonte(Number(event.target.value));
                                        setGenerada(false);
                                        setPredicciones([]);
                                        setError('');
                                    }}
                                    disabled={generando}
                                    className="mt-1 block min-w-36 rounded-lg border-verde-3 text-sm text-gris-2 disabled:opacity-60"
                                >
                                    {HORIZONTES.map((semanas) => (
                                        <option key={semanas} value={semanas}>{semanas} {semanas === 1 ? 'semana' : 'semanas'}</option>
                                    ))}
                                </select>
                            </label>
                            <button
                                type="button"
                                onClick={generar}
                                disabled={cargandoTipos || generando}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-verde-5 px-5 text-sm font-bold text-black shadow-sm transition hover:bg-verde-6 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {generando ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                {generando ? 'Generando...' : generada ? 'Actualizar predicciones' : 'Generar predicciones'}
                            </button>
                        </div>
                    </div>
                    {generando && (
                        <p className="mt-5 text-sm text-gris-1" role="status">
                            El modelo está analizando el historial semanal. Esto puede tardar unos momentos.
                        </p>
                    )}
                    {error && <p className="mt-5 rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{error}</p>}
                    {advertenciaModelo && <p className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="status">{advertenciaModelo} Se muestran estimaciones históricas suavizadas para que el análisis por entidad siga disponible.</p>}
                </section>

                {generada && resultados.length > 0 && (
                    <>
                        {maxima && eventoEstimado && <section className="rounded-2xl border border-verde-4 bg-gradient-to-r from-verde-1 to-white p-6 shadow-md">
                            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-verde-6">Próximo evento estimado</p>
                                    <h2 className="mt-1 text-xl font-black text-gris-2">{eventoEstimado.tipo_evento_probable?.replace(/_/g, ' ') ?? 'Evento de seguridad'}</h2>
                                    <p className="mt-1 text-sm text-gris-1">{eventoEstimado.nombre_proyecto} · {eventoEstimado.faena ?? 'Faena sin identificar'} · {eventoEstimado.area_probable ?? 'Área sin identificar'}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-6">
                                    <div><p className="text-xs font-semibold text-gris-1">Espera esperada</p><p className="text-2xl font-black text-verde-6">{eventoEstimado.espera_estimada_dias} días</p><p className="text-xs text-gris-1">Fecha estimada: {eventoEstimado.fecha_estimada}</p></div>
                                    <div><p className="text-xs font-semibold text-gris-1">Riesgo dentro de {horizonte} sem.</p><p className="text-2xl font-black text-gris-2">{Math.round(eventoEstimado.prob_evento_horizonte * 100)}%</p><p className="text-xs text-gris-1">Evidencia {eventoEstimado.evidencia}</p></div>
                                    <Link href={`/modelo-predictivo/proyectos/${maxima.id_proyecto}/evento-estimado?tipo_objetivo=${encodeURIComponent(tipo)}&horizonte=${horizonte}`} className="inline-flex h-11 items-center justify-center rounded-lg bg-verde-5 px-5 text-sm font-bold text-black hover:bg-verde-6">
                                        Ver detalle del evento
                                    </Link>
                                </div>
                            </div>
                            <p className="mt-4 border-t border-verde-3 pt-3 text-xs text-gris-1">{eventoEstimado.advertencia}</p>
                        </section>}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white border border-verde-3 rounded-2xl p-5 shadow-sm">
                                <p className="text-xs uppercase tracking-wider text-gris-1 font-bold">Proyectos evaluados</p>
                                <p className="text-3xl font-black text-gris-2 mt-2">{resultados.length}</p>
                            </div>
                            <div className="bg-white border border-verde-3 rounded-2xl p-5 shadow-sm">
                                <p className="text-xs uppercase tracking-wider text-gris-1 font-bold">Probabilidad promedio</p>
                                <p className="text-3xl font-black text-verde-6 mt-2">{promedio}%</p>
                            </div>
                            <div className="bg-white border border-verde-3 rounded-2xl p-5 shadow-sm">
                                <p className="text-xs uppercase tracking-wider text-gris-1 font-bold">Mayor probabilidad</p>
                                <p className="text-3xl font-black text-gris-2 mt-2">{Math.round((maxima?.prob_evento ?? 0) * 100)}%</p>
                                <p className="text-xs text-gris-1 mt-1">{proyectosPorId.get(maxima?.id_proyecto ?? 0) ?? `Proyecto #${maxima?.id_proyecto}`}</p>
                            </div>
                        </div>

                        <section className="bg-white border border-verde-3 rounded-2xl shadow-sm overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-6 py-5 border-b border-verde-3">
                                <div>
                                    <h2 className="text-lg font-bold text-gris-2">Resultados por proyecto</h2>
                                    <p className="text-xs text-gris-1 mt-1">
                                        {tipo === 'todos' ? 'Todos los eventos' : tipo.replace(/_/g, ' ')} · próximas {horizonte} {horizonte === 1 ? 'semana' : 'semanas'}
                                    </p>
                                </div>
                                <span className="text-xs text-gris-1">Ordenados de mayor a menor probabilidad</span>
                            </div>
                            <div className="h-72 px-4 pt-4" aria-label="Gráfico de probabilidades por proyecto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={resultados.slice(0, 20).map((item) => ({ nombre: item.nombre_proyecto ?? proyectosPorId.get(item.id_proyecto) ?? `Proyecto ${item.id_proyecto}`, probabilidad: item.prob_evento }))} margin={{ top: 12, right: 18, left: 0, bottom: 55 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="nombre" angle={-30} textAnchor="end" interval={0} height={68} tick={{ fontSize: 10 }} />
                                        <YAxis domain={[0, 1]} tickFormatter={(valor) => `${Math.round(Number(valor) * 100)}%`} tick={{ fontSize: 10 }} />
                                        <Tooltip formatter={(valor) => `${Math.round(Number(valor) * 100)}%`} />
                                        <Bar dataKey="probabilidad" name="Probabilidad" fill="#86CF00" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[680px] text-left">
                                    <thead className="bg-verde-1 text-[11px] uppercase tracking-wider text-gris-1">
                                        <tr>
                                            <th className="px-6 py-3 font-bold">Proyecto</th>
                                            <th className="px-6 py-3 font-bold">Probabilidad</th>
                                            <th className="px-6 py-3 font-bold">Semana base</th>
                                            <th className="px-6 py-3 font-bold">Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-verde-3/70">
                                        {resultados.map((item) => {
                                            const porcentaje = Math.round(item.prob_evento * 100);
                                            return (
                                                <tr key={item.id_proyecto} className="hover:bg-verde-1/60 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-semibold text-gris-2">
                                                        {item.nombre_proyecto ?? proyectosPorId.get(item.id_proyecto) ?? `Proyecto #${item.id_proyecto}`}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-12 text-sm font-black text-verde-6">{porcentaje}%</span>
                                                            <div className="h-2 w-32 rounded-full bg-verde-2 overflow-hidden" role="progressbar" aria-label={`Probabilidad ${porcentaje}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={porcentaje}>
                                                                <div className="h-full rounded-full bg-verde-5" style={{ width: `${porcentaje}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gris-1">{item.semana}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col items-start gap-1">
                                                            <Link href={`/proyectos/${item.id_proyecto}`} className="text-sm font-bold text-verde-6 hover:underline">Ver proyecto</Link>
                                                            <details className="text-xs text-gris-1">
                                                                <summary className="cursor-pointer font-semibold">Variables del modelo</summary>
                                                                {item.variables && <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                                                                    {Object.entries(item.variables).map(([nombre, valor]) => (
                                                                        <div key={nombre} className="flex gap-1"><dt className="font-semibold">{nombre}:</dt><dd>{valor === null ? 'Sin dato' : String(valor)}</dd></div>
                                                                    ))}
                                                                </dl>}
                                                            </details>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {metadatos && <p className="px-6 pb-4 text-xs text-gris-1">
                                {metadatos.evento}. Modelo: {metadatos.modelo}; unidad: {metadatos.unidad_analisis}.
                            </p>}
                        </section>
                    </>
                )}

                {generada && analisis && <section className="space-y-5">
                    <div className="bg-white border border-verde-3 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gris-2">Riesgos asociados al proyecto</h2>
                        <p className="mt-1 text-sm text-gris-1">Se usan la probabilidad del proyecto como referencia, los eventos asociados por entidad y una tasa histórica suavizada. La exposición puede ser aproximada si no existe asistencia histórica completa.</p>
                        <p className="mt-2 text-xs text-gris-1">{String(analisis.contexto.metodo ?? '')} · evidencia baja: menos de 5 eventos históricos; media: 5 a 19; alta: 20 o más.</p>
                    </div>
                    {Object.entries(analisis.entidades).map(([clave, valor]) => {
                        const registros = Array.isArray(valor) ? valor as Array<Record<string, unknown>> : [valor as Record<string, unknown>];
                        const registrosGrafico = registros.slice(0, 20);
                        const titulos: Record<string, string> = { trabajadores: 'Trabajadores', trabajador_actividad: 'Trabajador por actividad', cuadrillas: 'Configuraciones de cuadrilla', actividades: 'Actividades', areas: 'Áreas', faena: 'Historial de la faena', cliente: 'Historial del cliente' };
                        return <section key={clave} className="bg-white border border-verde-3 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-base font-bold text-gris-2">{titulos[clave] ?? clave}</h3>
                            {registros.length === 0 ? <p className="mt-3 text-sm text-gris-1">No hay entidades activas con datos para esta categoría.</p> :
                                <div className="mt-4">
                                    <div className="h-64 w-full" aria-label={`Gráfico de probabilidad: ${titulos[clave] ?? clave}`}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={registrosGrafico.map((registro, index) => ({
                                                nombre: String(registro.nombre_trabajador ?? registro.nombre ?? registro.actividad ?? `${clave} ${registro.id_trabajador ?? registro.id_cuadrilla ?? registro.id_area ?? index}`),
                                                probabilidad: Number(registro.prob_evento ?? 0),
                                            }))} margin={{ top: 12, right: 12, left: 0, bottom: 48 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="nombre" angle={-30} textAnchor="end" interval={0} height={60} tick={{ fontSize: 10 }} />
                                                <YAxis domain={[0, 1]} tickFormatter={(valor) => `${Math.round(Number(valor) * 100)}%`} tick={{ fontSize: 10 }} />
                                                <Tooltip formatter={(valor) => `${Math.round(Number(valor) * 100)}%`} />
                                                <Bar dataKey="probabilidad" name="Probabilidad" fill="#86CF00" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[640px] text-left text-sm">
                                            <thead className="bg-verde-1 text-[11px] uppercase tracking-wider text-gris-1"><tr>
                                                <th className="px-3 py-2">Entidad</th><th className="px-3 py-2">Probabilidad</th><th className="px-3 py-2">Eventos históricos</th><th className="px-3 py-2">Evidencia</th><th className="px-3 py-2">Factores</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-verde-3/70">{registros.map((registro, index) => {
                                                const id = registro.id_trabajador ?? registro.id_actividad ?? registro.id_cuadrilla ?? registro.id_area ?? registro.id_cliente ?? index;
                                                const nombre = registro.nombre_trabajador ?? registro.nombre ?? registro.actividad ?? `${titulos[clave] ?? clave} ${id}`;
                                                return <tr key={`${clave}-${id}-${index}`}>
                                                    <td className="px-3 py-3 font-semibold">{String(nombre)}{clave === 'trabajador_actividad' ? ` · Actividad ${String(registro.id_actividad)}` : ''}</td>
                                                    <td className="px-3 py-3 font-black text-verde-6">{Math.round(Number(registro.prob_evento ?? 0) * 100)}%</td>
                                                    <td className="px-3 py-3">{String(registro.historico_eventos ?? registro.historico_eventos_asociados ?? 0)}</td>
                                                    <td className="px-3 py-3">{String(registro.evidencia ?? 'baja')}</td>
                                                    <td className="px-3 py-3"><details><summary className="cursor-pointer font-semibold text-verde-6">Ver</summary><pre className="mt-2 max-w-xl overflow-x-auto whitespace-pre-wrap text-xs">{JSON.stringify(registro, null, 2)}</pre></details></td>
                                                </tr>;
                                            })}</tbody>
                                        </table>
                                    </div>
                                </div>}
                        </section>;
                    })}
                </section>}

                {generada && <section className="bg-white border border-verde-3 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-verde-3">
                        <h2 className="text-lg font-bold text-gris-2">Probabilidad por cuadrilla</h2>
                        <p className="mt-1 text-xs text-gris-1">{idProyecto === 'todos' ? 'Todas las cuadrillas registradas; se indica cuáles no tienen proyecto activo.' : `Cuadrillas asignadas al proyecto ${proyectosPorId.get(Number(idProyecto)) ?? `#${idProyecto}`}`} · ranking de mayor a menor riesgo.</p>
                    </div>
                    {cuadrillasGlobales.length === 0 ? <div className="p-6 text-sm text-gris-1">
                        {idProyecto === 'todos' ? <>
                            <p>No se recibieron predicciones de cuadrillas. El servicio Python ve {metadatos?.diagnostico?.cuadrillas_registradas ?? 'un número desconocido'} cuadrillas en <strong>{metadatos?.diagnostico?.base_datos ?? 'una base no identificada'}</strong> (esquema {metadatos?.diagnostico?.esquema ?? 'desconocido'}).</p>
                            {metadatos?.diagnostico && metadatos.diagnostico.cuadrillas_registradas > 0 && <p className="mt-2">La base sí tiene cuadrillas, pero el servicio predictivo no las incluyó. Reconstruye/recrea el contenedor <code>predictive-model</code> para cargar la consulta actual.</p>}
                        </> : 'Este proyecto no tiene cuadrillas asignadas activamente.'}
                    </div> : <>
                        <div className="h-72 px-4 pt-4" aria-label="Gráfico de probabilidades por cuadrilla">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={cuadrillasGlobales.slice(0, 20).map((item) => ({ nombre: `${String(item.proyecto)} · ${String(item.cuadrilla)}`, probabilidad: Number(item.prob_evento ?? 0) }))} margin={{ top: 12, right: 18, left: 0, bottom: 55 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="nombre" angle={-30} textAnchor="end" interval={0} height={68} tick={{ fontSize: 10 }} />
                                    <YAxis domain={[0, 1]} tickFormatter={(valor) => `${Math.round(Number(valor) * 100)}%`} tick={{ fontSize: 10 }} />
                                    <Tooltip formatter={(valor) => `${Math.round(Number(valor) * 100)}%`} />
                                    <Bar dataKey="probabilidad" name="Probabilidad" fill="#3FAE29" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="overflow-x-auto px-6 pb-6">
                            <table className="w-full min-w-[720px] text-left text-sm">
                                <thead className="bg-verde-1 text-[11px] uppercase tracking-wider text-gris-1"><tr>
                                    <th className="px-3 py-2">Proyecto</th><th className="px-3 py-2">Cuadrilla</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Probabilidad</th><th className="px-3 py-2">Integrantes</th><th className="px-3 py-2">Eventos históricos</th><th className="px-3 py-2">Detalle</th>
                                </tr></thead>
                                <tbody className="divide-y divide-verde-3/70">{cuadrillasGlobales.map((item, index) => <tr key={`${item.id_proyecto}-${item.id_cuadrilla}-${index}`}>
                                    <td className="px-3 py-3">{String(item.proyecto)}</td><td className="px-3 py-3 font-semibold">{String(item.cuadrilla)}</td>
                                    <td className="px-3 py-3">{item.estado_asignacion === 'activa' ? 'Proyecto activo' : 'Sin proyecto activo'}</td>
                                    <td className="px-3 py-3 font-black text-verde-6">{Math.round(Number(item.prob_evento ?? 0) * 100)}%</td>
                                    <td className="px-3 py-3">{String(item.integrantes ?? 0)}</td><td className="px-3 py-3">{String(item.historico_eventos_asociados ?? 0)}</td>
                                    <td className="px-3 py-3">
                                        <details className="group">
                                            <summary className="cursor-pointer list-none whitespace-nowrap rounded-lg border border-verde-3 px-3 py-2 text-center text-xs font-bold text-verde-6 hover:bg-verde-1">
                                                <span className="group-open:hidden">Ver detalle</span><span className="hidden group-open:inline">Ocultar</span>
                                            </summary>
                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.closest('details')?.removeAttribute('open'); }}>
                                                <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
                                                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-verde-3 pb-4">
                                                        <div><p className="text-xs font-bold uppercase tracking-wide text-gris-1">Detalle de riesgo</p><h3 className="mt-1 text-xl font-bold text-gris-2">{String(item.cuadrilla)} · {String(item.proyecto)}</h3><p className="mt-1 text-sm text-gris-1">Cuadrilla #{String(item.id_cuadrilla)}{item.id_proyecto ? ` · Proyecto #${String(item.id_proyecto)}` : ' · Sin proyecto activo'}</p></div>
                                                        <button type="button" onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')} className="rounded-lg border border-verde-3 px-3 py-2 text-xs font-semibold text-gris-1 hover:bg-verde-1">Cerrar</button>
                                                        <div className="rounded-xl bg-verde-1 px-4 py-3 text-center"><p className="text-xs text-gris-1">Riesgo en {String(item.horizonte_semanas ?? horizonte)} semanas</p><p className="text-2xl font-black text-verde-6">{Math.round(Number(item.prob_evento ?? 0) * 100)}%</p></div>
                                                    </div>
                                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                        <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gris-1">Tipo de evento</p><p className="mt-1 font-semibold">{String(item.tipo_objetivo ?? tipo)}</p></div>
                                                        <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gris-1">Integrantes</p><p className="mt-1 font-semibold">{String(item.integrantes ?? 0)}</p></div>
                                                        <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gris-1">Eventos históricos</p><p className="mt-1 font-semibold">{String(item.historico_eventos_asociados ?? 0)}</p></div>
                                                        <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gris-1">Nivel de evidencia</p><p className="mt-1 font-semibold capitalize">{String(item.evidencia ?? 'baja')}</p></div>
                                                    </div>
                                                    {(() => {
                                                        const miembros = Array.isArray(item.miembros) ? item.miembros as Array<Record<string, unknown>> : [];
                                                        const factores = item.factores && typeof item.factores === 'object' ? item.factores as Record<string, unknown> : {};
                                                        return <>
                                                            <h4 className="mt-6 font-bold text-gris-2">Riesgo por integrante</h4>
                                                            {miembros.length ? <div className="mt-2 overflow-x-auto rounded-lg border border-verde-3"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-verde-1 text-xs uppercase text-gris-1"><tr><th className="px-3 py-2">Trabajador</th><th className="px-3 py-2">Cargo</th><th className="px-3 py-2">Probabilidad</th><th className="px-3 py-2">Eventos</th><th className="px-3 py-2">Exposición (sem.)</th></tr></thead><tbody className="divide-y divide-verde-3/70">{miembros.map((miembro) => <tr key={String(miembro.id_trabajador)}><td className="px-3 py-3 font-semibold">{String(miembro.nombre ?? `Trabajador ${miembro.id_trabajador}`)}<span className="block text-xs font-normal text-gris-1">ID {String(miembro.id_trabajador)}</span></td><td className="px-3 py-3">{String(miembro.cargo ?? 'Sin cargo registrado')}</td><td className="px-3 py-3 font-bold text-verde-6">{Math.round(Number(miembro.prob_evento ?? 0) * 100)}%</td><td className="px-3 py-3">{String(miembro.historico_eventos ?? 0)}</td><td className="px-3 py-3">{String(miembro.semanas_exposicion_estimadas ?? '—')}</td></tr>)}</tbody></table></div> : <p className="mt-2 rounded-lg bg-gray-50 p-4 text-sm text-gris-1">No hay integrantes asociados a esta cuadrilla.</p>}
                                                            <h4 className="mt-6 font-bold text-gris-2">Factores del cálculo</h4>
                                                            <div className="mt-2 rounded-lg bg-gray-50 p-4 text-sm"><p>Probabilidad base del proyecto: <strong>{Math.round(Number(factores.probabilidad_base_proyecto ?? 0) * 100)}%</strong></p><p className="mt-2 text-gris-1">{String(factores.metodo ?? 'Estimación suavizada con el historial disponible de los integrantes.')}</p>{factores.combinacion_independiente_aproximada === true && <p className="mt-2 text-xs text-gris-1">La combinación suma el riesgo de los integrantes bajo una aproximación de independencia; la dependencia real entre sus riesgos puede cambiar el resultado.</p>}</div>
                                                        </>;
                                                    })()}
                                                </div>
                                            </div>
                                        </details>
                                    </td>
                                </tr>)}</tbody>
                            </table>
                        </div>
                    </>}
                </section>}

                {generada && resultados.length === 0 && !error && (
                    <section className="bg-white border border-verde-3 rounded-2xl p-8 text-center shadow-sm">
                        <p className="text-lg font-bold text-gris-2">No hay proyectos vigentes para mostrar.</p>
                        <p className="text-sm text-gris-1 mt-2">Revisa las fechas de término de los proyectos registrados.</p>
                    </section>
                )}

                {!generada && !generando && !error && (
                    <section className="bg-white border border-dashed border-verde-3 rounded-2xl p-10 text-center">
                        <Sparkles className="h-8 w-8 mx-auto text-verde-6" />
                        <p className="text-lg font-bold text-gris-2 mt-3">Configura el análisis</p>
                        <p className="text-sm text-gris-1 mt-1">Elige un proyecto, un tipo de evento y un horizonte para generar las predicciones y el análisis por entidad.</p>
                    </section>
                )}
            </div>
        </MainLayout>
    );
}
