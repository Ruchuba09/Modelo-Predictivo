import { useMemo, useState } from 'react';
import { etiquetaTipo } from '@/lib/utils';

export type FotoRed = {
    red: string;
    etapa: 'busqueda' | 'ensamble';
    configuracion_indice: number;
    configuracion: { capas: number[]; alpha: number; lr: number };
    semilla: number;
    epoca: number;
    actualizaciones: number;
    perdida_entrenamiento: number;
    perdida_validacion: number;
    es_mejor: boolean;
    arquitectura: number[];
    pesos: number[][][];
    activaciones: number[][];
    magnitud: number[];
    cambio: number[] | null;
    histogramas: number[][];
};

export type InfoRed = {
    entradas: string[];
    salidas: string[];
    total_entradas: number;
    ganadora: number | null;
};

export type Corrida = {
    clave: string;
    inicio: number;
    fin: number;
    red: string;
    etapa: FotoRed['etapa'];
    configuracion_indice: number;
    configuracion: FotoRed['configuracion'];
    semilla: number;
    mejor: number;
};

const AZUL = '#2a78d6';
const NARANJA = '#eb6834';
const colorSigno = (valor: number) => (valor >= 0 ? AZUL : NARANJA);
const numero = (valor: number, decimales = 3) => valor.toFixed(decimales).replace('.', ',');
const nombreRed = (red: string) => (red === 'eventos' ? 'Red de eventos' : 'Red de entidades');
const conMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);
const nombreSalida = (salida: string) => (salida === 'entidad' ? 'Evento en la entidad' : conMayuscula(etiquetaTipo(salida)));
const nombreCapa = (indice: number, total: number) => {
    if (indice === 0) return 'Entradas';
    return indice === total - 1 ? 'Salidas' : `Capa oculta ${indice}`;
};
const maximoAbsoluto = (filas: number[][]) => Math.max(...filas.flat().map(Math.abs), 1e-6);

export function agruparCorridas(fotos: FotoRed[]): Corrida[] {
    const corridas: Corrida[] = [];
    fotos.forEach((foto, indice) => {
        const clave = `${foto.red}-${foto.etapa}-${foto.configuracion_indice}-${foto.semilla}`;
        const actual = corridas[corridas.length - 1];
        if (actual?.clave === clave) {
            actual.fin = indice;
            actual.mejor = Math.min(actual.mejor, foto.perdida_validacion);
        } else {
            corridas.push({
                clave, inicio: indice, fin: indice, red: foto.red, etapa: foto.etapa, configuracion_indice: foto.configuracion_indice,
                configuracion: foto.configuracion, semilla: foto.semilla, mejor: foto.perdida_validacion,
            });
        }
    });
    return corridas;
}

function Tarjeta({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: React.ReactNode }) {
    return (
        <section className="bg-white border border-verde-3 rounded-2xl shadow-sm p-5 min-w-0">
            <h2 className="text-base font-bold text-gris-2">{titulo}</h2>
            {descripcion && <p className="text-xs text-gris-1 mt-1 mb-3 max-w-3xl">{descripcion}</p>}
            {children}
        </section>
    );
}

function Indicador({ etiqueta, valor }: { etiqueta: string; valor: string }) {
    return (
        <div className="rounded-xl border border-verde-3 bg-white px-3 py-2 min-w-0">
            <p className="text-[11px] font-semibold text-gris-1">{etiqueta}</p>
            <p className="text-sm font-black leading-tight text-gris-2 mt-0.5">{valor}</p>
        </div>
    );
}

/** Capas como columnas y pesos como conexiones: el color da el signo y la intensidad, la fuerza. */
export function DiagramaRed({ foto, info }: { foto: FotoRed; info: InfoRed }) {
    const [resaltada, setResaltada] = useState<{ capa: number; neurona: number } | null>(null);
    const capas = foto.activaciones;
    const paso = 28;
    const margenSuperior = 66;
    const maximoNodos = Math.max(...capas.map((capa) => capa.length));
    const alto = margenSuperior + maximoNodos * paso + 30;
    const izquierda = 300;
    const derecha = 780;
    const xCapa = (capa: number) => izquierda + ((derecha - izquierda) * capa) / (capas.length - 1);
    const yNodo = (capa: number, neurona: number) => margenSuperior + ((maximoNodos - capas[capa].length) * paso) / 2 + neurona * paso + paso / 2;
    const ultimaCapa = capas.length - 1;

    const nombreNodo = (capa: number, neurona: number) => {
        if (capa === 0) return conMayuscula(info.entradas[neurona]);
        if (capa === ultimaCapa) return nombreSalida(info.salidas[neurona]);
        return `Neurona ${neurona + 1} de la capa oculta ${capa}`;
    };

    const detalle = useMemo(() => {
        if (!resaltada) return null;
        const { capa, neurona } = resaltada;
        const conexiones = [
            ...(capa > 0 ? foto.pesos[capa - 1].map((fila, i) => ({ nombre: nombreNodo(capa - 1, i), peso: fila[neurona] })) : []),
            ...(capa < ultimaCapa ? foto.pesos[capa][neurona].map((peso, j) => ({ nombre: nombreNodo(capa + 1, j), peso })) : []),
        ].sort((a, b) => Math.abs(b.peso) - Math.abs(a.peso)).slice(0, 3);
        return { activacion: capas[capa][neurona], conexiones, nombre: nombreNodo(capa, neurona) };
    }, [resaltada, foto]);

    return (
        <div>
            <div className="overflow-x-auto">
                <svg viewBox={`0 0 1000 ${alto}`} className="w-full min-w-[760px]" role="img" aria-label={`Diagrama de la red: arquitectura ${foto.arquitectura.join(', ')}`}>
                    {foto.pesos.map((matriz, capa) => {
                        const maximo = maximoAbsoluto(matriz);
                        return (
                            <g key={capa}>
                                {matriz.flatMap((fila, i) => fila.map((peso, j) => {
                                    const conectada = resaltada && ((resaltada.capa === capa && resaltada.neurona === i) || (resaltada.capa === capa + 1 && resaltada.neurona === j));
                                    const fuerza = Math.abs(peso) / maximo;
                                    const opacidad = resaltada ? (conectada ? Math.max(fuerza, 0.25) : 0.03) : fuerza ** 1.5 * 0.85 + 0.02;
                                    return (
                                        <line
                                            key={`${i}-${j}`}
                                            x1={xCapa(capa)} y1={yNodo(capa, i)} x2={xCapa(capa + 1)} y2={yNodo(capa + 1, j)}
                                            stroke={colorSigno(peso)} strokeOpacity={opacidad} strokeWidth={0.5 + fuerza * 2.5}
                                        />
                                    );
                                }))}
                            </g>
                        );
                    })}

                    {capas.map((valores, capa) => {
                        const total = foto.arquitectura[capa];
                        const maximo = capa === ultimaCapa ? 1 : Math.max(...valores.map(Math.abs), 1e-6);
                        return (
                            <g key={capa}>
                                <text x={xCapa(capa)} y={22} textAnchor="middle" fontSize="13" fontWeight="700" className="fill-gris-2">{nombreCapa(capa, capas.length)}</text>
                                <text x={xCapa(capa)} y={40} textAnchor="middle" fontSize="11.5" className="fill-gris-1">
                                    {valores.length < total ? `${valores.length} de ${total} dibujadas` : capa === ultimaCapa ? `${total} ${total === 1 ? 'salida' : 'salidas'}` : `${total} neuronas`}
                                </text>
                                {valores.map((valor, neurona) => {
                                    const x = xCapa(capa);
                                    const y = yNodo(capa, neurona);
                                    const activa = resaltada?.capa === capa && resaltada.neurona === neurona;
                                    return (
                                        <g
                                            key={neurona}
                                            onMouseEnter={() => setResaltada({ capa, neurona })}
                                            onMouseLeave={() => setResaltada(null)}
                                            onFocus={() => setResaltada({ capa, neurona })}
                                            onBlur={() => setResaltada(null)}
                                            tabIndex={0}
                                            role="button"
                                            aria-label={`${nombreNodo(capa, neurona)}: ${numero(valor)}`}
                                            className="cursor-pointer outline-none"
                                        >
                                            <circle cx={x} cy={y} r={13} fill="transparent" />
                                            <circle cx={x} cy={y} r={9} fill="#ffffff" />
                                            <circle cx={x} cy={y} r={9} fill={colorSigno(valor)} fillOpacity={Math.min(Math.abs(valor) / maximo, 1) * 0.9 + 0.04} stroke={activa ? '#1f2937' : '#9ca3af'} strokeWidth={activa ? 2 : 1} />
                                            {capa === 0 && (
                                                <>
                                                    <text x={x - 16} y={y + 4} textAnchor="end" fontSize="11.5" className="fill-gris-2">{recortar(conMayuscula(info.entradas[neurona]), 38)}</text>
                                                    <text x={x - 266} y={y + 4} textAnchor="end" fontSize="11.5" fontWeight="700" className="fill-gris-1">{numero(valor, 1)}</text>
                                                </>
                                            )}
                                            {capa === ultimaCapa && (
                                                <text x={x + 16} y={y + 4} fontSize="11.5" className="fill-gris-2">
                                                    <tspan fontWeight="700">{Math.round(valor * 100)}%</tspan> {recortar(nombreSalida(info.salidas[neurona]), 22)}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gris-1">
                <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 rounded" style={{ backgroundColor: AZUL }} />Peso o valor positivo</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 rounded" style={{ backgroundColor: NARANJA }} />Peso o valor negativo</span>
                <span>Más intenso y grueso = mayor magnitud dentro de esa capa</span>
            </div>
            <p className="mt-2 min-h-10 rounded-lg bg-verde-1/60 px-3 py-2 text-xs text-gris-2" role="status">
                {detalle ? (
                    <>
                        <span className="font-bold">{detalle.nombre}</span> · valor {numero(detalle.activacion)}
                        {detalle.conexiones.length > 0 && ' · pesos más fuertes: '}
                        {detalle.conexiones.map((c) => `${recortar(c.nombre, 34)} (${numero(c.peso)})`).join(', ')}
                    </>
                ) : 'Pasa el cursor o enfoca una neurona para ver su valor y sus pesos más fuertes.'}
            </p>
        </div>
    );
}

function recortar(texto: string, maximo: number) {
    return texto.length > maximo ? `${texto.slice(0, maximo - 1)}…` : texto;
}

/** La pérdida de la corrida actual, hasta la época que se está mostrando. */
export function CurvaPerdida({ fotos, corrida, indice }: { fotos: FotoRed[]; corrida: Corrida; indice: number }) {
    const [cursor, setCursor] = useState<number | null>(null);
    const todas = fotos.slice(corrida.inicio, corrida.fin + 1);
    const vistas = fotos.slice(corrida.inicio, indice + 1);
    const ancho = 640;
    const alto = 260;
    const margen = { izquierda: 48, derecha: 104, arriba: 12, abajo: 34 };
    const valores = todas.flatMap((f) => [f.perdida_entrenamiento, f.perdida_validacion]);
    const minimo = Math.min(...valores);
    const maximo = Math.max(...valores);
    const holgura = Math.max((maximo - minimo) * 0.08, 0.005);
    const yMin = minimo - holgura;
    const yMax = maximo + holgura;
    const ultimaEpoca = Math.max(todas[todas.length - 1].epoca, 2);
    const x = (epoca: number) => margen.izquierda + ((epoca - 1) / (ultimaEpoca - 1)) * (ancho - margen.izquierda - margen.derecha);
    const y = (valor: number) => margen.arriba + ((yMax - valor) / (yMax - yMin)) * (alto - margen.arriba - margen.abajo);
    const ruta = (campo: 'perdida_entrenamiento' | 'perdida_validacion') => vistas.map((f, i) => `${i === 0 ? 'M' : 'L'}${x(f.epoca)} ${y(f[campo])}`).join(' ');
    const marcasY = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);
    const pasoX = Math.max(1, Math.ceil(ultimaEpoca / 6));
    const marcasX = Array.from({ length: Math.floor((ultimaEpoca - 1) / pasoX) + 1 }, (_, i) => 1 + i * pasoX);
    const ultima = vistas[vistas.length - 1];
    const mejor = vistas.reduce((a, b) => (b.perdida_validacion < a.perdida_validacion ? b : a));
    const seleccion = cursor === null ? null : vistas.find((f) => f.epoca === cursor) ?? null;

    let yEntrenamiento = y(ultima.perdida_entrenamiento) + 4;
    let yValidacion = y(ultima.perdida_validacion) + 4;
    if (Math.abs(yEntrenamiento - yValidacion) < 14) {
        const centro = (yEntrenamiento + yValidacion) / 2;
        const entrenamientoArriba = ultima.perdida_entrenamiento >= ultima.perdida_validacion;
        yEntrenamiento = centro + (entrenamientoArriba ? -7 : 7);
        yValidacion = centro + (entrenamientoArriba ? 7 : -7);
    }

    const mover = (evento: React.MouseEvent<SVGRectElement>) => {
        const caja = evento.currentTarget.getBoundingClientRect();
        const proporcion = (evento.clientX - caja.left) / caja.width;
        const epoca = Math.round(1 + proporcion * (ultimaEpoca - 1));
        setCursor(Math.min(Math.max(epoca, 1), ultima.epoca));
    };

    return (
        <div>
            <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gris-1">
                <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 rounded" style={{ backgroundColor: AZUL }} />Validación</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 rounded" style={{ backgroundColor: NARANJA }} />Entrenamiento</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border-2 border-white" style={{ backgroundColor: AZUL, outline: `1px solid ${AZUL}` }} />Mejor época</span>
            </div>
            <div className="relative">
                <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full" role="img" aria-label={`Pérdida por época. Validación ${numero(ultima.perdida_validacion)}, entrenamiento ${numero(ultima.perdida_entrenamiento)}`}>
                    {marcasY.map((marca) => (
                        <g key={marca}>
                            <line x1={margen.izquierda} x2={ancho - margen.derecha} y1={y(marca)} y2={y(marca)} stroke="#e5e7eb" />
                            <text x={margen.izquierda - 8} y={y(marca) + 4} textAnchor="end" fontSize="11" className="fill-gris-1">{numero(marca, 2)}</text>
                        </g>
                    ))}
                    {marcasX.map((marca) => (
                        <text key={marca} x={x(marca)} y={alto - 16} textAnchor="middle" fontSize="11" className="fill-gris-1">{marca}</text>
                    ))}
                    <text x={(margen.izquierda + ancho - margen.derecha) / 2} y={alto - 1} textAnchor="middle" fontSize="11" className="fill-gris-1">Época</text>
                    <path d={ruta('perdida_entrenamiento')} fill="none" stroke={NARANJA} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    <path d={ruta('perdida_validacion')} fill="none" stroke={AZUL} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    <circle cx={x(mejor.epoca)} cy={y(mejor.perdida_validacion)} r="5" fill={AZUL} stroke="#ffffff" strokeWidth="2" />
                    <text x={x(ultima.epoca) + 8} y={yValidacion} fontSize="11" fontWeight="700" className="fill-gris-2">Validación</text>
                    <text x={x(ultima.epoca) + 8} y={yEntrenamiento} fontSize="11" fontWeight="700" className="fill-gris-2">Entrenamiento</text>
                    {seleccion && (
                        <g>
                            <line x1={x(seleccion.epoca)} x2={x(seleccion.epoca)} y1={margen.arriba} y2={alto - margen.abajo} stroke="#9ca3af" />
                            <circle cx={x(seleccion.epoca)} cy={y(seleccion.perdida_validacion)} r="4" fill={AZUL} stroke="#ffffff" strokeWidth="2" />
                            <circle cx={x(seleccion.epoca)} cy={y(seleccion.perdida_entrenamiento)} r="4" fill={NARANJA} stroke="#ffffff" strokeWidth="2" />
                        </g>
                    )}
                    <rect
                        x={margen.izquierda} y={margen.arriba} width={ancho - margen.izquierda - margen.derecha} height={alto - margen.arriba - margen.abajo}
                        fill="transparent" onMouseMove={mover} onMouseLeave={() => setCursor(null)}
                    />
                </svg>
            </div>
            <p className="min-h-5 text-xs text-gris-2" role="status">
                {seleccion
                    ? `Época ${seleccion.epoca}: validación ${numero(seleccion.perdida_validacion)}, entrenamiento ${numero(seleccion.perdida_entrenamiento)}`
                    : `Mejor hasta ahora: época ${mejor.epoca}, validación ${numero(mejor.perdida_validacion)}`}
            </p>
        </div>
    );
}

/** Lista de corridas: también permite saltar a cualquiera de ellas. */
export function ListaCorridas({ corridas, actual, ganadora, saltar }: { corridas: Corrida[]; actual: Corrida; ganadora: number | null; saltar: (indice: number) => void }) {
    return (
        <div className="max-h-[320px] overflow-auto">
            <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white text-gris-1 text-left">
                    <tr>
                        <th scope="col" className="py-1.5 pr-2 font-semibold">Corrida</th>
                        <th scope="col" className="py-1.5 pr-2 font-semibold">Capas</th>
                        <th scope="col" className="py-1.5 pr-2 font-semibold">Regul.</th>
                        <th scope="col" className="py-1.5 pr-2 font-semibold">Tasa</th>
                        <th scope="col" className="py-1.5 pr-2 font-semibold">Épocas</th>
                        <th scope="col" className="py-1.5 font-semibold">Mejor pérdida</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-verde-3 text-gris-2">
                    {corridas.map((corrida) => {
                        const esActual = corrida.clave === actual.clave;
                        const gano = corrida.etapa === 'busqueda' && corrida.configuracion_indice === ganadora;
                        return (
                            <tr key={corrida.clave} className={esActual ? 'bg-verde-2/60 font-bold' : ''}>
                                <th scope="row" className="py-1.5 pr-2 text-left font-inherit">
                                    <button type="button" onClick={() => saltar(corrida.inicio)} className="underline decoration-verde-5 underline-offset-2 text-left">
                                        {corrida.etapa === 'busqueda' ? `Configuración ${corrida.configuracion_indice + 1}` : `Semilla ${corrida.semilla}`}
                                    </button>
                                    {gano && <span className="ml-1.5 rounded-full bg-verde-2 px-1.5 py-0.5 text-[10px] text-gris-2">Elegida</span>}
                                </th>
                                <td className="py-1.5 pr-2">{corrida.configuracion.capas.join(' · ')}</td>
                                <td className="py-1.5 pr-2">{corrida.configuracion.alpha}</td>
                                <td className="py-1.5 pr-2">{corrida.configuracion.lr}</td>
                                <td className="py-1.5 pr-2">{corrida.fin - corrida.inicio + 1}</td>
                                <td className="py-1.5">{numero(corrida.mejor)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/** Cada celda es un peso: la fila es la neurona de origen y la columna, la de destino. */
export function MapasPesos({ foto, info }: { foto: FotoRed; info: InfoRed }) {
    const [lectura, setLectura] = useState('');
    const total = foto.activaciones.length;
    const nombre = (capa: number, neurona: number) => {
        if (capa === 0) return info.entradas[neurona];
        if (capa === total - 1) return nombreSalida(info.salidas[neurona]);
        return `neurona ${neurona + 1} de la capa ${capa}`;
    };
    const lado = 15;
    return (
        <div>
            <div className="flex flex-wrap gap-6">
                {foto.pesos.map((matriz, capa) => {
                    const maximo = maximoAbsoluto(matriz);
                    return (
                        <div key={capa} className="min-w-0">
                            <p className="text-xs font-bold text-gris-2">{nombreCapa(capa, total)} → {nombreCapa(capa + 1, total).toLowerCase()}</p>
                            <p className="text-[11px] text-gris-1 mb-1.5">Peso máximo dibujado: {numero(maximo)}</p>
                            <svg
                                width={matriz[0].length * lado} height={matriz.length * lado}
                                role="img" aria-label={`Mapa de pesos de ${nombreCapa(capa, total)} a ${nombreCapa(capa + 1, total)}`}
                                onMouseLeave={() => setLectura('')}
                            >
                                {matriz.flatMap((fila, i) => fila.map((peso, j) => (
                                    <g key={`${i}-${j}`} onMouseEnter={() => setLectura(`De ${nombre(capa, i)} a ${nombre(capa + 1, j)}: peso ${numero(peso)}`)}>
                                        <rect x={j * lado} y={i * lado} width={lado - 2} height={lado - 2} rx="2" fill="#f3f4f6" />
                                        <rect x={j * lado} y={i * lado} width={lado - 2} height={lado - 2} rx="2" fill={colorSigno(peso)} fillOpacity={Math.abs(peso) / maximo} />
                                    </g>
                                )))}
                            </svg>
                        </div>
                    );
                })}
            </div>
            <p className="mt-2 min-h-5 text-xs text-gris-2" role="status">{lectura || 'Pasa el cursor por una celda para leer su peso.'}</p>
        </div>
    );
}

/** Todos los pesos de cada conexión, no solo los dibujados. */
export function DistribucionPesos({ foto, bordes }: { foto: FotoRed; bordes: number[] }) {
    const [lectura, setLectura] = useState('');
    const total = foto.activaciones.length;
    const ancho = 260;
    const alto = 90;
    return (
        <div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {foto.histogramas.map((conteos, capa) => {
                    const maximo = Math.max(...conteos, 1);
                    const anchoBarra = ancho / conteos.length;
                    return (
                        <div key={capa}>
                            <p className="text-xs font-bold text-gris-2">{nombreCapa(capa, total)} → {nombreCapa(capa + 1, total).toLowerCase()}</p>
                            <p className="text-[11px] text-gris-1 mb-1">
                                Magnitud media {numero(foto.magnitud[capa])}
                                {foto.cambio && ` · cambio por época ${numero(foto.cambio[capa], 4)}`}
                            </p>
                            <svg viewBox={`0 0 ${ancho} ${alto + 16}`} className="w-full" role="img" aria-label={`Distribución de pesos de la conexión ${capa + 1}`} onMouseLeave={() => setLectura('')}>
                                {conteos.map((conteo, i) => {
                                    const barra = conteo === 0 ? 0 : Math.max((conteo / maximo) * alto, 1.5);
                                    return (
                                        <g key={i} onMouseEnter={() => setLectura(`${conteo} pesos entre ${numero(bordes[i], 2)} y ${numero(bordes[i + 1], 2)}`)}>
                                            <rect x={i * anchoBarra} y={0} width={anchoBarra} height={alto} fill="transparent" />
                                            <rect x={i * anchoBarra + 1} y={alto - barra} width={anchoBarra - 2} height={barra} rx="1.5" fill={AZUL} />
                                        </g>
                                    );
                                })}
                                <line x1="0" x2={ancho} y1={alto} y2={alto} stroke="#9ca3af" />
                                <text x="0" y={alto + 13} fontSize="10.5" className="fill-gris-1">{numero(bordes[0], 0)}</text>
                                <text x={ancho / 2} y={alto + 13} textAnchor="middle" fontSize="10.5" className="fill-gris-1">0</text>
                                <text x={ancho} y={alto + 13} textAnchor="end" fontSize="10.5" className="fill-gris-1">+{numero(bordes[bordes.length - 1], 0)}</text>
                            </svg>
                        </div>
                    );
                })}
            </div>
            <p className="mt-2 min-h-5 text-xs text-gris-2" role="status">{lectura || 'Pasa el cursor por una barra para ver cuántos pesos contiene.'}</p>
        </div>
    );
}

export function VisorRed({ fotos, indice, redes, bordes, saltar }: {
    fotos: FotoRed[];
    indice: number;
    redes: Record<string, InfoRed>;
    bordes: number[];
    saltar: (indice: number) => void;
}) {
    const foto = fotos[indice];
    const info = redes[foto.red];
    const corridas = useMemo(() => agruparCorridas(fotos), [fotos]);
    const corrida = corridas.find((c) => indice >= c.inicio && indice <= c.fin) ?? corridas[0];
    const corridasRed = corridas.filter((c) => c.red === foto.red);

    return (
        <div className="space-y-5">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
                <Indicador etiqueta="Red" valor={nombreRed(foto.red)} />
                <Indicador etiqueta="Etapa" valor={foto.etapa === 'busqueda' ? `Configuración ${foto.configuracion_indice + 1} de 6` : `Ensamble, semilla ${foto.semilla}`} />
                <Indicador etiqueta="Arquitectura" valor={foto.arquitectura.join(' · ')} />
                <Indicador etiqueta="Época" valor={String(foto.epoca)} />
                <Indicador etiqueta="Actualizaciones de pesos" valor={foto.actualizaciones.toLocaleString('es-CL')} />
                <Indicador etiqueta="Pérdida de validación" valor={numero(foto.perdida_validacion)} />
                <Indicador etiqueta="Pérdida de entrenamiento" valor={numero(foto.perdida_entrenamiento)} />
            </div>

            <Tarjeta
                titulo="La red por dentro"
                descripcion={`Propaga la semana más reciente de validación. Las entradas son las ${info.entradas.length} más relacionadas con las salidas, de ${info.total_entradas}, con valores estandarizados. Las salidas son probabilidades sin calibrar.`}
            >
                <DiagramaRed foto={foto} info={info} />
            </Tarjeta>

            <div className="grid gap-5 xl:grid-cols-2">
                <Tarjeta titulo="Pérdida por época" descripcion="Cuanto más baja, mejores probabilidades. La red se queda con la mejor época de validación.">
                    <CurvaPerdida fotos={fotos} corrida={corrida} indice={indice} />
                </Tarjeta>
                <Tarjeta titulo={`Corridas de la ${nombreRed(foto.red).toLowerCase()}`} descripcion="Se prueban 6 configuraciones, y la elegida se repite con otras 4 semillas para formar el ensamble.">
                    <ListaCorridas corridas={corridasRed} actual={corrida} ganadora={info.ganadora} saltar={saltar} />
                </Tarjeta>
            </div>

            <Tarjeta titulo="Mapas de pesos" descripcion="Los mismos pesos del diagrama, sin que unas líneas tapen a otras. La fila es la neurona de origen y la columna, la de destino.">
                <MapasPesos foto={foto} info={info} />
            </Tarjeta>

            <Tarjeta titulo="Distribución de todos los pesos" descripcion="Incluye toda la red, también lo que no se dibuja. Los pesos fuera de ±1 se cuentan en los extremos.">
                <DistribucionPesos foto={foto} bordes={bordes} />
            </Tarjeta>
        </div>
    );
}
