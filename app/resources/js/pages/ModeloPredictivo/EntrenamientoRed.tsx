import { useEffect, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { OpcionesHorizonte } from '@/components/modelo/Elementos';
import { VisorRed, type FotoRed, type InfoRed } from '@/components/modelo/VisorRed';
import { api } from '@/lib/api';
import { HORIZONTE_PREDETERMINADO } from '@/lib/modeloPredictivo';

type RespuestaTraza = {
    id?: string;
    estado: 'sin_entrenar' | 'entrenando' | 'listo' | 'error';
    mensaje?: string | null;
    total: number;
    truncada?: boolean;
    redes?: Record<string, InfoRed>;
    bordes_histograma?: number[];
    fotos: FotoRed[];
};

const VELOCIDADES = [
    { etiqueta: '×1', milisegundos: 160 },
    { etiqueta: '×2', milisegundos: 80 },
    { etiqueta: '×4', milisegundos: 40 },
];

const mensajeDeError = (err: any, general: string) => err.response?.data?.detail ?? err.response?.data?.message ?? general;

export default function EntrenamientoRed() {
    const [horizonte, setHorizonte] = useState(HORIZONTE_PREDETERMINADO);
    const [fotos, setFotos] = useState<FotoRed[]>([]);
    const [traza, setTraza] = useState<Omit<RespuestaTraza, 'fotos'> | null>(null);
    const [indice, setIndice] = useState(0);
    const [reproduciendo, setReproduciendo] = useState(false);
    const [velocidad, setVelocidad] = useState(80);
    const [sesion, setSesion] = useState(0);
    const [error, setError] = useState('');
    const fotosRef = useRef<FotoRed[]>([]);
    const idRef = useRef<string | undefined>(undefined);
    const posicionInicial = useRef(true);

    const entrenando = traza?.estado === 'entrenando';
    const ultima = fotos.length - 1;
    const cargandoHistoria = !entrenando && traza !== null && fotos.length < traza.total;

    useEffect(() => {
        fotosRef.current = [];
        idRef.current = undefined;
        posicionInicial.current = true;
        setFotos([]);
        setTraza(null);
        setIndice(0);
        setReproduciendo(false);
    }, [horizonte]);

    useEffect(() => {
        let vigente = true;
        let temporizador: number | undefined;

        const pedir = async () => {
            try {
                const { data } = await api.get<RespuestaTraza>('/modelo-predictivo/red-neuronal/traza', {
                    params: { horizonte_dias: horizonte, desde: fotosRef.current.length, limite: 200 },
                });
                if (!vigente) return;
                setError('');
                if (data.id && data.id !== idRef.current) {
                    // Empezó otro entrenamiento: lo recibido no continúa lo que ya estaba cargado.
                    const habiaFotos = fotosRef.current.length > 0;
                    idRef.current = data.id;
                    fotosRef.current = [];
                    setFotos([]);
                    setIndice(0);
                    if (habiaFotos) {
                        temporizador = window.setTimeout(pedir, 0);
                        return;
                    }
                }
                const { fotos: nuevas, ...resto } = data;
                setTraza(resto);
                if (nuevas.length > 0) {
                    fotosRef.current = [...fotosRef.current, ...nuevas];
                    setFotos(fotosRef.current);
                }
                const faltan = fotosRef.current.length < data.total;
                if (data.estado === 'entrenando') {
                    posicionInicial.current = false;
                    setReproduciendo(true);
                    temporizador = window.setTimeout(pedir, faltan ? 200 : 1500);
                } else if (faltan) {
                    temporizador = window.setTimeout(pedir, 0);
                } else if (posicionInicial.current && fotosRef.current.length > 0) {
                    // Al abrir la vista con un entrenamiento guardado se muestra su estado final.
                    posicionInicial.current = false;
                    setIndice(fotosRef.current.length - 1);
                }
            } catch (err) {
                if (vigente) setError(mensajeDeError(err, 'No fue posible consultar el entrenamiento.'));
            }
        };

        pedir();
        return () => {
            vigente = false;
            window.clearTimeout(temporizador);
        };
    }, [horizonte, sesion]);

    useEffect(() => {
        if (!reproduciendo) return undefined;
        const temporizador = window.setInterval(() => {
            setIndice((actual) => Math.min(actual + 1, Math.max(fotosRef.current.length - 1, 0)));
        }, velocidad);
        return () => window.clearInterval(temporizador);
    }, [reproduciendo, velocidad]);

    useEffect(() => {
        if (reproduciendo && !entrenando && !cargandoHistoria && ultima >= 0 && indice >= ultima) setReproduciendo(false);
    }, [reproduciendo, entrenando, cargandoHistoria, indice, ultima]);

    const entrenar = () => {
        setError('');
        posicionInicial.current = false;
        api.post('/modelo-predictivo/red-neuronal/entrenar', null, { params: { horizonte_dias: horizonte } })
            .then(() => {
                setReproduciendo(true);
                setSesion((actual) => actual + 1);
            })
            .catch((err) => setError(mensajeDeError(err, 'No fue posible iniciar el entrenamiento.')));
    };

    const alternar = () => {
        if (!reproduciendo && indice >= ultima && !entrenando) setIndice(0);
        setReproduciendo(!reproduciendo);
    };

    const mover = (nuevo: number) => {
        setReproduciendo(false);
        setIndice(Math.min(Math.max(nuevo, 0), ultima));
    };

    const inicios = useMemo(() => {
        const primeros: Record<string, number> = {};
        fotos.forEach((foto, i) => { primeros[foto.red] ??= i; });
        return primeros;
    }, [fotos]);

    const fotoActual = fotos[indice];

    return (
        <MainLayout>
            <Head title="Entrenamiento de la red | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8 space-y-5">
                <section className="bg-white border border-verde-3 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-gris-2">Entrenamiento de la red</h1>
                            <p className="text-sm text-gris-1 mt-1">Observa cómo cambian los pesos y las capas en cada época, en vivo o repitiendo el último entrenamiento.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                            <label className="text-xs font-semibold text-gris-1">
                                Horizonte
                                <select value={horizonte} disabled={entrenando} onChange={(e) => setHorizonte(Number(e.target.value))} className="mt-1 block min-w-32 rounded-lg border-verde-3 text-sm text-gris-2 disabled:opacity-60">
                                    <OpcionesHorizonte desdeSemana />
                                </select>
                            </label>
                            <button type="button" onClick={entrenar} disabled={entrenando} className="rounded-lg bg-verde-6 px-4 py-2 text-sm font-bold text-gris-2 hover:opacity-90 disabled:opacity-60">
                                {entrenando ? 'Entrenando…' : 'Entrenar y observar'}
                            </button>
                        </div>
                    </div>

                    {fotoActual && (
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => mover(indice - 1)} aria-label="Época anterior" className="rounded-lg border border-verde-3 px-3 py-1.5 text-sm font-bold text-gris-2">‹</button>
                                <button type="button" onClick={alternar} className="min-w-24 rounded-lg border border-verde-3 px-3 py-1.5 text-sm font-bold text-gris-2">
                                    {reproduciendo ? 'Pausar' : 'Reproducir'}
                                </button>
                                <button type="button" onClick={() => mover(indice + 1)} aria-label="Época siguiente" className="rounded-lg border border-verde-3 px-3 py-1.5 text-sm font-bold text-gris-2">›</button>
                            </div>
                            <input
                                type="range" min={0} max={ultima} value={indice}
                                onChange={(e) => mover(Number(e.target.value))}
                                aria-label="Momento del entrenamiento"
                                className="flex-1 min-w-0 accent-verde-6"
                            />
                            <span className="text-xs font-semibold text-gris-1 whitespace-nowrap">Foto {indice + 1} de {fotos.length}</span>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-gris-1 flex items-center gap-2">
                                    Velocidad
                                    <select value={velocidad} onChange={(e) => setVelocidad(Number(e.target.value))} className="rounded-lg border-verde-3 py-1 text-sm text-gris-2">
                                        {VELOCIDADES.map((v) => <option key={v.milisegundos} value={v.milisegundos}>{v.etiqueta}</option>)}
                                    </select>
                                </label>
                                {Object.keys(inicios).length > 1 && (
                                    <label className="text-xs font-semibold text-gris-1 flex items-center gap-2">
                                        Ver
                                        <select value={fotoActual.red} onChange={(e) => mover(inicios[e.target.value])} className="rounded-lg border-verde-3 py-1 text-sm text-gris-2">
                                            <option value="eventos">Red de eventos</option>
                                            <option value="entidades">Red de entidades</option>
                                        </select>
                                    </label>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {error && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{error}</p>}
                {traza?.estado === 'error' && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">El entrenamiento falló: {traza.mensaje}</p>}
                {traza?.truncada && <p className="rounded-lg border border-verde-3 bg-white p-3 text-sm text-gris-1">Este entrenamiento superó el máximo de fotos guardadas; las últimas épocas no se muestran.</p>}
                {entrenando && fotos.length === 0 && <p className="text-sm text-gris-1" role="status">Preparando los datos del entrenamiento…</p>}
                {cargandoHistoria && <p className="text-sm text-gris-1" role="status">Cargando el entrenamiento: {fotos.length} de {traza?.total} fotos…</p>}
                {traza && !entrenando && traza.total === 0 && traza.estado !== 'error' && (
                    <p className="rounded-lg border border-verde-3 bg-white p-4 text-sm text-gris-1">
                        No hay un entrenamiento registrado para este horizonte. Usa «Entrenar y observar» para verlo en vivo.
                    </p>
                )}

                {fotoActual && traza?.redes?.[fotoActual.red] && (
                    <VisorRed fotos={fotos} indice={indice} redes={traza.redes} bordes={traza.bordes_histograma ?? []} saltar={mover} />
                )}
            </div>
        </MainLayout>
    );
}
