import { Fragment, useEffect, useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Download } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { BarraRiesgo, ListaFactores, SelectoresModelo, DetalleRiesgo, AvisoCoherencia, AvisoHorizonte } from '@/components/modelo/Elementos';
import { bandaRiesgo, ESTILO_BANDA, NIVELES_ENTIDAD, porcentaje, useEntidades, useFiltrosModelo,
    type BandaRiesgo, type EntidadRiesgo, plazoHorizonte } from '@/lib/modeloPredictivo';

const POR_PAGINA = 25;
const CAMPO = 'mt-1 block w-full rounded-lg border-verde-3 text-sm text-gris-2';

function parametroInicial(nombre: string): string {
    return new URLSearchParams(window.location.search).get(nombre) ?? '';
}

function descargarCsv(nombre: string, filas: EntidadRiesgo[]) {
    const columnas = ['Nombre', 'Detalle', 'Proyecto', 'Cliente', 'Faena', 'Riesgo', 'Banda', 'Modelo', 'Incidentes 13 semanas', 'Reportes preventivos 13 semanas', 'Pendientes'];
    const celda = (valor: unknown) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
    const contenido = [
        columnas.map(celda).join(';'),
        ...filas.map((f) => [
            f.nombre, f.detalle, f.proyecto, f.cliente, f.faena, porcentaje(f.prob_evento), ESTILO_BANDA[bandaRiesgo(f.prob_evento)].etiqueta, f.modelo,
            f.indicadores?.incidentes_13_semanas, f.indicadores?.reportes_preventivos_13_semanas, f.indicadores?.pendientes_de_cierre,
        ].map(celda).join(';')),
    ].join('\n');
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(new Blob([`﻿${contenido}`], { type: 'text/csv;charset=utf-8' }));
    enlace.download = `riesgo_${nombre}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
}

export default function Entidades() {
    const { tipo, horizonte, tipos, cambiar } = useFiltrosModelo();
    const { datos, cargando, error } = useEntidades(tipo, horizonte);
    const [nivel, setNivel] = useState(parametroInicial('nivel') || 'proyecto');
    const [idProyecto, setIdProyecto] = useState(parametroInicial('id_proyecto'));
    const [cliente, setCliente] = useState('');
    const [buscar, setBuscar] = useState('');
    const [banda, setBanda] = useState<BandaRiesgo | ''>('');
    const [pagina, setPagina] = useState(1);
    const [abierta, setAbierta] = useState<string | null>(null);

    const filasNivel = useMemo(() => datos?.niveles[nivel] ?? [], [datos, nivel]);
    const proyectos = useMemo(() => (datos?.niveles.proyecto ?? []).slice().sort((a, b) => a.nombre.localeCompare(b.nombre)), [datos]);
    const clientes = useMemo(() => [...new Set((datos?.niveles.proyecto ?? []).map((p) => p.cliente).filter(Boolean))].sort() as string[], [datos]);
    const agregado = nivel === 'cliente' || nivel === 'faena';

    const filtradas = useMemo(() => {
        const texto = buscar.trim().toLowerCase();
        return filasNivel.filter((fila) =>
            (agregado || !idProyecto || fila.id_proyecto === Number(idProyecto))
            && (agregado || !cliente || fila.cliente === cliente)
            && (!banda || bandaRiesgo(fila.prob_evento) === banda)
            && (!texto || `${fila.nombre} ${fila.detalle ?? ''} ${fila.proyecto ?? ''}`.toLowerCase().includes(texto)));
    }, [filasNivel, agregado, idProyecto, cliente, banda, buscar]);

    useEffect(() => {
        setPagina(1);
        setAbierta(null);
    }, [nivel, idProyecto, cliente, banda, buscar, tipo, horizonte]);

    const conteoBandas = useMemo(() => {
        const conteo: Record<BandaRiesgo, number> = { alto: 0, medio: 0, bajo: 0 };
        filasNivel.forEach((fila) => { conteo[bandaRiesgo(fila.prob_evento)] += 1; });
        return conteo;
    }, [filasNivel]);

    const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
    const visibles = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
    const info = NIVELES_ENTIDAD.find((n) => n.clave === nivel);
    const calidad = datos?.modelos[nivel];

    return (
        <MainLayout>
            <Head title="Riesgo por entidad | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8 space-y-4">
                <section className="bg-white border border-verde-3 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gris-2">Riesgo por entidad</h1>
                        <p className="text-sm text-gris-1 mt-1">Probabilidad de al menos un evento en {plazoHorizonte(horizonte)}. Alto: 35% o más; medio: 15% a 34%; bajo: menos de 15%.</p>
                    </div>
                    <SelectoresModelo tipo={tipo} horizonte={horizonte} tipos={tipos} cambiar={cambiar} />
                </section>

                <AvisoHorizonte dias={horizonte} />
                <AvisoCoherencia coherencia={datos?.coherencia} />

                {error && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{error}</p>}
                {cargando && <p className="text-sm text-gris-1" role="status">Calculando predicciones. La primera vez puede tardar un par de minutos.</p>}

                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipo de entidad">
                    {NIVELES_ENTIDAD.map((n) => (
                        <button
                            key={n.clave}
                            type="button"
                            role="tab"
                            aria-selected={nivel === n.clave}
                            onClick={() => setNivel(n.clave)}
                            className={`px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${nivel === n.clave ? 'bg-verde-5 border-verde-5 text-black' : 'bg-white border-verde-3 text-gris-1 hover:text-gris-2'}`}
                        >
                            {n.plural} <span className="font-normal">({datos?.niveles[n.clave]?.length ?? 0})</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-3 sm:max-w-md">
                    {(['alto', 'medio', 'bajo'] as BandaRiesgo[]).map((clave) => (
                        <button
                            key={clave}
                            type="button"
                            aria-pressed={banda === clave}
                            onClick={() => setBanda(banda === clave ? '' : clave)}
                            className={`rounded-xl border p-3 text-left bg-white transition-colors ${banda === clave ? 'border-gris-2' : 'border-verde-3 hover:border-gris-1'}`}
                        >
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ESTILO_BANDA[clave].chip}`}>{ESTILO_BANDA[clave].etiqueta}</span>
                            <span className="block text-2xl font-black text-gris-2 mt-1">{conteoBandas[clave]}</span>
                        </button>
                    ))}
                </div>

                <section className="bg-white border border-verde-3 rounded-xl p-4 shadow-sm grid gap-3 md:grid-cols-4 md:items-end">
                    <label className="text-xs font-semibold text-gris-1">
                        Buscar
                        <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Nombre, cargo o cuadrilla" className={CAMPO} />
                    </label>
                    <label className="text-xs font-semibold text-gris-1">
                        Proyecto
                        <select value={idProyecto} onChange={(e) => setIdProyecto(e.target.value)} disabled={agregado} className={`${CAMPO} disabled:opacity-50`}>
                            <option value="">Todos</option>
                            {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </label>
                    <label className="text-xs font-semibold text-gris-1">
                        Cliente
                        <select value={cliente} onChange={(e) => setCliente(e.target.value)} disabled={agregado} className={`${CAMPO} disabled:opacity-50`}>
                            <option value="">Todos</option>
                            {clientes.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>
                    <button
                        type="button"
                        disabled={filtradas.length === 0}
                        onClick={() => descargarCsv(nivel, filtradas)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border border-verde-3 text-gris-2 hover:bg-verde-1 disabled:opacity-50"
                    >
                        <Download className="h-4 w-4" /> Descargar CSV ({filtradas.length})
                    </button>
                </section>

                {calidad && (
                    <p className="text-xs text-gris-1">
                        {calidad.modelo ? `Modelo: ${calidad.modelo}` : 'Sin modelo publicado'}
                        {calidad.metricas ? ` · AUC-ROC ${calidad.metricas.auc_roc.toFixed(2)} (capacidad ${calidad.discriminacion})` : ''}
                        {calidad.motivo ? ` · ${calidad.motivo}` : ''}{' '}
                        <Link href="/modelo-predictivo/calidad" className="font-bold text-verde-6 hover:underline">Ver calidad</Link>
                    </p>
                )}

                <section className="bg-white border border-verde-3 rounded-xl shadow-sm overflow-x-auto">
                    <table className="w-full min-w-[820px] text-sm text-left">
                        <thead className="text-xs uppercase tracking-wider text-gris-1 border-b border-verde-3">
                            <tr>
                                <th scope="col" className="px-4 py-3">{info?.singular}</th>
                                {!agregado && <th scope="col" className="px-4 py-3">Proyecto</th>}
                                <th scope="col" className="px-4 py-3">Riesgo</th>
                                <th scope="col" className="px-4 py-3">Incidentes (13 sem.)</th>
                                <th scope="col" className="px-4 py-3">Preventivos (13 sem.)</th>
                                <th scope="col" className="px-4 py-3"><span className="sr-only">Detalle</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-verde-3">
                            {visibles.map((fila) => {
                                const clave = `${nivel}-${fila.id}-${fila.id_proyecto ?? ''}`;
                                const expandida = abierta === clave;
                                return (
                                    <Fragment key={clave}>
                                        <tr className="align-middle">
                                            <th scope="row" className="px-4 py-3 text-left">
                                                <span className="font-bold text-gris-2">{fila.nombre || `${info?.singular} ${fila.id}`}</span>
                                                {fila.detalle && <span className="block text-xs font-normal text-gris-1">{fila.detalle}</span>}
                                            </th>
                                            {!agregado && (
                                                <td className="px-4 py-3 text-gris-2">
                                                    {fila.proyecto}
                                                    {fila.cliente && <span className="block text-xs text-gris-1">{fila.cliente}</span>}
                                                </td>
                                            )}
                                            <td className="px-4 py-3"><BarraRiesgo probabilidad={fila.prob_evento} /></td>
                                            <td className="px-4 py-3 text-gris-2">{fila.indicadores?.incidentes_13_semanas ?? '—'}</td>
                                            <td className="px-4 py-3 text-gris-2">{fila.indicadores?.reportes_preventivos_13_semanas ?? '—'}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button type="button" aria-expanded={expandida} onClick={() => setAbierta(expandida ? null : clave)} className="text-xs font-bold text-verde-6 hover:underline">
                                                    {expandida ? 'Ocultar' : 'Por qué'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandida && (
                                            <tr>
                                                <td colSpan={agregado ? 5 : 6} className="px-4 pb-4 bg-white">
                                                    <div className="grid gap-4 lg:grid-cols-2">
                                                        <div>
                                                            <p className="text-xs font-bold text-gris-2 mb-2">Qué mueve este riesgo</p>
                                                            <ListaFactores factores={fila.factores} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gris-2 mb-2">Datos</p>
                                                            <DetalleRiesgo registro={{ ...fila.indicadores, modelo: fila.modelo, metodo: fila.metodo, faena: fila.faena }} />
                                                            {fila.id_proyecto && nivel === 'proyecto' && (
                                                                <Link href={`/modelo-predictivo/proyectos/${fila.id_proyecto}/evento-estimado?tipo_objetivo=${encodeURIComponent(tipo)}&horizonte_dias=${horizonte}`} className="inline-block mt-2 text-xs font-bold text-verde-6 hover:underline">
                                                                    Ver próximo evento estimado
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                            {!cargando && visibles.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gris-1">
                                        {filasNivel.length === 0
                                            ? (calidad?.motivo ?? 'No hay predicciones vigentes para este tipo de entidad.')
                                            : 'Ninguna entidad cumple estos filtros.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>

                <div className="flex items-center justify-between text-sm text-gris-1">
                    <span role="status">{filtradas.length} {filtradas.length === 1 ? 'resultado' : 'resultados'}, de mayor a menor riesgo</span>
                    <div className="flex items-center gap-2">
                        <button type="button" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)} className="px-3 py-1.5 rounded-lg border border-verde-3 disabled:opacity-50">Anterior</button>
                        <span>Página {pagina} de {paginas}</span>
                        <button type="button" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)} className="px-3 py-1.5 rounded-lg border border-verde-3 disabled:opacity-50">Siguiente</button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
