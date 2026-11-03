import { useEffect, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarClock, MapPin, ShieldAlert } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { api } from '@/lib/api';

type Proyecto = { id_proyecto: number; nombre: string };
type EventoEstimado = {
    nombre_proyecto: string;
    cliente?: string | null;
    faena?: string | null;
    area_probable?: string | null;
    probabilidad_area?: number | null;
    actividad_probable?: string | null;
    probabilidad_actividad?: number | null;
    trabajador_probable?: string | null;
    id_trabajador_probable?: number | null;
    cuadrilla_probable?: string | null;
    probabilidad_cuadrilla?: number | null;
    tipo_evento_probable?: string | null;
    tipos_historicos: Array<{ tipo: string; eventos: number }>;
    eventos_historicos_tipo: number;
    eventos_historicos_proyecto: number;
    prob_evento_horizonte: number;
    horizonte_semanas: number;
    espera_estimada_dias: number;
    espera_estimada_semanas: number;
    fecha_estimada: string;
    probabilidad_30_dias: number;
    probabilidad_90_dias: number;
    evidencia: string;
    metodo_tiempo: string;
    advertencia: string;
};
type EntidadRiesgo = { nombre?: string | null; prob_evento: number; historico_eventos?: number; evidencia?: string };
type Respuesta = {
    analisis_entidades?: {
        contexto: { evento_estimado?: EventoEstimado };
        entidades: { areas?: EntidadRiesgo[]; actividades?: EntidadRiesgo[] };
    };
};
type Props = { proyecto: Proyecto; tipoObjetivo: string; horizonte: number; [key: string]: unknown };

function porcentaje(valor?: number | null): string {
    return `${Math.round((valor ?? 0) * 100)}%`;
}

export default function DetalleEventoEstimado() {
    const { proyecto, tipoObjetivo, horizonte } = usePage<Props>().props;
    const [evento, setEvento] = useState<EventoEstimado | null>(null);
    const [areas, setAreas] = useState<EntidadRiesgo[]>([]);
    const [actividades, setActividades] = useState<EntidadRiesgo[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let vigente = true;
        api.get<Respuesta>(`/proyectos/${proyecto.id_proyecto}/predicciones`, {
            params: { tipo_objetivo: tipoObjetivo, horizonte },
        })
            .then(({ data }) => {
                if (!vigente) return;
                setEvento(data.analisis_entidades?.contexto.evento_estimado ?? null);
                setAreas(data.analisis_entidades?.entidades.areas ?? []);
                setActividades(data.analisis_entidades?.entidades.actividades ?? []);
            })
            .catch((err) => {
                if (vigente) setError(err.response?.data?.detail ?? err.response?.data?.message ?? 'No fue posible cargar el detalle.');
            })
            .finally(() => vigente && setCargando(false));
        return () => { vigente = false; };
    }, [horizonte, proyecto.id_proyecto, tipoObjetivo]);

    return (
        <MainLayout>
            <Head title={`Próximo evento estimado | ${proyecto.nombre}`} />
            <div className="mx-auto max-w-[1100px] space-y-6 p-6 lg:p-8">
                <Link href="/modelo-predictivo" className="inline-flex items-center gap-2 text-sm font-bold text-verde-6 hover:underline">
                    <ArrowLeft className="h-4 w-4" /> Volver a predicciones
                </Link>

                <header className="rounded-2xl border border-verde-3 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-verde-6">Detalle del evento estimado</p>
                    <h1 className="mt-1 text-2xl font-black text-gris-2">{proyecto.nombre}</h1>
                    <p className="mt-2 text-sm text-gris-1">Tipo consultado: {tipoObjetivo === 'todos' ? 'todos los eventos' : tipoObjetivo.replace(/_/g, ' ')} · horizonte de {horizonte} {horizonte === 1 ? 'semana' : 'semanas'}.</p>
                </header>

                {cargando ? <section className="rounded-2xl border border-verde-3 bg-white p-8 text-gris-1">Calculando tiempo y contexto probable…</section>
                    : error ? <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">{error}</section>
                        : !evento ? <section className="rounded-2xl border border-verde-3 bg-white p-8 text-gris-1">No hay suficiente información para construir el detalle del próximo evento.</section>
                            : <>
                                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-2xl border border-verde-3 bg-white p-5 shadow-sm">
                                        <p className="text-xs font-bold uppercase text-gris-1">Espera esperada</p>
                                        <p className="mt-2 text-3xl font-black text-verde-6">{evento.espera_estimada_dias} días</p>
                                        <p className="mt-1 text-xs text-gris-1">Fecha estadística: {evento.fecha_estimada}</p>
                                    </div>
                                    <div className="rounded-2xl border border-verde-3 bg-white p-5 shadow-sm">
                                        <p className="text-xs font-bold uppercase text-gris-1">Probabilidad en el horizonte</p>
                                        <p className="mt-2 text-3xl font-black text-gris-2">{porcentaje(evento.prob_evento_horizonte)}</p>
                                        <p className="mt-1 text-xs text-gris-1">{horizonte} semanas · evidencia {evento.evidencia}</p>
                                    </div>
                                    <div className="rounded-2xl border border-verde-3 bg-white p-5 shadow-sm">
                                        <p className="text-xs font-bold uppercase text-gris-1">Probabilidad a 30 días</p>
                                        <p className="mt-2 text-3xl font-black text-gris-2">{porcentaje(evento.probabilidad_30_dias)}</p>
                                        <p className="mt-1 text-xs text-gris-1">A 90 días: {porcentaje(evento.probabilidad_90_dias)}</p>
                                    </div>
                                    <div className="rounded-2xl border border-verde-3 bg-white p-5 shadow-sm">
                                        <p className="text-xs font-bold uppercase text-gris-1">Historial del proyecto</p>
                                        <p className="mt-2 text-3xl font-black text-gris-2">{evento.eventos_historicos_proyecto}</p>
                                        <p className="mt-1 text-xs text-gris-1">{evento.eventos_historicos_tipo} del tipo probable</p>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-verde-3 bg-white p-6 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <ShieldAlert className="h-6 w-6 text-verde-6" />
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-gris-1">Tipo más probable según el historial</p>
                                            <h2 className="text-xl font-black text-gris-2">{evento.tipo_evento_probable?.replace(/_/g, ' ') ?? 'Sin clasificación suficiente'}</h2>
                                        </div>
                                    </div>
                                    <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        <div className="rounded-xl bg-verde-1 p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase text-gris-1"><MapPin className="h-4 w-4" /> Ubicación posible</p><p className="mt-2 font-bold text-gris-2">{evento.faena ?? 'Faena no identificada'}</p><p className="text-sm text-gris-1">Área: {evento.area_probable ?? 'Sin área asociada'}{evento.probabilidad_area != null ? ` · riesgo ${porcentaje(evento.probabilidad_area)}` : ''}</p></div>
                                        <div className="rounded-xl bg-verde-1 p-4"><p className="text-xs font-bold uppercase text-gris-1">Proyecto y cliente</p><p className="mt-2 font-bold text-gris-2">{evento.nombre_proyecto}</p><p className="text-sm text-gris-1">{evento.cliente ?? 'Cliente no identificado'}</p></div>
                                        <div className="rounded-xl bg-verde-1 p-4"><p className="text-xs font-bold uppercase text-gris-1">Actividad / cuadrilla</p><p className="mt-2 font-bold text-gris-2">{evento.actividad_probable ?? 'Actividad no identificada'}{evento.probabilidad_actividad != null ? ` · ${porcentaje(evento.probabilidad_actividad)}` : ''}</p><p className="text-sm text-gris-1">{evento.cuadrilla_probable ?? 'Cuadrilla no identificada'}{evento.probabilidad_cuadrilla != null ? ` · ${porcentaje(evento.probabilidad_cuadrilla)}` : ''}</p>{evento.trabajador_probable && <p className="mt-1 text-sm text-gris-1">Trabajador asociado: {evento.trabajador_probable} (#{evento.id_trabajador_probable})</p>}</div>
                                    </div>
                                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                                        <div>
                                            <h3 className="font-bold text-gris-2">Tipos registrados con mayor frecuencia</h3>
                                            <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-verde-1 text-xs text-gris-1"><tr><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Eventos históricos</th></tr></thead><tbody className="divide-y divide-verde-3/70">{evento.tipos_historicos.map((item) => <tr key={item.tipo}><td className="px-3 py-2">{item.tipo.replace(/_/g, ' ')}</td><td className="px-3 py-2 font-bold">{item.eventos}</td></tr>)}</tbody></table></div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gris-2">Áreas consideradas</h3>
                                            <div className="mt-2 space-y-2">{areas.slice(0, 5).map((area, index) => <div key={`${area.nombre}-${index}`} className="flex items-center justify-between rounded-lg bg-verde-1 px-3 py-2 text-sm"><span>{area.nombre ?? `Área ${index + 1}`}</span><span className="font-black text-verde-6">{porcentaje(area.prob_evento)}</span></div>)}{areas.length === 0 && <p className="text-sm text-gris-1">No hay áreas vinculadas a los eventos del proyecto.</p>}</div>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
                                    <p className="flex items-center gap-2 font-bold"><CalendarClock className="h-4 w-4" /> Cómo interpretar esta estimación</p>
                                    <p className="mt-2">{evento.metodo_tiempo}. {evento.advertencia}</p>
                                </section>
                            </>}
            </div>
        </MainLayout>
    );
}
