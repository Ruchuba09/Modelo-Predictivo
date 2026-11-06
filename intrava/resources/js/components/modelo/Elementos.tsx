import { bandaRiesgo, ESTILO_BANDA, etiquetaHorizonte, HORIZONTES_MODELO, horizonteDerivado, porcentaje, type Factor } from '@/lib/modeloPredictivo';
import { etiquetaTipo } from '@/lib/utils';

export function OpcionesHorizonte({ desdeSemana = false }: { desdeSemana?: boolean }) {
    return (
        <>
            {HORIZONTES_MODELO.filter((h) => !desdeSemana || h.dias >= 7).map((h) => <option key={h.dias} value={h.dias}>{h.etiqueta}</option>)}
        </>
    );
}

/** Aclara que los plazos en días no tienen un modelo propio. */
export function AvisoHorizonte({ dias }: { dias: number }) {
    if (!horizonteDerivado(dias)) return null;
    return (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Estimación derivada del modelo de 1 semana, suponiendo un riesgo parejo en la semana. La calidad mostrada corresponde a ese modelo semanal.
        </p>
    );
}

/** Mientras se entrenan plazos menores, un plazo largo aún podría dar menos riesgo que uno corto. */
export function AvisoCoherencia({ coherencia }: { coherencia?: { completa: boolean; plazos_pendientes: number[] } }) {
    if (!coherencia || coherencia.completa) return null;
    return (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" role="status">
            Faltan por entrenar {coherencia.plazos_pendientes.map(etiquetaHorizonte).join(', ')}. Hasta entonces, este riesgo podría no ser coherente con esos plazos. Vuelve a consultar en unos minutos.
        </p>
    );
}

export function SelectoresModelo({ tipo, horizonte, tipos, cambiar }: {
    tipo: string;
    horizonte: number;
    tipos: string[];
    cambiar: (cambios: { tipo?: string; horizonte?: number }) => void;
}) {
    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <label className="text-xs font-semibold text-gris-1">
                Qué se predice
                <select value={tipo} onChange={(e) => cambiar({ tipo: e.target.value })} className="mt-1 block min-w-48 rounded-lg border-verde-3 text-sm text-gris-2">
                    {tipos.map((opcion) => <option key={opcion} value={opcion}>{etiquetaTipo(opcion)}</option>)}
                </select>
            </label>
            <label className="text-xs font-semibold text-gris-1">
                Horizonte
                <select value={horizonte} onChange={(e) => cambiar({ horizonte: Number(e.target.value) })} className="mt-1 block min-w-32 rounded-lg border-verde-3 text-sm text-gris-2">
                    <OpcionesHorizonte />
                </select>
            </label>
        </div>
    );
}

export function BarraRiesgo({ probabilidad }: { probabilidad: number }) {
    const banda = ESTILO_BANDA[bandaRiesgo(probabilidad)];
    const valor = Math.round(probabilidad * 100);
    return (
        <div className="flex items-center gap-3 min-w-44">
            <span className="w-10 text-sm font-black text-gris-2">{valor}%</span>
            <div className="h-2 flex-1 rounded-full bg-verde-2 overflow-hidden" role="progressbar" aria-label={`Riesgo ${valor}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={valor}>
                <div className={`h-full rounded-full ${banda.barra}`} style={{ width: `${valor}%` }} />
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${banda.chip}`}>{banda.etiqueta}</span>
        </div>
    );
}

/** Lo que más sube o baja el riesgo de una predicción, en puntos porcentuales. */
export function ListaFactores({ factores }: { factores?: Factor[] }) {
    if (!factores?.length) {
        return <p className="text-xs text-gris-1">Esta estimación usa la tasa histórica, sin factores individuales.</p>;
    }
    const maximo = Math.max(...factores.map((f) => Math.abs(f.efecto)), 0.01);
    return (
        <ul className="space-y-1.5">
            {factores.map((factor) => {
                const sube = factor.efecto > 0;
                return (
                    <li key={factor.variable} className="grid grid-cols-[1fr_6rem_3.5rem] items-center gap-2 text-xs">
                        <span className="text-gris-2">
                            {factor.etiqueta}
                            {factor.valor != null && <span className="text-gris-1"> · valor {factor.valor}</span>}
                        </span>
                        <span className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <span className={`block h-full rounded-full ${sube ? 'bg-rojo-1' : 'bg-verde-5'}`} style={{ width: `${(Math.abs(factor.efecto) / maximo) * 100}%` }} />
                        </span>
                        <span className={`text-right font-bold ${sube ? 'text-rojo-1' : 'text-verde-6'}`}>
                            {sube ? '+' : '−'}{Math.abs(factor.efecto * 100).toFixed(1)} pts
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

const ETIQUETAS_DATO: Record<string, string> = {
    incidentes_13_semanas: 'Incidentes (13 semanas)',
    reportes_preventivos_13_semanas: 'Reportes preventivos (13 semanas)',
    pendientes_de_cierre: 'Pendientes de cierre',
    semanas_desde_ultimo_incidente: 'Semanas desde el último incidente',
    personas_expuestas: 'Personas expuestas',
    cargo: 'Cargo',
    tipo_objetivo: 'Qué se predice',
    horizonte_semanas: 'Horizonte (semanas)',
    historico_eventos: 'Eventos en el periodo medido',
    historico_eventos_proyecto: 'Eventos en el proyecto',
    historico_eventos_todos_proyectos: 'Eventos en todos los proyectos',
    historico_eventos_asociados: 'Eventos asociados',
    semanas_exposicion_estimadas: 'Semanas de exposición',
    tasa_semanal_suavizada: 'Tasa semanal',
    evidencia: 'Evidencia',
    modelo: 'Modelo',
    metodo: 'Método',
    proyectos_historicos: 'Proyectos en el historial',
    probabilidad_base_proyecto: 'Riesgo del proyecto',
    eventos_historicos_asociados: 'Eventos asociados',
    eventos_del_trabajador_en_esta_actividad: 'Eventos del trabajador en esta actividad',
    eventos_en_proyectos_del_cliente: 'Eventos en proyectos del cliente',
    eventos_en_proyectos_de_la_faena: 'Eventos en proyectos de la faena',
    actividad_actual: 'Actividad actual',
    actividad: 'Actividad',
    integrantes: 'Integrantes',
    suma_probabilidades_individuales: 'Suma de riesgos individuales',
    dimension: 'Dimensión',
};

/** Identificadores internos y datos que ya se muestran en otra parte de la fila. */
const OCULTOS = new Set([
    'id_trabajador', 'id_actividad', 'id_cuadrilla', 'id_area', 'id_cliente', 'id_faena', 'id_proyecto', 'id', 'nombre', 'nombre_trabajador',
    'prob_evento', 'factores', 'factores_principales', 'miembros', 'miembros_detalle', 'valor',
    'probabilidades_individuales_combinadas', 'combinacion_independiente_aproximada', 'id_asignaciones_activas', 'horizonte_semanas',
]);

const ES_PROBABILIDAD = new Set(['probabilidad_base_proyecto', 'suma_probabilidades_individuales']);

function formatear(clave: string, valor: unknown): string {
    if (ES_PROBABILIDAD.has(clave)) return porcentaje(Number(valor));
    if (clave === 'tasa_semanal_suavizada') return `${(Number(valor) * 100).toFixed(1)}% por semana`;
    if (clave === 'tipo_objetivo') return etiquetaTipo(String(valor));
    if (clave === 'metodo') {
        return ({ modelo: 'Modelo validado', referencia: 'Tasa histórica', combinacion: 'Combinación' } as Record<string, string>)[String(valor)] ?? String(valor);
    }
    if (typeof valor === 'number') return Number.isInteger(valor) ? String(valor) : valor.toFixed(1);
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    return String(valor);
}

function FilasDatos({ datos }: { datos: Record<string, unknown> }) {
    const filas = Object.entries(datos).filter(([clave, valor]) => !OCULTOS.has(clave) && valor !== null && valor !== undefined && valor !== '' && typeof valor !== 'object');
    if (filas.length === 0) return null;
    return (
        <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {filas.map(([clave, valor]) => (
                <div key={clave} className="flex justify-between gap-3 border-b border-verde-3/40 py-1 text-xs">
                    <dt className="text-gris-1">{ETIQUETAS_DATO[clave] ?? clave.replace(/_/g, ' ')}</dt>
                    <dd className="font-semibold text-gris-2 text-right">{formatear(clave, valor)}</dd>
                </div>
            ))}
        </dl>
    );
}

/** Reemplaza el volcado de datos: muestra cada registro de riesgo con etiquetas legibles. */
export function DetalleRiesgo({ registro }: { registro: Record<string, unknown> }) {
    const factores = registro.factores_principales as Factor[] | undefined;
    const calculo = registro.factores && typeof registro.factores === 'object' && !Array.isArray(registro.factores)
        ? registro.factores as Record<string, unknown>
        : null;
    const miembros = (registro.miembros_detalle ?? []) as Array<{ id_trabajador: number; nombre?: string | null }>;
    return (
        <div className="space-y-3 rounded-lg bg-verde-1/50 p-3">
            {factores && factores.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-gris-2 mb-1.5">Qué mueve este riesgo</p>
                    <ListaFactores factores={factores} />
                </div>
            )}
            <FilasDatos datos={registro} />
            {calculo && (
                <div>
                    <p className="text-xs font-bold text-gris-2 mb-1">Cómo se calculó</p>
                    <FilasDatos datos={calculo} />
                </div>
            )}
            {miembros.length > 0 && (
                <p className="text-xs text-gris-1">
                    <span className="font-bold text-gris-2">Integrantes: </span>
                    {miembros.map((m) => m.nombre || `Trabajador ${m.id_trabajador}`).join(', ')}
                </p>
            )}
        </div>
    );
}
