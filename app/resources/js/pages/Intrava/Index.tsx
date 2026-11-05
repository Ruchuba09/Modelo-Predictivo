import { FormEvent, useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { useReportesIntrava } from '@/hooks/useReportesIntrava';
import type { IntravaReport, IntravaReportFilters, IntravaReportKind } from '@/api/intravaApi';

interface Columna {
    titulo: string;
    valor: (r: IntravaReport) => unknown;
}

const fecha = (valor: unknown) => (typeof valor === 'string' ? valor.slice(0, 10) : '—');
const proyecto: Columna = {
    titulo: 'Proyecto',
    valor: (r) => r.proyecto_local?.nombre ?? r.proyecto_alias ?? 'Sin proyecto local',
};

const FUENTES: Record<IntravaReportKind, { titulo: string; fechas: boolean; estado: boolean; columnas: Columna[] }> = {
    previene: {
        titulo: 'Reporte Previene',
        fechas: true,
        estado: true,
        columnas: [
            { titulo: 'Fecha', valor: (r) => fecha(r.fecha) },
            proyecto,
            { titulo: 'Área', valor: (r) => r.area },
            { titulo: 'Descripción', valor: (r) => r.descripcion },
            { titulo: 'Urgencia', valor: (r) => r.urgencia },
            { titulo: 'Estado', valor: (r) => r.estado },
        ],
    },
    flash: {
        titulo: 'Reportes Flash',
        fechas: true,
        estado: false,
        columnas: [
            { titulo: 'Fecha', valor: (r) => fecha(r.fecha) },
            proyecto,
            { titulo: 'Área', valor: (r) => r.area },
            { titulo: 'Turno', valor: (r) => r.turno },
            { titulo: 'Clasificación', valor: (r) => r.clasificacion },
            { titulo: 'Descripción', valor: (r) => r.descripcion },
        ],
    },
    investigaciones: {
        titulo: 'Investigaciones',
        fechas: false,
        estado: false,
        columnas: [
            { titulo: 'N° Intrava', valor: (r) => r.id_intrava },
            { titulo: 'Reporte Flash', valor: (r) => r.id_reporte_flash_intrava },
            proyecto,
            { titulo: 'Causa raíz', valor: (r) => r.causa_raiz },
        ],
    },
    hallazgos: {
        titulo: 'Hallazgos',
        fechas: true,
        estado: true,
        columnas: [
            { titulo: 'Detección', valor: (r) => fecha(r.fecha_deteccion ?? r.fecha_creacion) },
            proyecto,
            { titulo: 'Tipo', valor: (r) => r.tipo },
            { titulo: 'Origen', valor: (r) => r.origen },
            { titulo: 'Cierre', valor: (r) => fecha(r.fecha_cierre) },
            { titulo: 'Estado', valor: (r) => r.estado },
        ],
    },
};

const FILTROS_VACIOS = { buscar: '', desde: '', hasta: '', estado: '' };
const CAMPO = 'mt-1 block w-full rounded-lg border-verde-3 text-sm text-gris-2';

export default function Index() {
    const [fuente, setFuente] = useState<IntravaReportKind>('previene');
    const [borrador, setBorrador] = useState(FILTROS_VACIOS);
    const [filtros, setFiltros] = useState<IntravaReportFilters>({ page: 1 });
    const { result, loading, error } = useReportesIntrava(fuente, filtros);
    const config = FUENTES[fuente];

    const cambiarFuente = (nueva: IntravaReportKind) => {
        setFuente(nueva);
        setBorrador(FILTROS_VACIOS);
        setFiltros({ page: 1 });
    };

    const aplicar = (e: FormEvent) => {
        e.preventDefault();
        const activos = Object.fromEntries(Object.entries(borrador).filter(([, valor]) => valor !== ''));
        setFiltros({ ...activos, page: 1 });
    };

    const pagina = result?.meta.current_page ?? 1;
    const ultima = result?.meta.last_page ?? 1;

    return (
        <MainLayout>
            <Head title="Fuentes Intrava | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8 space-y-4">
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Fuente de datos">
                    {(Object.keys(FUENTES) as IntravaReportKind[]).map((clave) => (
                        <button
                            key={clave}
                            type="button"
                            role="tab"
                            aria-selected={fuente === clave}
                            onClick={() => cambiarFuente(clave)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                                fuente === clave
                                    ? 'bg-verde-5 border-verde-5 text-black'
                                    : 'bg-white border-verde-3 text-gris-1 hover:text-gris-2'
                            }`}
                        >
                            {FUENTES[clave].titulo}
                        </button>
                    ))}
                </div>

                <form onSubmit={aplicar} className="bg-white border border-verde-3 rounded-xl p-4 shadow-sm grid gap-3 md:grid-cols-5 md:items-end">
                    <label className="text-xs font-semibold text-gris-1 md:col-span-2">
                        Buscar
                        <input
                            value={borrador.buscar}
                            onChange={(e) => setBorrador({ ...borrador, buscar: e.target.value })}
                            className={CAMPO}
                        />
                    </label>
                    {config.fechas && (
                        <>
                            <label className="text-xs font-semibold text-gris-1">
                                Desde
                                <input type="date" value={borrador.desde} onChange={(e) => setBorrador({ ...borrador, desde: e.target.value })} className={CAMPO} />
                            </label>
                            <label className="text-xs font-semibold text-gris-1">
                                Hasta
                                <input type="date" value={borrador.hasta} onChange={(e) => setBorrador({ ...borrador, hasta: e.target.value })} className={CAMPO} />
                            </label>
                        </>
                    )}
                    {config.estado && (
                        <label className="text-xs font-semibold text-gris-1">
                            Estado
                            <input value={borrador.estado} onChange={(e) => setBorrador({ ...borrador, estado: e.target.value })} className={CAMPO} />
                        </label>
                    )}
                    <button type="submit" className="px-4 py-2 rounded-lg text-sm font-bold bg-verde-5 hover:bg-verde-6 text-black md:col-start-5">
                        Filtrar
                    </button>
                </form>

                {error && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{error}</p>}

                <div className="bg-white border border-verde-3 rounded-xl shadow-sm overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase tracking-wider text-gris-1 border-b border-verde-3">
                            <tr>
                                {config.columnas.map((c) => <th key={c.titulo} scope="col" className="px-4 py-3">{c.titulo}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-verde-3">
                            {result?.data.map((reporte) => (
                                <tr key={String(reporte.id_local ?? reporte.id_intrava)} className="text-gris-2 align-top">
                                    {config.columnas.map((c) => (
                                        <td key={c.titulo} className="px-4 py-3">{String(c.valor(reporte) ?? '—')}</td>
                                    ))}
                                </tr>
                            ))}
                            {!loading && result?.data.length === 0 && (
                                <tr>
                                    <td colSpan={config.columnas.length} className="px-4 py-8 text-center text-gris-1">
                                        No hay registros con estos filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between text-sm text-gris-1">
                    <span role="status">{loading ? 'Cargando...' : `${result?.meta.total ?? 0} registros`}</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={loading || pagina <= 1}
                            onClick={() => setFiltros({ ...filtros, page: pagina - 1 })}
                            className="px-3 py-1.5 rounded-lg border border-verde-3 disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span>Página {pagina} de {ultima}</span>
                        <button
                            type="button"
                            disabled={loading || pagina >= ultima}
                            onClick={() => setFiltros({ ...filtros, page: pagina + 1 })}
                            className="px-3 py-1.5 rounded-lg border border-verde-3 disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
