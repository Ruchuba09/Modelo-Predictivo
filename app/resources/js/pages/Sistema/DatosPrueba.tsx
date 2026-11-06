import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { api } from '@/lib/api';

type Conteo = { tabla: string; etiqueta: string; total: number };
type Tamano = { clave: string; etiqueta: string; proyectos: number; cuadrillas: number; trabajadores: number; meses: number };
type Resumen = { habilitado: boolean; tamanos: Tamano[]; datos: Conteo[]; conservados: Conteo[] };
type Respuesta = Resumen & { cambios: Record<string, number> };

const TEXTO_CONFIRMACION = 'LIMPIAR';

function mensajeError(err: unknown): string {
    const datos = (err as { response?: { data?: { message?: string } } }).response?.data;
    return datos?.message ?? 'No se pudo completar la operación.';
}

function Conteos({ titulo, filas }: { titulo: string; filas: Conteo[] }) {
    return (
        <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gris-1 mb-2">{titulo}</h3>
            <dl className="divide-y divide-verde-3">
                {filas.map((fila) => (
                    <div key={fila.tabla} className="flex justify-between gap-3 py-1.5 text-sm">
                        <dt className="text-gris-1">{fila.etiqueta}</dt>
                        <dd className="font-bold text-gris-2">{fila.total.toLocaleString('es-CL')}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

export default function DatosPrueba() {
    const [resumen, setResumen] = useState<Resumen | null>(null);
    const [enCurso, setEnCurso] = useState<string | null>(null);
    const [confirmacion, setConfirmacion] = useState('');
    const [resultado, setResultado] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        api.get<Resumen>('/datos-prueba').then(({ data }) => setResumen(data)).catch((err) => setError(mensajeError(err)));
    }, []);

    const ejecutar = async (accion: string, ruta: string, cuerpo: object, describir: (total: number) => string) => {
        setEnCurso(accion);
        setError('');
        setResultado('');
        try {
            const { data } = await api.post<Respuesta>(ruta, cuerpo, { timeout: 0 });
            setResumen(data);
            setResultado(describir(data.cambios.eventos ?? 0));
            setConfirmacion('');
        } catch (err) {
            setError(mensajeError(err));
        } finally {
            setEnCurso(null);
        }
    };

    const poblar = (tamano: Tamano) =>
        ejecutar(tamano.clave, '/datos-prueba/poblar', { tamano: tamano.clave }, (total) =>
            `Población ${tamano.etiqueta.toLowerCase()} creada: ${total.toLocaleString('es-CL')} eventos nuevos.`);

    const limpiar = () =>
        ejecutar('limpiar', '/datos-prueba/limpiar', { confirmacion }, (total) =>
            `Base limpia: se eliminaron ${total.toLocaleString('es-CL')} eventos y los datos asociados.`);

    const ocupado = enCurso !== null;
    const habilitado = resumen?.habilitado ?? false;

    return (
        <MainLayout>
            <Head title="Datos de prueba | AVA" />

            <div className="max-w-[1100px] mx-auto p-6 lg:p-8 space-y-6">
                {error && <p className="rounded-lg border border-rojo-1/30 bg-red-50 p-3 text-sm text-rojo-1" role="alert">{error}</p>}
                {resultado && <p className="rounded-lg border border-verde-3 bg-verde-1 p-3 text-sm text-gris-2" role="status">{resultado}</p>}
                {enCurso && <p className="text-sm text-gris-1" role="status">Procesando. Puede tardar unos segundos; no cierres esta página.</p>}
                {resumen && !habilitado && (
                    <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="status">
                        Esta herramienta está deshabilitada en producción.
                    </p>
                )}

                <section className="bg-white border border-verde-3 rounded-2xl shadow-md p-6">
                    <h2 className="text-lg font-bold text-gris-2">Poblar la base de datos</h2>
                    <p className="text-xs text-gris-1 mt-1">
                        Cada botón agrega un lote nuevo sobre lo existente, con datos ficticios en todas las fuentes. Incluyen un patrón simulado: las métricas del modelo con estos datos no representan el riesgo real de AVA.
                    </p>
                    <div className="grid gap-4 md:grid-cols-3 mt-4">
                        {resumen?.tamanos.map((tamano) => (
                            <div key={tamano.clave} className="border border-verde-3 rounded-xl p-4 flex flex-col gap-3">
                                <div>
                                    <h3 className="font-bold text-gris-2">{tamano.etiqueta}</h3>
                                    <p className="text-xs text-gris-1 mt-1">
                                        {tamano.proyectos} proyectos, {tamano.cuadrillas} cuadrillas, cerca de {tamano.trabajadores} trabajadores y {tamano.meses} meses de historial.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={ocupado || !habilitado}
                                    onClick={() => poblar(tamano)}
                                    className="mt-auto px-4 py-2 rounded-lg text-sm font-bold bg-verde-5 hover:bg-verde-6 text-black disabled:opacity-50"
                                >
                                    {enCurso === tamano.clave ? 'Poblando...' : `Poblar ${tamano.etiqueta.toLowerCase()}`}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="grid gap-6 md:grid-cols-2 items-start">
                    <section className="bg-white border border-verde-3 rounded-2xl shadow-md p-6 space-y-4">
                        <h2 className="text-lg font-bold text-gris-2">Contenido actual</h2>
                        {resumen && <Conteos titulo="Datos" filas={resumen.datos} />}
                        {resumen && <Conteos titulo="Se conservan al limpiar" filas={resumen.conservados} />}
                    </section>

                    <section className="bg-white border border-rojo-1/40 rounded-2xl shadow-md p-6 space-y-3">
                        <h2 className="text-lg font-bold text-rojo-1">Limpiar la base de datos</h2>
                        <p className="text-sm text-gris-2">
                            Borra proyectos, cuadrillas, trabajadores, eventos, reportes y catálogos editables. Esta acción no se puede deshacer.
                        </p>
                        <ul className="list-disc pl-5 text-xs text-gris-1 space-y-1">
                            <li>Se conservan usuarios, roles y permisos.</li>
                            <li>También se conserva la persona y el trabajador de cada cuenta, porque sin ellos no podría iniciar sesión.</li>
                            <li>Se mantienen los catálogos de referencia (severidad, turnos, lesiones) y el historial importado de AVA.</li>
                            <li>Los tipos de evento básicos se vuelven a crear para que el sistema siga funcionando.</li>
                        </ul>
                        <label className="block text-xs font-semibold text-gris-1">
                            Escribe {TEXTO_CONFIRMACION} para confirmar
                            <input
                                value={confirmacion}
                                onChange={(e) => setConfirmacion(e.target.value)}
                                autoComplete="off"
                                className="mt-1 block w-full rounded-lg border-verde-3 text-sm text-gris-2"
                            />
                        </label>
                        <button
                            type="button"
                            disabled={ocupado || !habilitado || confirmacion !== TEXTO_CONFIRMACION}
                            onClick={limpiar}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-rojo-1 text-white hover:opacity-90 disabled:opacity-50"
                        >
                            {enCurso === 'limpiar' ? 'Limpiando...' : 'Limpiar base de datos'}
                        </button>
                    </section>
                </div>
            </div>
        </MainLayout>
    );
}
