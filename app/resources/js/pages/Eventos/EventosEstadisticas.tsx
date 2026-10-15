// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, Line, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import './EventosEstadisticas.css';

// URL de la API de estadísticas de reportes
const API = '/api/eventos/estadisticas';
const HEADERS = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };

// Paleta AVA corporativa
const COLOR = {
  abiertos: '#FF5900',      // naranjo-1
  en_revision: '#FFCB00',   // amarillo-1
  cerrados: '#86CF00',      // verde-6
  creados: '#008DE7',       // azul-1
  backlog: '#F80000',       // rojo-1
  neutro: '#7A7F85',        // gris-1
};

const PREFIJO = {
  area: 'Área', tipo: 'Tipo', proyecto: 'Proyecto', supervisor: 'Supervisor',
  administrador: 'Admin', trabajador: 'Trabajador', condicion: 'Condición',
};
const etiqueta = (dim, clave) => (PREFIJO[dim] ? `${PREFIJO[dim]} ${clave}` : clave);

const nf = (n) => (n == null ? '—' : n);
const pct = (n) => (n == null ? '—' : `${n}%`);
const dias = (n) => (n == null ? '—' : `${n} d`);

/* ------------------------------ hook de datos ------------------------------ */

function useStats(filtros) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    const qs = new URLSearchParams(
      Object.entries(filtros).filter(([, v]) => v !== '' && v != null),
    );
    setCargando(true);
    fetch(`${API}?${qs}`, { signal: ctrl.signal, headers: HEADERS, credentials: 'same-origin' })
      .then((r) => {
        if (!r.ok) throw new Error(`El servidor respondió ${r.status}`);
        return r.json();
      })
      .then((d) => { setData(d); setError(null); })
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => { if (!ctrl.signal.aborted) setCargando(false); });
    return () => ctrl.abort();
  }, [JSON.stringify(filtros)]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, error, cargando };
}

/* ------------------------- componentes base AVA ------------------------- */

function Kpi({ valor, label, color, nota }) {
  return (
    <div
      className="bg-white border border-verde-3 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
      style={color ? { borderLeft: `5px solid ${color}` } : { borderLeft: '5px solid #2D3238' }}
    >
      <div>
        <span className="text-2xl sm:text-3xl font-black text-gris-2 tracking-tight block">
          {valor}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-gris-1 font-bold mt-1 block">
          {label}
        </span>
      </div>
      {nota && (
        <span className="text-[11px] text-gris-1 font-medium mt-2 pt-1.5 border-t border-verde-3/40 block">
          {nota}
        </span>
      )}
    </div>
  );
}

function Panel({ titulo, children, ancho }) {
  return (
    <section className={`bg-white border border-verde-3 rounded-2xl p-5 sm:p-6 shadow-sm mb-6 ${ancho === 'completo' ? 'w-full' : ''}`}>
      {titulo && (
        <h3 className="text-base sm:text-lg font-bold text-gris-2 mb-4 pb-2 border-b border-verde-3/40 flex items-center justify-between">
          <span>{titulo}</span>
        </h3>
      )}
      {children}
    </section>
  );
}

function EstadoChip({ estado }) {
  const st = (estado || '').toLowerCase();
  if (st === 'cerrado' || st === 'cerrada') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-verde-5/20 text-verde-6 border border-verde-5/40">
        Cerrado
      </span>
    );
  }
  if (st === 'en_revision' || st === 'proceso') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amarillo-1/15 text-amarillo-1 border border-amarillo-1/40">
        En revisión
      </span>
    );
  }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-naranjo-1/10 text-naranjo-1 border border-naranjo-1/30">
      Abierto
    </span>
  );
}

function Tabla({ columnas, filas }) {
  if (!filas || filas.length === 0) {
    return (
      <div className="p-8 text-center text-gris-1 text-sm bg-verde-1/30 rounded-xl border border-dashed border-verde-3">
        No hay registros disponibles.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-verde-3">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead className="bg-verde-2 text-[11px] uppercase tracking-wider text-gris-1 font-bold border-b border-verde-3">
          <tr>
            {columnas.map((c) => (
              <th key={c.titulo} className={`px-4 py-3 ${c.num ? 'text-right' : 'text-left'}`}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-verde-3/60 bg-white">
          {filas.map((f, i) => (
            <tr key={i} className="hover:bg-verde-1/60 transition-colors">
              {columnas.map((c) => (
                <td key={c.titulo} className={`px-4 py-3 text-gris-2 ${c.num ? 'text-right tabular-nums font-medium' : 'text-left'}`}>
                  {c.celda(f)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Grafico = ({ alto = 260, children }) => (
  <div style={{ width: '100%', height: alto }} className="w-full min-h-[200px]">
    <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
  </div>
);

const ejes = { stroke: '#7A7F85', fontSize: 11, tickLine: false, axisLine: false };

const tooltipProps = {
  contentStyle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DBE0D5',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#2D3238',
  },
  cursor: { fill: '#F3FAEC', opacity: 0.8 },
};

/* ------------------------------ pestañas ------------------------------ */

function Resumen({ d }) {
  const r = d.resumen;
  const pie = [
    { name: 'Abierto', value: r.abiertos, color: COLOR.abiertos },
    { name: 'En revisión', value: r.en_revision, color: COLOR.en_revision },
    { name: 'Cerrado', value: r.cerrados, color: COLOR.cerrados },
  ];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 mb-6">
        <Kpi valor={r.total} label="Reportes Totales" />
        <Kpi valor={r.abiertos} label="Abiertos" color={COLOR.abiertos} nota={pct(r.pct_abiertos)} />
        <Kpi valor={r.en_revision} label="En revisión" color={COLOR.en_revision} nota={pct(r.pct_en_revision)} />
        <Kpi valor={r.cerrados} label="Cerrados" color={COLOR.cerrados} nota={`Tasa de cierre ${pct(r.tasa_cierre)}`} />
        <Kpi valor={r.pendientes_mas_90d} label="Pendientes > 90 días" color={COLOR.abiertos} />
        <Kpi valor={r.pendientes_sin_actualizar_30d} label="Sin cambios en 30 días" color={COLOR.en_revision} />
        <Kpi valor={r.creados_30d} label="Creados en 30 días" nota={`${r.cerrados_30d} cerrados`} />
        <Kpi valor={r.balance_30d > 0 ? `+${r.balance_30d}` : r.balance_30d} label="Balance de 30 días" nota={r.balance_30d > 0 ? 'Entran más de los que se cierran' : 'Se cierran más de los que entran'} />
        <Kpi valor={dias(r.dias_cierre_mediana)} label="Mediana de cierre" nota={`Promedio ${dias(r.dias_cierre_promedio)}`} />
        <Kpi valor={r.eventos_por_semana} label="Reportes por semana" nota={`${r.eventos_por_mes} por mes`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Panel titulo="Estado de los reportes">
          <Grafico alto={280}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={3}>
                {pie.map((p) => <Cell key={p.name} fill={p.color} />)}
              </Pie>
              <Tooltip {...tooltipProps} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            </PieChart>
          </Grafico>
        </Panel>

        <Panel titulo="Lo que más destaca">
          <ul className="divide-y divide-verde-3/60">
            {d.destacados.map((x) => (
              <li key={x.titulo} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-gris-1 font-bold">{x.titulo}</span>
                <div className="flex items-center justify-between gap-4">
                  <strong className="text-sm font-bold text-gris-2">{etiqueta(x.dimension, x.clave)}</strong>
                  <span className="text-xs text-gris-1 font-medium">{x.texto}</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel titulo="Comparativas entre períodos" ancho="completo">
        <Tabla
          columnas={[
            { titulo: 'Período', celda: (f) => <span className="font-semibold">{f.periodo}</span> },
            { titulo: 'Creados', num: true, celda: (f) => `${f.actual.creados} (antes ${f.anterior.creados})` },
            {
              titulo: 'Variación Creados',
              num: true,
              celda: (f) => (
                <span className={`font-bold ${f.var_creados_pct > 0 ? 'text-rojo-1' : f.var_creados_pct < 0 ? 'text-verde-6' : 'text-gris-1'}`}>
                  {pct(f.var_creados_pct)}
                </span>
              ),
            },
            { titulo: 'Cerrados', num: true, celda: (f) => `${f.actual.cerrados} (antes ${f.anterior.cerrados})` },
            {
              titulo: 'Variación Cerrados',
              num: true,
              celda: (f) => (
                <span className={`font-bold ${f.var_cerrados_pct > 0 ? 'text-verde-6' : f.var_cerrados_pct < 0 ? 'text-rojo-1' : 'text-gris-1'}`}>
                  {pct(f.var_cerrados_pct)}
                </span>
              ),
            },
          ]}
          filas={d.tendencias.comparativas}
        />
      </Panel>
    </>
  );
}

function Tendencias({ d }) {
  const t = d.tendencias;
  const p = t.proyeccion;
  return (
    <>
      <Panel titulo="Reportes creados, cerrados y pendientes al cierre de cada mes" ancho="completo">
        <Grafico alto={320}>
          <ComposedChart data={t.por_mes}>
            <CartesianGrid stroke="#DBE0D5" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mes" {...ejes} />
            <YAxis {...ejes} />
            <Tooltip {...tooltipProps} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="creados" name="Creados" fill={COLOR.creados} radius={[4, 4, 0, 0]} />
            <Bar dataKey="cerrados" name="Cerrados" fill={COLOR.cerrados} radius={[4, 4, 0, 0]} />
            <Line dataKey="backlog_fin_mes" name="Pendientes a fin de mes" stroke={COLOR.backlog} strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </Grafico>
        <div className="mt-4 p-3.5 bg-verde-1 border border-verde-3/60 rounded-xl text-xs text-gris-2 font-medium flex items-start gap-2">
          <svg className="w-4 h-4 text-verde-6 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Al ritmo de los últimos 3 meses entran <strong>{p.promedio_creados_mes_3m}</strong> y se cierran <strong>{p.promedio_cerrados_mes_3m}</strong> reportes por mes
            {p.backlog_crece ? ': el backlog sigue creciendo.' : '.'}
            {p.meses_para_vaciar_backlog != null && ` Vaciar los pendientes tomaría ${p.meses_para_vaciar_backlog} meses sin nuevos ingresos.`}
          </span>
        </div>
      </Panel>

      <Panel titulo="Últimos 30 días" ancho="completo">
        <Grafico alto={260}>
          <ComposedChart data={t.por_dia_ultimos_30}>
            <CartesianGrid stroke="#DBE0D5" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="fecha" tickFormatter={(v) => v.slice(5)} {...ejes} />
            <YAxis allowDecimals={false} {...ejes} />
            <Tooltip {...tooltipProps} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="creados" name="Creados" fill={COLOR.creados} radius={[3, 3, 0, 0]} />
            <Bar dataKey="cerrados" name="Cerrados" fill={COLOR.cerrados} radius={[3, 3, 0, 0]} />
            <Line dataKey="media_movil_7d" name="Media móvil de 7 días" stroke={COLOR.backlog} dot={false} strokeWidth={2} />
          </ComposedChart>
        </Grafico>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Panel titulo="Reportes por día de la semana">
          <Grafico alto={220}>
            <BarChart data={t.por_dia_semana}>
              <CartesianGrid stroke="#DBE0D5" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dia" tickFormatter={(v) => v.slice(0, 3)} {...ejes} />
              <YAxis allowDecimals={false} {...ejes} />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="creados" name="Creados" fill={COLOR.creados} radius={[4, 4, 0, 0]} />
            </BarChart>
          </Grafico>
        </Panel>
        <Panel titulo="Reportes por hora del día">
          <Grafico alto={220}>
            <BarChart data={t.por_hora}>
              <CartesianGrid stroke="#DBE0D5" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hora" {...ejes} />
              <YAxis allowDecimals={false} {...ejes} />
              <Tooltip {...tooltipProps} labelFormatter={(h) => `${h}:00`} />
              <Bar dataKey="creados" name="Creados" fill={COLOR.neutro} radius={[4, 4, 0, 0]} />
            </BarChart>
          </Grafico>
        </Panel>
      </div>
    </>
  );
}

const DIMENSIONES = [
  ['tipo', 'Tipo de reporte'],
  ['area', 'Área'],
  ['proyecto', 'Proyecto'],
  ['condicion', 'Condición'],
  ['supervisor', 'Supervisor'],
  ['administrador', 'Administrador'],
  ['severidad', 'Severidad'],
  ['categoria', 'Categoría del hallazgo'],
];

function Distribucion({ d }) {
  const [dim, setDim] = useState('area');
  const filas = dim === 'categoria' ? d.hallazgos.por_categoria : d.distribuciones[dim];
  const datos = filas.map((f) => ({ ...f, nombre: etiqueta(dim, f.clave) }));

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Dimensión">
        {DIMENSIONES.map(([k, n]) => {
          const activo = dim === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setDim(k)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activo
                  ? 'bg-gris-2 text-white shadow-sm'
                  : 'bg-verde-1 border border-verde-3 text-gris-2 hover:bg-verde-2'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>

      <Panel titulo="Estado de los reportes según la dimensión elegida" ancho="completo">
        <Grafico alto={Math.max(240, datos.length * 38 + 60)}>
          <BarChart data={datos} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid stroke="#DBE0D5" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} {...ejes} />
            <YAxis type="category" dataKey="nombre" width={140} {...ejes} />
            <Tooltip {...tooltipProps} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="abiertos" name="Abiertos" stackId="e" fill={COLOR.abiertos} radius={[0, 0, 0, 0]} />
            <Bar dataKey="en_revision" name="En revisión" stackId="e" fill={COLOR.en_revision} radius={[0, 0, 0, 0]} />
            <Bar dataKey="cerrados" name="Cerrados" stackId="e" fill={COLOR.cerrados} radius={[0, 4, 4, 0]} />
          </BarChart>
        </Grafico>
      </Panel>

      <Panel titulo="Detalle" ancho="completo">
        <Tabla
          columnas={[
            { titulo: 'Grupo', celda: (f) => <span className="font-bold">{etiqueta(dim, f.clave)}</span> },
            { titulo: 'Reportes', num: true, celda: (f) => f.total },
            { titulo: '% del total', num: true, celda: (f) => pct(f.pct_del_total) },
            { titulo: 'Pendientes', num: true, celda: (f) => f.pendientes },
            {
              titulo: 'Tasa de cierre',
              num: true,
              celda: (f) => (
                <span className={`font-bold ${f.tasa_cierre >= 75 ? 'text-verde-6' : f.tasa_cierre >= 40 ? 'text-amarillo-1' : 'text-rojo-1'}`}>
                  {pct(f.tasa_cierre)}
                </span>
              ),
            },
            { titulo: 'Días prom. cierre', num: true, celda: (f) => nf(f.dias_prom_cierre) },
            { titulo: 'Edad prom. pendientes', num: true, celda: (f) => dias(f.edad_prom_pendientes) },
          ]}
          filas={filas}
        />
      </Panel>
    </>
  );
}

function Tiempos({ d }) {
  const t = d.tiempos;
  const a = d.aging;
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 mb-6">
        <Kpi valor={dias(t.global.mediana)} label="Mediana de cierre" />
        <Kpi valor={dias(t.global.promedio)} label="Promedio de cierre" />
        <Kpi valor={dias(t.global.p90)} label="El 90% se cierra en" />
        <Kpi valor={pct(t.sla.pct)} label={`Cerrados ≤ ${t.sla.dias} días`} color={COLOR.cerrados} />
        <Kpi valor={dias(a.edad.mediana)} label="Mediana edad pendientes" color={COLOR.abiertos} />
        <Kpi valor={a.estancados.total} label={`Sin cambios en ${a.estancados.umbral_dias}d`} color={COLOR.en_revision} nota={pct(a.estancados.pct_de_pendientes)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Panel titulo="¿Cuánto tardan en cerrarse?">
          <Grafico alto={240}>
            <BarChart data={t.distribucion}>
              <CartesianGrid stroke="#DBE0D5" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="rango" {...ejes} interval={0} fontSize={10} />
              <YAxis allowDecimals={false} {...ejes} />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="total" name="Reportes" fill={COLOR.cerrados} radius={[4, 4, 0, 0]} />
            </BarChart>
          </Grafico>
        </Panel>
        <Panel titulo="¿Qué antigüedad tienen los pendientes?">
          <Grafico alto={240}>
            <BarChart data={a.distribucion}>
              <CartesianGrid stroke="#DBE0D5" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="rango" {...ejes} interval={0} fontSize={10} />
              <YAxis allowDecimals={false} {...ejes} />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="total" name="Reportes" fill={COLOR.abiertos} radius={[4, 4, 0, 0]} />
            </BarChart>
          </Grafico>
        </Panel>
      </div>

      <Panel titulo="Los 10 pendientes más antiguos" ancho="completo">
        <Tabla
          columnas={[
            { titulo: 'Ref.', celda: (f) => <span className="font-bold text-gris-2">{f.referencia ?? `#${f.id_evento}`}</span> },
            { titulo: 'Descripción', celda: (f) => <span className="line-clamp-2 max-w-md">{f.descripcion}</span> },
            { titulo: 'Área', celda: (f) => (f.id_area ? `Área ${f.id_area}` : '—') },
            { titulo: 'Estado', celda: (f) => <EstadoChip estado={f.estado} /> },
            { titulo: 'Antigüedad', num: true, celda: (f) => dias(f.edad_dias) },
            { titulo: 'Sin cambios', num: true, celda: (f) => dias(f.dias_sin_actualizar) },
          ]}
          filas={a.mas_antiguos}
        />
      </Panel>

      <Panel titulo="Tiempo de cierre por área" ancho="completo">
        <Tabla
          columnas={[
            { titulo: 'Área', celda: (f) => <span className="font-semibold">{etiqueta('area', f.clave)}</span> },
            { titulo: 'Cerrados', num: true, celda: (f) => f.n },
            { titulo: 'Promedio', num: true, celda: (f) => dias(f.promedio) },
            { titulo: 'Mediana', num: true, celda: (f) => dias(f.mediana) },
            { titulo: 'P90', num: true, celda: (f) => dias(f.p90) },
            { titulo: 'Máximo', num: true, celda: (f) => dias(f.max) },
          ]}
          filas={t.por_area}
        />
      </Panel>
    </>
  );
}

function Trabajadores({ d }) {
  const t = d.trabajadores;
  const datos = t.ranking.map((f) => ({ ...f, nombre: etiqueta('trabajador', f.clave) }));
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <Kpi valor={t.resumen.trabajadores_distintos} label="Trabajadores con reportes" />
        <Kpi valor={t.resumen.promedio_eventos_por_trabajador} label="Reportes por trabajador" />
        <Kpi valor={t.resumen.eventos_con_varios_trabajadores} label="Varios trabajadores" />
        <Kpi valor={t.resumen.eventos_sin_trabajador} label="Sin trabajador" />
      </div>

      <Panel titulo="Reportes por trabajador" ancho="completo">
        <Grafico alto={Math.max(240, datos.length * 40 + 60)}>
          <BarChart data={datos} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid stroke="#DBE0D5" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} {...ejes} />
            <YAxis type="category" dataKey="nombre" width={120} {...ejes} />
            <Tooltip {...tooltipProps} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="abiertos" name="Abiertos" stackId="e" fill={COLOR.abiertos} radius={[0, 0, 0, 0]} />
            <Bar dataKey="en_revision" name="En revisión" stackId="e" fill={COLOR.en_revision} radius={[0, 0, 0, 0]} />
            <Bar dataKey="cerrados" name="Cerrados" stackId="e" fill={COLOR.cerrados} radius={[0, 4, 4, 0]} />
          </BarChart>
        </Grafico>
      </Panel>

      <Panel titulo="Detalle por trabajador" ancho="completo">
        <Tabla
          columnas={[
            { titulo: 'Trabajador', celda: (f) => <span className="font-bold">{etiqueta('trabajador', f.clave)}</span> },
            { titulo: 'Reportes', num: true, celda: (f) => f.total },
            { titulo: 'Pendientes', num: true, celda: (f) => f.pendientes },
            {
              titulo: 'Tasa de cierre',
              num: true,
              celda: (f) => (
                <span className={`font-bold ${f.tasa_cierre >= 75 ? 'text-verde-6' : f.tasa_cierre >= 40 ? 'text-amarillo-1' : 'text-rojo-1'}`}>
                  {pct(f.tasa_cierre)}
                </span>
              ),
            },
            { titulo: 'Días prom. cierre', num: true, celda: (f) => nf(f.dias_prom_cierre) },
            { titulo: 'Tipo más frecuente', celda: (f) => (f.tipo_mas_frecuente ? `Tipo ${f.tipo_mas_frecuente.clave} (${f.tipo_mas_frecuente.total})` : '—') },
            { titulo: 'Área más frecuente', celda: (f) => (f.area_mas_frecuente ? `Área ${f.area_mas_frecuente.clave} (${f.area_mas_frecuente.total})` : '—') },
          ]}
          filas={t.ranking}
        />
      </Panel>
    </>
  );
}

function Hallazgos({ d }) {
  const h = d.hallazgos;
  return (
    <>
      <Panel titulo="Reportes por categoría de hallazgo" ancho="completo">
        <Grafico alto={Math.max(240, h.por_categoria.length * 38 + 60)}>
          <BarChart data={h.por_categoria} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid stroke="#DBE0D5" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} {...ejes} />
            <YAxis type="category" dataKey="clave" width={180} {...ejes} />
            <Tooltip {...tooltipProps} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="abiertos" name="Abiertos" stackId="e" fill={COLOR.abiertos} radius={[0, 0, 0, 0]} />
            <Bar dataKey="en_revision" name="En revisión" stackId="e" fill={COLOR.en_revision} radius={[0, 0, 0, 0]} />
            <Bar dataKey="cerrados" name="Cerrados" stackId="e" fill={COLOR.cerrados} radius={[0, 4, 4, 0]} />
          </BarChart>
        </Grafico>
      </Panel>

      <Panel titulo={`Hallazgos más repetidos (${h.descripciones_distintas} distintos)`} ancho="completo">
        <Tabla
          columnas={[
            { titulo: 'Descripción del hallazgo', celda: (f) => <span className="font-semibold text-gris-2">{f.clave}</span> },
            { titulo: 'Veces', num: true, celda: (f) => f.total },
            { titulo: 'Acumulado', num: true, celda: (f) => pct(f.acumulado_pct) },
            { titulo: 'Pendientes', num: true, celda: (f) => f.pendientes },
            {
              titulo: 'Tasa de cierre',
              num: true,
              celda: (f) => (
                <span className={`font-bold ${f.tasa_cierre >= 75 ? 'text-verde-6' : f.tasa_cierre >= 40 ? 'text-amarillo-1' : 'text-rojo-1'}`}>
                  {pct(f.tasa_cierre)}
                </span>
              ),
            },
          ]}
          filas={h.por_descripcion.slice(0, 15)}
        />
      </Panel>
    </>
  );
}

function Calidad({ d }) {
  const c = d.calidad_datos;
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <Kpi valor={pct(c.completitud_pct)} label="Completitud de datos" color={COLOR.cerrados} />
        <Kpi valor={pct(d.cierre.con_justificacion_pct)} label="Cerrados con justificación" />
        <Kpi valor={pct(d.cierre.con_evidencia_cierre_pct)} label="Cerrados con evidencia" />
        <Kpi valor={pct(d.cierre.con_fecha_cierre_pct)} label="Cerrados con fecha cierre" />
      </div>

      {c.avisos.map((a) => (
        <div key={a} className="bg-amarillo-1/10 border-l-4 border-amarillo-1 text-gris-2 p-3.5 rounded-r-xl text-xs sm:text-sm font-medium mb-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-amarillo-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{a}</span>
        </div>
      ))}

      <Panel titulo="Revisión de la calidad de los datos" ancho="completo">
        <ul className="space-y-4">
          {c.chequeos.map((x) => {
            const ok = x.total === 0;
            return (
              <li key={x.id} className="bg-verde-1/50 border border-verde-3/60 rounded-xl p-3.5">
                <div className="flex justify-between items-center gap-2 mb-1.5">
                  <strong className="text-xs font-bold text-gris-2">{x.etiqueta}</strong>
                  <span className={`text-xs font-bold ${ok ? 'text-verde-6' : 'text-naranjo-1'}`}>
                    {x.total} reportes ({pct(x.pct)})
                  </span>
                </div>
                <div className="h-2 bg-verde-2 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all ${ok ? 'bg-verde-6' : 'bg-naranjo-1'}`}
                    style={{ width: `${Math.min(100, Math.max(x.pct > 0 ? 3 : 0, x.pct))}%` }}
                  />
                </div>
                {x.total > 0 && (
                  <p className="text-[11px] text-gris-1">
                    Por ejemplo: {x.ejemplos.slice(0, 8).map((i) => `#${i}`).join(', ')}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}

const TABS = [
  ['resumen', 'Resumen', Resumen],
  ['tendencias', 'Tendencias', Tendencias],
  ['distribucion', 'Distribución', Distribucion],
  ['tiempos', 'Tiempos y antigüedad', Tiempos],
  ['trabajadores', 'Trabajadores', Trabajadores],
  ['hallazgos', 'Hallazgos', Hallazgos],
  ['calidad', 'Calidad de datos', Calidad],
];

/* ------------------------------ página principal ------------------------------ */

export default function EventosEstadisticas() {
  const [tab, setTab] = useState('resumen');
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', id_area: '', id_proyecto: '', id_tipo_evento: '' });
  const { data, error, cargando } = useStats(filtros);

  // Opciones de los filtros obtenidas en la primera carga
  const opciones = useRef(null);
  if (data && !opciones.current) {
    opciones.current = {
      areas: (data.distribuciones?.area || []).map((x) => x.clave).sort((a, b) => a - b),
      proyectos: (data.distribuciones?.proyecto || []).map((x) => x.clave).sort((a, b) => a - b),
      tipos: (data.distribuciones?.tipo || []).map((x) => x.clave).sort((a, b) => a - b),
    };
  }

  const set = (k) => (e) => setFiltros((f) => ({ ...f, [k]: e.target.value }));
  const Activa = TABS.find(([k]) => k === tab)[2];
  const op = opciones.current;
  const tieneFiltros = Object.values(filtros).some((v) => v !== '');

  return (
    <MainLayout>
      <Head title="Estadísticas de Reportes | AVA" />

      <div className="max-w-[1700px] mx-auto p-6 lg:p-8 flex flex-col h-full min-h-[calc(100vh-80px)]">
        {/* Cabecera y Filtros */}
        <div className="mb-6 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gris-2 mb-1">Estadísticas de Reportes</h1>
              <span className="bg-verde-2 border border-verde-3 text-verde-6 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Métricas AVA
              </span>
            </div>
            <p className="text-gris-1 text-sm">
              {data ? `${data.meta.total_eventos} reportes analizados` : 'Cargando estadísticas...'}
            </p>
          </div>

          {/* Barra de Filtros */}
          <form
            className="w-full 2xl:w-auto bg-white border border-verde-3 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-wrap items-end gap-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex flex-col">
              <label className="text-[10px] uppercase text-gris-1 font-bold tracking-wider mb-1">Desde</label>
              <input
                type="date"
                value={filtros.desde}
                onChange={set('desde')}
                className="bg-verde-1 border border-verde-3 rounded-lg px-2.5 py-1.5 text-xs text-gris-2 font-medium focus:outline-none focus:border-verde-5 cursor-pointer"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] uppercase text-gris-1 font-bold tracking-wider mb-1">Hasta</label>
              <input
                type="date"
                value={filtros.hasta}
                onChange={set('hasta')}
                className="bg-verde-1 border border-verde-3 rounded-lg px-2.5 py-1.5 text-xs text-gris-2 font-medium focus:outline-none focus:border-verde-5 cursor-pointer"
              />
            </div>

            {op && (
              <>
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase text-gris-1 font-bold tracking-wider mb-1">Área</label>
                  <select
                    value={filtros.id_area}
                    onChange={set('id_area')}
                    className="bg-verde-1 border border-verde-3 rounded-lg px-2.5 py-1.5 text-xs text-gris-2 font-medium focus:outline-none focus:border-verde-5 cursor-pointer min-w-[110px]"
                  >
                    <option value="">Todas</option>
                    {op.areas.map((a) => <option key={a} value={a}>Área {a}</option>)}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] uppercase text-gris-1 font-bold tracking-wider mb-1">Proyecto</label>
                  <select
                    value={filtros.id_proyecto}
                    onChange={set('id_proyecto')}
                    className="bg-verde-1 border border-verde-3 rounded-lg px-2.5 py-1.5 text-xs text-gris-2 font-medium focus:outline-none focus:border-verde-5 cursor-pointer min-w-[120px]"
                  >
                    <option value="">Todos</option>
                    {op.proyectos.map((a) => <option key={a} value={a}>Proyecto {a}</option>)}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] uppercase text-gris-1 font-bold tracking-wider mb-1">Tipo</label>
                  <select
                    value={filtros.id_tipo_evento}
                    onChange={set('id_tipo_evento')}
                    className="bg-verde-1 border border-verde-3 rounded-lg px-2.5 py-1.5 text-xs text-gris-2 font-medium focus:outline-none focus:border-verde-5 cursor-pointer min-w-[110px]"
                  >
                    <option value="">Todos</option>
                    {op.tipos.map((a) => <option key={a} value={a}>Tipo {a}</option>)}
                  </select>
                </div>
              </>
            )}

            {tieneFiltros && (
              <button
                type="button"
                onClick={() => setFiltros({ desde: '', hasta: '', id_area: '', id_proyecto: '', id_tipo_evento: '' })}
                className="px-3 py-1.5 text-rojo-1 bg-rojo-1/10 hover:bg-rojo-1 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 self-end"
                title="Quitar filtros"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar
              </button>
            )}
          </form>
        </div>

        {/* Pestañas de Navegación AVA */}
        <nav className="flex flex-wrap gap-2 mb-6 border-b border-verde-3 pb-3 shrink-0" aria-label="Secciones de Estadísticas">
          {TABS.map(([k, n]) => {
            const activo = tab === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activo
                    ? 'bg-verde-5 text-black shadow-sm font-extrabold'
                    : 'bg-white border border-verde-3 text-gris-1 hover:text-gris-2 hover:bg-verde-2'
                }`}
              >
                {n}
              </button>
            );
          })}
        </nav>

        {/* Contenido Principal con animación suave de carga */}
        <div className={`flex-1 transition-opacity duration-200 ${cargando ? 'opacity-60 pointer-events-none' : 'opacity-100'}`} aria-busy={cargando}>
          {error && (
            <div className="bg-rojo-1/10 border-l-4 border-rojo-1 text-rojo-1 p-4 rounded-r-xl text-sm font-semibold mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 text-rojo-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>No se pudieron cargar las estadísticas: {error}. Revisa tu conexión o sesión y vuelve a intentar.</span>
            </div>
          )}

          {data && data.meta?.total_eventos === 0 && (
            <div className="bg-amarillo-1/10 border border-amarillo-1/30 text-gris-2 p-6 rounded-2xl text-center my-8">
              <p className="font-bold text-base mb-1">No hay reportes registrados para los filtros seleccionados.</p>
              <p className="text-xs text-gris-1">Prueba ampliando el rango de fechas o seleccionando otras áreas/proyectos.</p>
            </div>
          )}

          {data && data.resumen && <Activa d={data} />}
        </div>
      </div>
    </MainLayout>
  );
}
