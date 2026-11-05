import { plazoHorizonte } from '@/lib/modeloPredictivo';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type CalidadNivel = {
    publicado?: boolean;
    metodo?: string | null;
    modelo?: string | null;
    filas?: number;
    positivos?: number;
    entidades?: number;
    prevalencia?: number | null;
    filas_validacion?: number;
    metricas?: { auc_roc: number; auc_pr: number; brier: number; log_loss: number };
    candidatos?: Record<string, { auc_roc: number; auc_pr: number; brier: number; log_loss: number }>;
    referencia?: { auc_roc: number; auc_pr: number; brier: number; log_loss: number };
    discriminacion?: string;
    mejora_log_loss_pct?: number;
    motivo?: string;
    importancia?: Array<{ variable: string; etiqueta: string; importancia: number }>;
};

export type PrediccionCliente = { cliente: string; prob: number; modelo: string };

export type Historial = {
    calidad: CalidadNivel;
    predicciones: PrediccionCliente[];
    patrones: {
        total: number;
        desde: string;
        hasta: string;
        con_lesion: number;
        por_anio: Record<string, number>;
        por_categoria: Record<string, number>;
        por_dia_semana: Record<string, number>;
        por_bloque_horario: Record<string, number>;
        por_riesgo: Record<string, number>;
    };
    lesiones?: { calidad: CalidadNivel; predicciones: PrediccionCliente[] };
};

const NIVELES: Record<string, string> = {
    proyecto: 'Proyecto',
    area: 'Área',
    cuadrilla: 'Cuadrilla',
    trabajador: 'Trabajador',
    actividad: 'Actividad',
};

const porcentaje = (valor: number) => `${Math.round(valor * 100)}%`;
const texto = (clave: string) => clave.replace(/_/g, ' ');

function FilaCalidad({ nombre, calidad }: { nombre: string; calidad: CalidadNivel }) {
    return (
        <tr className="align-top">
            <th scope="row" className="px-3 py-3 font-bold text-gris-2 text-left">{nombre}</th>
            <td className="px-3 py-3 text-gris-2">{calidad.modelo ?? 'Sin modelo'}</td>
            <td className="px-3 py-3 text-gris-2">
                {calidad.metricas ? `${calidad.metricas.auc_roc.toFixed(2)} (${calidad.discriminacion})` : '—'}
            </td>
            <td className="px-3 py-3 text-gris-2">
                {calidad.mejora_log_loss_pct !== undefined ? `${calidad.mejora_log_loss_pct.toFixed(1)}%` : '—'}
            </td>
            <td className="px-3 py-3 text-gris-1">{calidad.filas ?? 0} / {calidad.positivos ?? 0}</td>
            <td className="px-3 py-3 text-xs text-gris-1">
                {calidad.motivo ?? calidad.importancia?.slice(0, 3).map((f) => f.etiqueta).join(' · ') ?? ''}
            </td>
        </tr>
    );
}

function Barras({ titulo, datos }: { titulo: string; datos: Record<string, number> }) {
    const filas = Object.entries(datos).slice(0, 8);
    const maximo = Math.max(1, ...filas.map(([, valor]) => valor));
    return (
        <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gris-1 mb-2">{titulo}</h4>
            <ul className="space-y-1">
                {filas.map(([clave, valor]) => (
                    <li key={clave} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-2 text-xs text-gris-2">
                        <span className="truncate capitalize" title={texto(clave)}>{texto(clave)}</span>
                        <span className="h-2 rounded-full bg-verde-2">
                            <span className="block h-2 rounded-full bg-verde-5" style={{ width: `${(valor / maximo) * 100}%` }} />
                        </span>
                        <span className="text-right">{valor}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function CalidadModelos({ modelos }: { modelos: Record<string, CalidadNivel> }) {
    return (
        <section className="bg-white border border-verde-3 rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gris-2">Calidad del modelo por entidad</h2>
            <p className="text-xs text-gris-1 mt-1">
                Cada nivel compara cinco modelos con semanas futuras a su entrenamiento y publica el mejor solo si supera a la tasa histórica. Un AUC de 0,50 equivale al azar.
            </p>
            <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                    <thead className="text-xs uppercase tracking-wider text-gris-1 border-b border-verde-3 text-left">
                        <tr>
                            <th scope="col" className="px-3 py-2">Entidad</th>
                            <th scope="col" className="px-3 py-2">Modelo publicado</th>
                            <th scope="col" className="px-3 py-2">AUC-ROC</th>
                            <th scope="col" className="px-3 py-2">Mejora vs. referencia</th>
                            <th scope="col" className="px-3 py-2">Filas / positivas</th>
                            <th scope="col" className="px-3 py-2">Variables clave o motivo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-verde-3">
                        {Object.entries(NIVELES).map(([clave, nombre]) =>
                            modelos[clave] ? <FilaCalidad key={clave} nombre={nombre} calidad={modelos[clave]} /> : null,
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

type FilaEvaluacion = {
    nivel: string;
    tipo_objetivo: string;
    horizonte: number;
    predicciones: number;
    ocurrieron: number;
    riesgo_predicho: number;
    tasa_real: number;
    brier: number;
    auc_roc?: number;
};

export function EvaluacionPredicciones() {
    const [filas, setFilas] = useState<FilaEvaluacion[] | null>(null);

    useEffect(() => {
        api.get<{ evaluacion: FilaEvaluacion[] }>('/modelo-predictivo/evaluacion')
            .then(({ data }) => setFilas(data.evaluacion))
            .catch(() => setFilas([]));
    }, []);

    if (filas === null) return null;

    return (
        <section className="bg-white border border-verde-3 rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gris-2">¿Acertó el modelo?</h2>
            <p className="text-xs text-gris-1 mt-1">
                Compara lo predicho cada semana con lo que ocurrió después. Si el riesgo predicho y la tasa real se parecen, las probabilidades son confiables.
            </p>
            {filas.length === 0 ? (
                <p className="text-sm text-gris-1 mt-3">Todavía no hay predicciones cuyo plazo haya terminado.</p>
            ) : (
                <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase tracking-wider text-gris-1 border-b border-verde-3 text-left">
                            <tr>
                                <th scope="col" className="px-3 py-2">Entidad</th>
                                <th scope="col" className="px-3 py-2">Objetivo</th>
                                <th scope="col" className="px-3 py-2">Semanas</th>
                                <th scope="col" className="px-3 py-2">Predicciones</th>
                                <th scope="col" className="px-3 py-2">Riesgo predicho</th>
                                <th scope="col" className="px-3 py-2">Tasa real</th>
                                <th scope="col" className="px-3 py-2">AUC-ROC</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-verde-3 text-gris-2">
                            {filas.map((f) => (
                                <tr key={`${f.nivel}-${f.tipo_objetivo}-${f.horizonte}`}>
                                    <th scope="row" className="px-3 py-2 text-left font-bold">{NIVELES[f.nivel] ?? f.nivel}</th>
                                    <td className="px-3 py-2">{texto(f.tipo_objetivo)}</td>
                                    <td className="px-3 py-2">{f.horizonte} sem.</td>
                                    <td className="px-3 py-2">{f.predicciones}</td>
                                    <td className="px-3 py-2">{porcentaje(f.riesgo_predicho)}</td>
                                    <td className="px-3 py-2">{porcentaje(f.tasa_real)}</td>
                                    <td className="px-3 py-2">{f.auc_roc !== undefined ? f.auc_roc.toFixed(2) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export function HistorialReal({ historial, horizonte }: { historial: Historial; horizonte: number }) {
    const { patrones, calidad, predicciones, lesiones } = historial;
    const lesionesPorCliente = new Map(lesiones?.predicciones.map((p) => [p.cliente, p.prob]));
    return (
        <section className="bg-white border border-verde-3 rounded-2xl shadow-md p-6 space-y-5">
            <div>
                <h2 className="text-lg font-bold text-gris-2">Historial real de AVA</h2>
                <p className="text-xs text-gris-1 mt-1">
                    {patrones.total} incidentes entre {patrones.desde} y {patrones.hasta}, {patrones.con_lesion} con lesión. Los datos no incluyen nombres ni RUT.
                </p>
            </div>

            {predicciones.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <caption className="text-left text-xs text-gris-1 mb-2">
                            Riesgo en {plazoHorizonte(horizonte)} por cliente · {calidad.modelo}
                            {calidad.metricas ? ` · AUC-ROC ${calidad.metricas.auc_roc.toFixed(2)} (${calidad.discriminacion})` : ''}
                        </caption>
                        <thead className="text-xs uppercase tracking-wider text-gris-1 border-b border-verde-3 text-left">
                            <tr>
                                <th scope="col" className="px-3 py-2">Cliente</th>
                                <th scope="col" className="px-3 py-2">Incidente laboral</th>
                                <th scope="col" className="px-3 py-2">Con lesión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-verde-3">
                            {predicciones.map((p) => (
                                <tr key={p.cliente}>
                                    <th scope="row" className="px-3 py-2 text-left font-bold text-gris-2">{p.cliente}</th>
                                    <td className="px-3 py-2 text-gris-2">{porcentaje(p.prob)}</td>
                                    <td className="px-3 py-2 text-gris-2">
                                        {lesionesPorCliente.has(p.cliente) ? porcentaje(lesionesPorCliente.get(p.cliente)!) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {calidad.motivo && <p className="text-xs text-gris-1">{calidad.motivo}</p>}

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <Barras titulo="Por tipo de riesgo" datos={patrones.por_riesgo} />
                <Barras titulo="Por categoría" datos={patrones.por_categoria} />
                <Barras titulo="Por día" datos={patrones.por_dia_semana} />
                <Barras titulo="Por horario" datos={patrones.por_bloque_horario} />
            </div>
            <p className="text-xs text-gris-1">Estos conteos no consideran cuánta gente trabajaba en cada periodo, así que no comparan riesgo por sí solos.</p>
        </section>
    );
}
