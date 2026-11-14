import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';
import {
    BotonesFormulario,
    CAMPO,
    CampoEvidencia,
    CamposFechaTurno,
    CamposReportado,
    DatosFormularioEvento,
    ETIQUETA,
    MensajeError,
    ahoraLocal,
    cancelarRegistro,
    useReportado,
} from '../../components/eventos/FormularioEvento';
import MainLayout from '../../layouts/MainLayout';
import { useCondicionesPare } from '../../lib/condicionesPare';

const CONDICIONES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Registro de Tarjeta PARE (RF-9). El tipo de evento lo fija el servidor. */
export default function CrearTarjetaPare() {
    const condicionesPare = useCondicionesPare();
    const datos = usePage().props as unknown as DatosFormularioEvento;
    const { usuarioTrabajador = null, actividadesPorProyecto = {}, catalogos } = datos;

    const { data, setData, post, processing, errors, reset } = useForm({
        es_para_mi: true as boolean,
        id_trabajador: (usuarioTrabajador?.id_trabajador ?? '') as number | '',
        id_proyecto: '' as number | '',
        id_area: '' as number | '',
        id_actividad: '' as number | '',
        condicion: 0,
        referencia: '',
        descripcion: '',
        tipo_detencion: 'sin_detencion',
        fecha_ocurrencia: ahoraLocal(),
        id_turno: '' as number | '',
        id_potencial_severidad: '' as number | '',
        dia_ciclo: '' as number | '',
        evidencia: [] as File[],
    });
    const errores = errors as Partial<Record<string, string>>;

    const { proyectosDisponibles, areasDisponibles, cambiarModo } = useReportado(data, setData, datos);
    const actividades = data.id_proyecto ? actividadesPorProyecto[Number(data.id_proyecto)] ?? [] : [];

    const enviar = (e: FormEvent) => {
        e.preventDefault();
        post('/tarjetas-pare');
    };

    return (
        <MainLayout>
            <Head title="Nueva Tarjeta PARE | AVA" />

            <div className="max-w-[1400px] mx-auto p-4 lg:p-6 lg:mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-verde-3 rounded-xl p-6 shadow-2xl h-full flex flex-col justify-between">
                        <form onSubmit={enviar} className="space-y-4">
                            <p className="text-[12px] text-gris-1">
                                ¿Es otro tipo de evento (incidente, hallazgo, etc.)?{' '}
                                <Link href="/eventos/create" className="font-semibold text-verde-6 hover:underline">
                                    Registrar evento
                                </Link>
                            </p>

                            <CamposReportado
                                data={data}
                                errors={errores}
                                datos={datos}
                                proyectosDisponibles={proyectosDisponibles}
                                areasDisponibles={areasDisponibles}
                                cambiarModo={cambiarModo}
                                onCampo={(campo, valor) => setData(campo, valor)}
                            />

                            <div>
                                <label htmlFor="referencia" className={ETIQUETA}>Lugar exacto</label>
                                <input
                                    id="referencia"
                                    type="text"
                                    required
                                    maxLength={255}
                                    value={data.referencia}
                                    onChange={(e) => setData('referencia', e.target.value)}
                                    placeholder="Ej: Chancador primario, Nivel 4..."
                                    className={CAMPO}
                                />
                                <MensajeError mensaje={errores.referencia} />
                            </div>

                            <CamposFechaTurno
                                fecha={data.fecha_ocurrencia}
                                idTurno={data.id_turno}
                                turnos={catalogos?.turnos ?? []}
                                errors={errores}
                                onFecha={(valor) => setData('fecha_ocurrencia', valor)}
                                onTurno={(valor) => setData('id_turno', valor)}
                            />

                            {actividades.length > 0 && (
                                <div>
                                    <label htmlFor="id_actividad" className={ETIQUETA}>Actividad en ejecución</label>
                                    <select
                                        id="id_actividad"
                                        value={data.id_actividad}
                                        onChange={(e) => setData('id_actividad', e.target.value ? Number(e.target.value) : '')}
                                        className={CAMPO}
                                    >
                                        <option value="">Sin indicar</option>
                                        {actividades.map((a) => (
                                            <option key={a.id_actividad} value={a.id_actividad}>{a.nombre}</option>
                                        ))}
                                    </select>
                                    <MensajeError mensaje={errores.id_actividad} />
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <label htmlFor="tipo_detencion" className={ETIQUETA}>Detención del trabajo</label>
                                    <select
                                        id="tipo_detencion"
                                        value={data.tipo_detencion}
                                        onChange={(e) => setData('tipo_detencion', e.target.value)}
                                        className={CAMPO}
                                    >
                                        <option value="sin_detencion">Sin detención</option>
                                        <option value="parcial">Parcial</option>
                                        <option value="total">Total</option>
                                    </select>
                                    <MensajeError mensaje={errores.tipo_detencion} />
                                </div>
                                <div>
                                    <label htmlFor="id_potencial_severidad" className={ETIQUETA}>Lo que pudo haber pasado</label>
                                    <select
                                        id="id_potencial_severidad"
                                        value={data.id_potencial_severidad}
                                        onChange={(e) => setData('id_potencial_severidad', e.target.value ? Number(e.target.value) : '')}
                                        className={CAMPO}
                                    >
                                        <option value="">Sin indicar</option>
                                        {catalogos?.severidades.map((s) => (
                                            <option key={s.id_severidad} value={s.id_severidad}>{s.nombre}</option>
                                        ))}
                                    </select>
                                    <MensajeError mensaje={errores.id_potencial_severidad} />
                                </div>
                                <div>
                                    <label htmlFor="dia_ciclo" className={ETIQUETA}>Día del turno (ej. 10 de 14)</label>
                                    <input
                                        id="dia_ciclo"
                                        type="number"
                                        min={1}
                                        max={30}
                                        value={data.dia_ciclo}
                                        onChange={(e) => setData('dia_ciclo', e.target.value ? Number(e.target.value) : '')}
                                        className={CAMPO}
                                    />
                                    <MensajeError mensaje={errores.dia_ciclo} />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="condicion" className={ETIQUETA}>Condición PARE</label>
                                <select
                                    id="condicion"
                                    required
                                    value={data.condicion || ''}
                                    onChange={(e) => setData('condicion', Number(e.target.value))}
                                    className={`${CAMPO} cursor-pointer`}
                                >
                                    <option value="">Seleccione la condición identificada</option>
                                    {CONDICIONES.map((num) => (
                                        <option key={num} value={num}>
                                            {num.toString().padStart(2, '0')}. {condicionesPare[num]}
                                        </option>
                                    ))}
                                </select>
                                <MensajeError mensaje={errores.condicion} />
                            </div>

                            <div>
                                <label htmlFor="descripcion" className={ETIQUETA}>Descripción detallada</label>
                                <textarea
                                    id="descripcion"
                                    rows={3}
                                    required
                                    maxLength={500}
                                    value={data.descripcion}
                                    onChange={(e) => setData('descripcion', e.target.value)}
                                    placeholder="Describe el contexto del hallazgo..."
                                    className={`${CAMPO} resize-none`}
                                ></textarea>
                                <div className="flex justify-between mt-1">
                                    <MensajeError mensaje={errores.descripcion} />
                                    <span className={`text-[11px] font-bold ml-auto ${data.descripcion.length >= 500 ? 'text-rojo-1' : 'text-gris-1'}`}>
                                        {data.descripcion.length} / 500
                                    </span>
                                </div>
                            </div>

                            <CampoEvidencia
                                archivos={data.evidencia}
                                errors={errores}
                                onCambio={(archivos) => setData('evidencia', archivos)}
                            />

                            <BotonesFormulario
                                procesando={processing}
                                texto="Registrar Tarjeta PARE"
                                errorGeneral={errores.general}
                                onCancelar={() => cancelarRegistro(reset)}
                            />
                        </form>
                    </div>

                    {/* Guía de condiciones: al hacer clic se selecciona la condición. */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-verde-3 rounded-xl p-4 shadow-xl flex flex-col h-full">
                            <h3 className="text-[13px] font-bold text-gris-2 uppercase tracking-wider mb-3">Guía de Condiciones</h3>
                            <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                {CONDICIONES.map((num) => (
                                    <div
                                        key={num}
                                        onClick={() => setData('condicion', num)}
                                        className={`px-3 py-2 rounded-lg border text-[13px] leading-tight transition-colors duration-300 flex gap-2 cursor-pointer ${
                                            data.condicion === num
                                                ? 'bg-verde-5/10 border-verde-5/50 text-gris-2 shadow-inner'
                                                : 'bg-verde-1 border-verde-3/50 text-gris-1 hover:border-gris-1/50'
                                        }`}
                                    >
                                        <div className={`font-black shrink-0 ${data.condicion === num ? 'text-verde-6' : 'text-gray-600'}`}>
                                            {num.toString().padStart(2, '0')}.
                                        </div>
                                        <div>{condicionesPare[num]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
