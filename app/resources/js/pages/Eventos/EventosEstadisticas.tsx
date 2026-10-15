import { useEffect, useRef, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, Line, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import './EventosEstadisticas.css';

// Ajusta la URL (y agrega el token si usas Sanctum/JWT en HEADERS).
const API = '/api/eventos/estadisticas';
const HEADERS = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };

const COLOR = {
  abiertos: '#C8501E',
  en_revision: '#D99A1F',
  cerrados: '#2E7D6B',
  creados: '#3D5A73',
  backlog: '#C8501E',
  neutro: '#5F7376',
};

// Cambia estos prefijos por los nombres reales cuando tengas los catálogos.
const PREFIJO = {
  area: 'Área', tipo: 'Tipo', proyecto: 'Proyecto', supervisor: 'Supervisor',
  administrador: 'Admin', trabajador: 'Trabajador', condicion: 'Condición',
};
const etiqueta = (dim, clave) => (PREFIJO[dim] ? `${PREFIJO[dim]} ${clave}` : clave);

const nf = (n) => (n == null ? '—' : n);
const pct = (n) => (n == null ? '—' : `${n}%`);
const dias = (n) => (n == null ? '—' : `${n} d`);

/* ------------------------------ datos ------------------------------ */

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

/* ------------------------- piezas pequeñas ------------------------- */

function Kpi({ valor, label, color, nota }) {
  return (
    <div className="kpi" style={color ? { borderLeftColor: color } : undefined}>
      <span className="kpi-valor">{valor}</span>
      <span className="kpi-label">{label}</span>
      {nota && <small className="kpi-nota">{nota}</small>}
    </div>
  );
}

function Panel({ titulo, children, ancho }) {
  return (
    <section className={`panel ${ancho === 'completo' ? 'panel-completo' : ''}`}>
      <h3>{titulo}</h3>
      {children}
    </section>
  );
}

function Tabla({ columnas, filas }) {
  return (
    <div className="tabla-scroll">
      <table>
        <thead>
          <tr>{columnas.map((c) => <th key={c.titulo} className={c.num ? 'num' : ''}>{c.titulo}</th>)}</tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i}>
              {columnas.map((c) => (
                <td key={c.titulo} className={c.num ? 'num' : ''}>{c.celda(f)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Grafico = ({ alto = 260, children }) => (
  <div style={{ width: '100%', height: alto }}>
    <ResponsiveContainer>{children}</ResponsiveContainer>
  </div>
);

const ejes = { stroke: '#8A9A9C', fontSize: 12, tickLine: false };

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
      <div className="kpis">
        <Kpi valor={r.total} label="Eventos" />
        <Kpi valor={r.abiertos} label="Abiertos" color={COLOR.abiertos} nota={pct(r.pct_abiertos)} />
        <Kpi valor={r.en_revision} label="En revisión" color={COLOR.en_revision} nota={pct(r.pct_en_revision)} />
        <Kpi valor={r.cerrados} label="Cerrados" color={COLOR.cerrados} nota={`Tasa de cierre ${pct(r.tasa_cierre)}`} />
        <Kpi valor={r.pendientes_mas_90d} label="Pendientes de más de 90 días" color={COLOR.abiertos} />
        <Kpi valor={r.pendientes_sin_actualizar_30d} label="Pendientes sin cambios en 30 días" color={COLOR.en_revision} />
        <Kpi valor={r.creados_30d} label="Creados en 30 días" nota={`${r.cerrados_30d} cerrados`} />
        <Kpi valor={r.balance_30d > 0 ? `+${r.balance_30d}` : r.balance_30d} label="Balance de 30 días" nota={r.balance_30d > 0 ? 'Entran más de los que se cierran' : 'Se cierran más de los que entran'} />
        <Kpi valor={dias(r.dias_cierre_mediana)} label="Mediana de cierre" nota={`Promedio ${dias(r.dias_cierre_promedio)}`} />
        <Kpi valor={r.eventos_por_semana} label="Eventos por semana" nota={`${r.eventos_por_mes} por mes`} />
      </div>

      <div className="grid-2">
        <Panel titulo="Estado de los eventos">
          <Grafico>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                {pie.map((p) => <Cell key={p.name} fill={p.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </Grafico>
        </Panel>

        <Panel titulo="Lo que más destaca">
          <ul className="destacados">
            {d.destacados.map((x) => (
              <li key={x.titulo}>
                <span>{x.titulo}</span>
                <strong>{etiqueta(x.dimension, x.clave)}</strong>
                <em>{x.texto}</em>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel titulo="Comparativas entre períodos" ancho="completo">
        <Tabla
          columnas={[
            { titulo: 'Período', celda: (f) => f.periodo },
            { titulo: 'Creados', num: true, celda: (f) => `${f.actual.creados} (antes ${f.anterior.creados})` },
            { titulo: 'Variación', num: true, celda: (f) => pct(f.var_creados_pct) },
            { titulo: 'Cerrados', num: true, celda: (f) => `${f.actual.cerrados} (antes ${f.anterior.cerrados})` },
            { titulo: 'Variación', num: true, celda: (f) => pct(f.var_cerrados_pct) },
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
      <Panel titulo="Eventos creados, cerrados y pendientes al cierre de cada mes" ancho="completo">
        <Grafico alto={320}>
          <ComposedChart data={t.por_mes}>
            <CartesianGrid stroke="#E1E7E5" vertical={false} />
            <XAxis dataKey="mes" {...ejes} />
            <YAxis {...ejes} />
            <Tooltip />
            <Legend />
            <Bar dataKey="creados" name="Creados" fill={COLOR.creados} />
            <Bar dataKey="cerrados" name="Cerrados" fill={COLOR.cerrados} />
            <Line dataKey="backlog_fin_mes" name="Pendientes a fin de mes" stroke={COLOR.backlog} strokeWidth={2} dot={false} />
          </ComposedChart>
        </Grafico>
        <p className="nota">
          Al ritmo de los últimos 3 meses entran {p.promedio_creados_mes_3m} y se cierran {p.promedio_cerrados_mes_3m} eventos por mes
          {p.backlog_crece ? ': el backlog sigue creciendo.' : '.'}
          {p.meses_para_vaciar_backlog != null && ` Vaciar los pendientes tomaría ${p.meses_para_vaciar_backlog} meses sin nuevos ingresos.`}
        </p>
      </Panel>

      <Panel titulo="Últimos 30 días" ancho="completo">
        <Grafico>
          <ComposedChart data={t.por_dia_ultimos_30}>
            <CartesianGrid stroke="#E1E7E5" vertical={false} />
            <XAxis dataKey="fecha" tickFormatter={(v) => v.slice(5)} {...ejes} />
            <YAxis allowDecimals={false} {...ejes} />
            <Tooltip />
            <Legend />
            <Bar dataKey="creados" name="Creados" fill={COLOR.creados} />
            <Bar dataKey="cerrados" name="Cerrados" fill={COLOR.cerrados} />
            <Line dataKey="media_movil_7d" name="Media móvil de 7 días" stroke={COLOR.backlog} dot={false} strokeWidth={2} />
          </ComposedChart>
        </Grafico>
      </Panel>

      <div className="grid-2">
        <Panel titulo="Eventos por día de la semana">
          <Grafico alto={220}>
            <BarChart data={t.por_dia_semana}>
              <XAxis dataKey="dia" tickFormatter={(v) => v.slice(0, 3)} {...ejes} />
              <YAxis allowDecimals={false} {...ejes} />
              <Tooltip />
              <Bar dataKey="creados" name="Creados" fill={COLOR.creados} />
            </BarChart>
          </Grafico>
        </Panel>
        <Panel titulo="Eventos por hora del día">
          <Grafico alto={220}>
            <BarChart data={t.por_hora}>
              <XAxis dataKey="hora" {...ejes} />
              <YAxis allowDecimals={false} {...ejes} />
              <Tooltip labelFormatter={(h) => `${h}:00`} />
              <Bar dataKey="creados" name="Creados" fill={COLOR.neutro} />
            </BarChart>
          </Grafico>
        </Panel>
      </div>
    </>
  );
}

const DIMENSIONES = [
  ['tipo', 'Tipo de evento'],
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
      <div className="selector" role="tablist" aria-label="Dimensión">
        {DIMENSIONES.map(([k, n]) => (
          <button key={k} className={dim === k ? 'activo' : ''} onClick={() => setDim(k)}>{n}</button>
        ))}
      </div>

      <Panel titulo="Estado de los eventos según la dimensión elegida" ancho="completo">
        <Grafico alto={Math.max(220, datos.length * 38 + 60)}>
          <BarChart data={datos} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid stroke="#E1E7E5" horizontal={false} />
            <XAxis type="number" allowDecimals={false} {...ejes} />
            <YAxis type="category" dataKey="nombre" width={150} {...ejes} />
            <Tooltip />
            <Legend />
            <Bar dataKey="abiertos" name="Abiertos" stackId="e" fill={COLOR.abiertos} />
            <Bar dataKey="en_revision" name="En revisión" stackId="e" fill={COLOR.en_revision} />
            <Bar dataKey="cerrados" name="Cerrados" stackId="e" fill={COLOR.cerrados} />
          </BarChart>
        </Grafico>
      </Panel>

      <Panel titulo="Detalle" ancho="completo">
        <Tabla
          columnas={[
            { titulo: 'Grupo', celda: (f) => etiqueta(dim, f.clave) },
            { titulo: 'Eventos', num: true, celda: (f) => f.total },
            { titulo: '% del total', num: true, celda: (f) => pct(f.pct_del_total) },
            { titulo: 'Pendientes', num: true, celda: (f) => f.pendientes },
            { titulo: 'Tasa de cierre', num: true, celda: (f) => pct(f.tasa_cierre) },
            { titulo: 'Días promedio de cierre', num: true, celda: (f) => nf(f.dias_prom_cierre) },
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
      <div className="kpis">
        <Kpi valor={dias(t.global.mediana)} label="Mediana de cierre" />
        <Kpi valor={dias(t.global.promedio)} label="Promedio de cierre" />
        <Kpi valor={dias(t.global.p90)} label="El 90% se cierra en" />
        <Kpi valor={pct(t.sla.pct)} label={`Cerrados en ${t.sla.dias} días o menos`} color={COLOR.cerrados} />
        <Kpi valor={dias(a.edad.mediana)} label="Mediana de edad de pendientes" color={COLOR.abiertos} />
        <Kpi valor={a.estancados.total} label={`Sin cambios en ${a.estancados.umbral_dias} días`} color={COLOR.en_revision} nota={pct(a.estancados.pct_de_pendientes)} />
      </div>

      <div className="grid-2">
        <Panel titulo="¿Cuánto tardan en cerrarse?">
          <Grafico alto={240}>
            <BarChart data={t.distribucion}>
              <XAxis dataKey="rango" {...ejes} interval={0} fontSize={11} />
              <YAxis allowDecimals={false} {...ejes} />
              <Tooltip />
              <Bar dataKey="total" name="Eventos" fill={COLOR.cerrados} />
            </BarChart>
          </Grafico>
        </Panel>
        <Panel titulo="¿Qué antigüedad tienen los pendientes?">
          <Grafico alto={240}>
            <BarChart data={a.distribucion}>
              <XAxis dataKey="rango" {...ejes} interval={0} fontSize={11} />
              <YAxis allowDecimals={false} {...ejes} />
              <Tooltip />
              <Bar dataKey="total" name="Eventos" fill={COLOR.abiertos} />
            </BarChart>
          </Grafico>
        </Panel>
      </div>

      <Panel titulo="Los 10 pendientes más antiguos" ancho="completo">
        <Tabla
          columnas={[
            { titulo: 'Ref.', celda: (f) => f.referencia ?? `#${f.id_evento}` },
            { titulo: 'Descripción', celda: (f) => f.descripcion },
            { titulo: 'Área', celda: (f) => f.id_area },
            { titulo: 'Estado', celda: (f) => <span className={`chip chip-${f.estado}`}>{f.estado.replace('_', ' ')}</span> },
            { titulo: 'Antigüedad', num: true, celda: (f) => dias(f.edad_dias) },
            { titulo: 'Sin cambios', num: true, celda: (f) => dias(f.dias_sin_actualizar) },
          ]}
          filas={a.mas_antiguos}
        />
      </Panel>

      <Panel titulo="Tiempo de cierre por área" ancho="completo">
        <Tabla
          columnas={[
            { titulo: 'Área', celda: (f) => etiqueta('area', f.clave) },
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
      <div className="kpis">
        <Kpi valor={t.resumen.trabajadores_distintos} label="Trabajadores con eventos" />
        <Kpi valor={t.resumen.promedio_eventos_por_trabajador} label="Eventos por trabajador" />
        <Kpi valor={t.resumen.eventos_con_varios_trabajadores} label="Eventos con varios trabajadores" />
        <Kpi valor={t.resumen.eventos_sin_trabajador} label="Eventos sin trabajador" />
      </div>

      <Panel titulo="Eventos por trabajador" ancho="completo">
        <Grafico alto={Math.max(220, datos.length * 40 + 60)}>
          <BarChart data={datos} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid stroke="#E1E7E5" horizontal={false} />
            <XAxis type="number" allowDecimals={false} {...ejes} />
            <YAxis type="category" dataKey="nombre" width={110} {...ejes} />
            <Tooltip />
            <Legend />
            <Bar dataKey="abiertos" name="Abiertos" stackId="e" fill={COLOR.abiertos} />
            <Bar dataKey="en_revision" name="En revisión" stackId="e" fill={COLOR.en_revision} />
            <Bar dataKey="cerrados" name="Cerrados" stackId="e" fill={COLOR.cerrados} />
          </BarChart>
        </Grafico>
      </Panel>

      <Panel titulo="Detalle por trabajador" ancho="completo">
        <Tabla
          columnas={[
            { titulo: 'Trabajador', celda: (f) => etiqueta('trabajador', f.clave) },
            { titulo: 'Eventos', num: true, celda: (f) => f.total },
            { titulo: 'Pendientes', num: true, celda: (f) => f.pendientes },
            { titulo: 'Tasa de cierre', num: true, celda: (f) => pct(f.tasa_cierre) },
            { titulo: 'Días prom. de cierre', num: true, celda: (f) => nf(f.dias_prom_cierre) },
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
      <Panel titulo="Eventos por categoría de hallazgo" ancho="completo">
        <Grafico alto={Math.max(220, h.por_categoria.length * 38 + 60)}>
          <BarChart data={h.por_categoria} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid stroke="#E1E7E5" horizontal={false} />
            <XAxis type="number" allowDecimals={false} {...ejes} />
            <YAxis type="category" dataKey="clave" width={190} {...ejes} />
            <Tooltip />
            <Legend />
            <Bar dataKey="abiertos" name="Abiertos" stackId="e" fill={COLOR.abiertos} />
            <Bar dataKey="en_revision" name="En revisión" stackId="e" fill={COLOR.en_revision} />
            <Bar dataKey="cerrados" name="Cerrados" stackId="e" fill={COLOR.cerrados} />
          </BarChart>
        </Grafico>
      </Panel>

      <Panel titulo={`Hallazgos más repetidos (${h.descripciones_distintas} distintos)`} ancho="completo">
        <Tabla
          columnas={[
            { titulo: 'Descripción', celda: (f) => f.clave },
            { titulo: 'Veces', num: true, celda: (f) => f.total },
            { titulo: 'Acumulado', num: true, celda: (f) => pct(f.acumulado_pct) },
            { titulo: 'Pendientes', num: true, celda: (f) => f.pendientes },
            { titulo: 'Tasa de cierre', num: true, celda: (f) => pct(f.tasa_cierre) },
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
      <div className="kpis">
        <Kpi valor={pct(c.completitud_pct)} label="Completitud de los datos" color={COLOR.cerrados} />
        <Kpi valor={pct(d.cierre.con_justificacion_pct)} label="Cerrados con justificación" />
        <Kpi valor={pct(d.cierre.con_evidencia_cierre_pct)} label="Cerrados con evidencia de cierre" />
        <Kpi valor={pct(d.cierre.con_fecha_cierre_pct)} label="Cerrados con fecha de cierre" />
      </div>

      {c.avisos.map((a) => <p key={a} className="aviso">{a}</p>)}

      <Panel titulo="Revisión de los datos" ancho="completo">
        <ul className="chequeos">
          {c.chequeos.map((x) => (
            <li key={x.id} className={x.total === 0 ? 'ok' : ''}>
              <div>
                <strong>{x.etiqueta}</strong>
                <span>{x.total} eventos ({pct(x.pct)})</span>
              </div>
              <div className="barra"><i style={{ width: `${Math.min(100, x.pct)}%` }} /></div>
              {x.total > 0 && <small>Por ejemplo: {x.ejemplos.slice(0, 8).map((i) => `#${i}`).join(', ')}</small>}
            </li>
          ))}
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

/* ------------------------------ página ------------------------------ */

export default function EventosEstadisticas() {
  const [tab, setTab] = useState('resumen');
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', id_area: '', id_proyecto: '', id_tipo_evento: '' });
  const { data, error, cargando } = useStats(filtros);

  // Las opciones de los filtros se toman de la primera carga, sin filtros.
  const opciones = useRef(null);
  if (data && !opciones.current) {
    opciones.current = {
      areas: data.distribuciones.area.map((x) => x.clave).sort((a, b) => a - b),
      proyectos: data.distribuciones.proyecto.map((x) => x.clave).sort((a, b) => a - b),
      tipos: data.distribuciones.tipo.map((x) => x.clave).sort((a, b) => a - b),
    };
  }

  const set = (k) => (e) => setFiltros((f) => ({ ...f, [k]: e.target.value }));
  const Activa = TABS.find(([k]) => k === tab)[2];
  const op = opciones.current;

  return (
    <main className="ee">
      <header className="ee-cabecera">
        <div>
          <h1>Panel de eventos</h1>
          <p>{data ? `${data.meta.total_eventos} eventos analizados` : 'Cargando estadísticas'}</p>
        </div>

        <form className="filtros" onSubmit={(e) => e.preventDefault()}>
          <label>Desde<input type="date" value={filtros.desde} onChange={set('desde')} /></label>
          <label>Hasta<input type="date" value={filtros.hasta} onChange={set('hasta')} /></label>
          {op && (
            <>
              <label>Área
                <select value={filtros.id_area} onChange={set('id_area')}>
                  <option value="">Todas</option>
                  {op.areas.map((a) => <option key={a} value={a}>Área {a}</option>)}
                </select>
              </label>
              <label>Proyecto
                <select value={filtros.id_proyecto} onChange={set('id_proyecto')}>
                  <option value="">Todos</option>
                  {op.proyectos.map((a) => <option key={a} value={a}>Proyecto {a}</option>)}
                </select>
              </label>
              <label>Tipo
                <select value={filtros.id_tipo_evento} onChange={set('id_tipo_evento')}>
                  <option value="">Todos</option>
                  {op.tipos.map((a) => <option key={a} value={a}>Tipo {a}</option>)}
                </select>
              </label>
            </>
          )}
          <button type="button" className="limpiar" onClick={() => setFiltros({ desde: '', hasta: '', id_area: '', id_proyecto: '', id_tipo_evento: '' })}>
            Quitar filtros
          </button>
        </form>
      </header>

      <nav className="ee-tabs" aria-label="Secciones">
        {TABS.map(([k, n]) => (
          <button key={k} className={tab === k ? 'activo' : ''} onClick={() => setTab(k)}>{n}</button>
        ))}
      </nav>

      <div className={`ee-contenido ${cargando ? 'cargando' : ''}`} aria-busy={cargando}>
        {error && <p className="aviso error">No se pudieron cargar las estadísticas: {error}. Revisa la ruta y la sesión e inténtalo de nuevo.</p>}
        {data && data.meta.total_eventos === 0 && <p className="aviso">No hay eventos con estos filtros. Prueba ampliando el rango de fechas.</p>}
        {data && data.resumen && <Activa d={data} />}
      </div>
    </main>
  );
}
