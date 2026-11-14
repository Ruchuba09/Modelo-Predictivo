import { Head, router, useForm, usePage } from '@inertiajs/react';
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

const aNumero = (valor: string): number | '' => (valor ? Number(valor) : '');

/**
 * Registro de eventos de tipo distinto a Tarjeta PARE (RF-10). Si se elige
 * Tarjeta PARE, se redirige a su propio formulario (RF-9).
 */
export default function Create() {
    const datos = usePage().props as unknown as DatosFormularioEvento;
    const { tiposEvento = [], usuarioTrabajador = null, idTipoPare = null, actividadesPorProyecto = {}, catalogos } = datos;

    const tipoInicial = tiposEvento.find((t) => t.id_tipo_evento !== idTipoPare)?.id_tipo_evento ?? '';

    const { data, setData, post, processing, errors, reset, transform } = useForm({
        id_tipo_evento: tipoInicial as number | '',
        es_para_mi: true as boolean,
        id_trabajador: (usuarioTrabajador?.id_trabajador ?? '') as number | '',
        id_proyecto: '' as number | '',
        id_area: '' as number | '',
        id_actividad: '' as number | '',
        referencia: '',
        descripcion: '',
        fecha_ocurrencia: ahoraLocal(),
        id_turno: '' as number | '',
        id_severidad: '' as number | '',
        id_potencial_severidad: '' as number | '',
        id_categoria_evento: '' as number | '',
        dia_ciclo: '' as number | '',
        id_clasificacion_incidente: '' as number | '',
        evidencia: [] as File[],
    });
    const errores = errors as Partial<Record<string, string>>;

    const { proyectosDisponibles, areasDisponibles, cambiarModo } = useReportado(data, setData, datos);
    const esIncidente = Boolean(tiposEvento.find((t) => t.id_tipo_evento === Number(data.id_tipo_evento))?.es_incidente);
    const actividades = data.id_proyecto ? actividadesPorProyecto[Number(data.id_proyecto)] ?? [] : [];

    const cambiarTipo = (valor: string) => {
        if (Number(valor) === idTipoPare) {
            router.visit('/tarjetas-pare/create');
            return;
        }
        setData('id_tipo_evento', aNumero(valor));
    };

    const enviar = (e: FormEvent) => {
        e.preventDefault();
        transform((d) => ({ ...d, id_clasificacion_incidente: esIncidente ? d.id_clasificacion_incidente : '' }));
        post('/eventos');
    };

    return (
        <MainLayout>
            <Head title="Registro de Evento | AVA" />

            <div className="max-w-3xl mx-auto p-4 lg:p-6 lg:mt-0">
                <div className="bg-white border border-verde-3 rounded-xl p-6 shadow-2xl">
                    <form onSubmit={enviar} className="space-y-4">
                        <div>
                            <label htmlFor="id_tipo_evento" className={ETIQUETA}>Tipo de evento</label>
                            <select
                                id="id_tipo_evento"
                                required
                                value={data.id_tipo_evento}
                                onChange={(e) => cambiarTipo(e.target.value)}
                                className={CAMPO}
                            >
                                {tiposEvento.map((tipo) => (
                                    <option key={tipo.id_tipo_evento} value={tipo.id_tipo_evento}>
                                        {tipo.nombre}
                                        {tipo.id_tipo_evento === idTipoPare ? ' (abre su propio formulario)' : ''}
                                    </option>
                                ))}
                            </select>
                            <MensajeError mensaje={errores.id_tipo_evento} />
                        </div>

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
                                    onChange={(e) => setData('id_actividad', aNumero(e.target.value))}
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

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="id_severidad" className={ETIQUETA}>Severidad real</label>
                                <select
                                    id="id_severidad"
                                    value={data.id_severidad}
                                    onChange={(e) => setData('id_severidad', aNumero(e.target.value))}
                                    className={CAMPO}
                                >
                                    <option value="">Sin indicar</option>
                                    {catalogos?.severidades.map((s) => (
                                        <option key={s.id_severidad} value={s.id_severidad}>{s.nombre}</option>
                                    ))}
                                </select>
                                <MensajeError mensaje={errores.id_severidad} />
                            </div>
                            <div>
                                <label htmlFor="id_potencial_severidad" className={ETIQUETA}>Lo que pudo haber pasado</label>
                                <select
                                    id="id_potencial_severidad"
                                    value={data.id_potencial_severidad}
                                    onChange={(e) => setData('id_potencial_severidad', aNumero(e.target.value))}
                                    className={CAMPO}
                                >
                                    <option value="">Sin indicar</option>
                                    {catalogos?.severidades.map((s) => (
                                        <option key={s.id_severidad} value={s.id_severidad}>{s.nombre}</option>
                                    ))}
                                </select>
                                <MensajeError mensaje={errores.id_potencial_severidad} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="id_categoria_evento" className={ETIQUETA}>Tipo de contacto</label>
                                <select
                                    id="id_categoria_evento"
                                    value={data.id_categoria_evento}
                                    onChange={(e) => setData('id_categoria_evento', aNumero(e.target.value))}
                                    className={CAMPO}
                                >
                                    <option value="">Sin indicar</option>
                                    {catalogos?.categorias.map((c) => (
                                        <option key={c.id_categoria_evento} value={c.id_categoria_evento}>{c.nombre}</option>
                                    ))}
                                </select>
                                <MensajeError mensaje={errores.id_categoria_evento} />
                            </div>
                            <div>
                                <label htmlFor="dia_ciclo" className={ETIQUETA}>Día del turno (ej. 10 de 14)</label>
                                <input
                                    id="dia_ciclo"
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={data.dia_ciclo}
                                    onChange={(e) => setData('dia_ciclo', aNumero(e.target.value))}
                                    className={CAMPO}
                                />
                                <MensajeError mensaje={errores.dia_ciclo} />
                            </div>
                        </div>

                        {esIncidente && (
                            <div>
                                <label htmlFor="id_clasificacion_incidente" className={ETIQUETA}>Clasificación</label>
                                <select
                                    id="id_clasificacion_incidente"
                                    value={data.id_clasificacion_incidente}
                                    onChange={(e) => setData('id_clasificacion_incidente', aNumero(e.target.value))}
                                    className={CAMPO}
                                >
                                    <option value="">Sin clasificar</option>
                                    {catalogos?.clasificaciones.map((c) => (
                                        <option key={c.id_clasificacion_incidente} value={c.id_clasificacion_incidente}>
                                            {c.codigo} · {c.nombre}
                                        </option>
                                    ))}
                                </select>
                                <MensajeError mensaje={errores.id_clasificacion_incidente} />
                            </div>
                        )}

                        <div>
                            <label htmlFor="descripcion" className={ETIQUETA}>Descripción detallada</label>
                            <textarea
                                id="descripcion"
                                rows={3}
                                required
                                maxLength={500}
                                value={data.descripcion}
                                onChange={(e) => setData('descripcion', e.target.value)}
                                placeholder="Describe lo ocurrido..."
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
                            texto="Registrar evento"
                            errorGeneral={errores.general}
                            onCancelar={() => cancelarRegistro(reset)}
                        />
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
