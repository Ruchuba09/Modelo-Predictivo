import { router } from '@inertiajs/react';
import { ChangeEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

/*
 * Piezas compartidas por los formularios de registro de Tarjeta PARE (RF-9)
 * y de eventos de otros tipos (RF-10).
 */

export interface ProyectoItem {
    id_proyecto: number;
    nombre: string;
}

export interface AreaItem {
    id_area: number;
    nombre: string;
}

export interface TrabajadorItem {
    id_trabajador: number;
    nombre: string;
    rut?: string;
    cargo?: string;
    proyectos: ProyectoItem[];
}

export interface UsuarioTrabajador {
    id_trabajador: number;
    nombre: string;
    cargo?: string;
    proyectos: ProyectoItem[];
}

export interface Catalogos {
    severidades: { id_severidad: number; nombre: string }[];
    turnos: { id_turno: number; nombre: string }[];
    categorias: { id_categoria_evento: number; nombre: string }[];
    clasificaciones: { id_clasificacion_incidente: number; codigo: string; nombre: string }[];
}

/** Props que entrega EventoService::obtenerDatosFormularioCrear a ambos formularios. */
export interface DatosFormularioEvento {
    tiposEvento: { id_tipo_evento: number; nombre: string; es_incidente?: boolean }[];
    usuarioTrabajador?: UsuarioTrabajador | null;
    trabajadores?: TrabajadorItem[];
    proyectos?: ProyectoItem[];
    idTipoPare?: number | null;
    areasPorProyecto?: Record<number, AreaItem[]>;
    actividadesPorProyecto?: Record<number, { id_actividad: number; nombre: string }[]>;
    catalogos?: Catalogos;
}

export type Errores = Partial<Record<string, string>>;

export const CAMPO =
    'w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2 text-[15px] text-gris-2 focus:outline-none focus:border-verde-5 transition-colors disabled:opacity-50';
export const ETIQUETA = 'block text-[13px] font-bold uppercase tracking-wider text-gris-1 mb-1';

export function ahoraLocal(): string {
    const ahora = new Date();
    return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function MensajeError({ mensaje }: { mensaje?: string }) {
    return mensaje ? <p className="text-red-400 text-xs mt-1">{mensaje}</p> : null;
}

/* ------------------------- Persona reportada y lugar ------------------------- */

interface DatosReportado {
    es_para_mi: boolean;
    id_trabajador: number | '';
    id_proyecto: number | '';
    id_area: number | '';
}

/**
 * Lógica de "para mí / para un tercero", proyecto y área: calcula los
 * proyectos del trabajador reportado y las áreas de la faena del proyecto, y
 * mantiene la selección coherente cuando cambian.
 */
export function useReportado<T extends DatosReportado>(
    data: T,
    setData: (actualizar: (previo: T) => T) => void,
    { usuarioTrabajador, trabajadores = [], proyectos = [], areasPorProyecto = {} }: DatosFormularioEvento,
) {
    const proyectosDisponibles: ProyectoItem[] = useMemo(() => {
        const trabajador = data.es_para_mi
            ? usuarioTrabajador
            : trabajadores.find((t) => t.id_trabajador === Number(data.id_trabajador));
        if (!data.es_para_mi && !trabajador) return [];
        return trabajador?.proyectos?.length ? trabajador.proyectos : proyectos;
    }, [data.es_para_mi, data.id_trabajador, usuarioTrabajador, trabajadores, proyectos]);

    useEffect(() => {
        const sigue = proyectosDisponibles.some((p) => p.id_proyecto === Number(data.id_proyecto));
        if (!sigue) {
            setData((previo) => ({ ...previo, id_proyecto: proyectosDisponibles[0]?.id_proyecto ?? '' }));
        }
    }, [proyectosDisponibles]);

    const areasDisponibles: AreaItem[] = useMemo(
        () => (data.id_proyecto ? areasPorProyecto[Number(data.id_proyecto)] ?? [] : []),
        [data.id_proyecto, areasPorProyecto],
    );

    // Al cambiar de proyecto, el área anterior puede no pertenecer a su faena.
    useEffect(() => {
        if (!areasDisponibles.some((a) => a.id_area === Number(data.id_area))) {
            setData((previo) => ({ ...previo, id_area: areasDisponibles.length === 1 ? areasDisponibles[0].id_area : '' }));
        }
    }, [areasDisponibles]);

    const cambiarModo = (paraMi: boolean) =>
        setData((previo) => ({
            ...previo,
            es_para_mi: paraMi,
            id_trabajador: paraMi ? usuarioTrabajador?.id_trabajador ?? '' : '',
        }));

    return { proyectosDisponibles, areasDisponibles, cambiarModo };
}

interface CamposReportadoProps {
    data: DatosReportado;
    errors: Errores;
    datos: DatosFormularioEvento;
    proyectosDisponibles: ProyectoItem[];
    areasDisponibles: AreaItem[];
    cambiarModo: (paraMi: boolean) => void;
    onCampo: (campo: 'id_trabajador' | 'id_proyecto' | 'id_area', valor: number | '') => void;
}

function BotonModo({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all ${
                activo
                    ? 'bg-verde-5/20 border-verde-5 text-verde-6 shadow-sm ring-1 ring-verde-5/30'
                    : 'bg-verde-1 border-verde-3 text-gris-1 hover:border-gris-2 hover:text-gris-2'
            }`}
        >
            {children}
        </button>
    );
}

const aNumero = (valor: string): number | '' => (valor ? Number(valor) : '');

export function CamposReportado({
    data,
    errors,
    datos,
    proyectosDisponibles,
    areasDisponibles,
    cambiarModo,
    onCampo,
}: CamposReportadoProps) {
    const { usuarioTrabajador, trabajadores = [] } = datos;

    return (
        <>
            <div>
                <label className={ETIQUETA}>¿Para quién es el reporte?</label>
                <div className="grid grid-cols-2 gap-3">
                    <BotonModo activo={data.es_para_mi} onClick={() => cambiarModo(true)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Para mí
                    </BotonModo>
                    <BotonModo activo={!data.es_para_mi} onClick={() => cambiarModo(false)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Para un tercero
                    </BotonModo>
                </div>
                {data.es_para_mi && usuarioTrabajador && (
                    <p className="text-[11px] text-gris-1 mt-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-verde-6 shrink-0"></span>
                        Reportando como: <span className="font-semibold text-gris-2">{usuarioTrabajador.nombre}</span>
                        {usuarioTrabajador.cargo ? ` (${usuarioTrabajador.cargo})` : ''}
                    </p>
                )}
                <MensajeError mensaje={errors.es_para_mi} />
            </div>

            {!data.es_para_mi && (
                <div>
                    <label htmlFor="id_trabajador" className={ETIQUETA}>Persona reportada</label>
                    <select
                        id="id_trabajador"
                        required
                        value={data.id_trabajador}
                        onChange={(e) => onCampo('id_trabajador', aNumero(e.target.value))}
                        className={`${CAMPO} cursor-pointer`}
                    >
                        <option value="">Selecciona a la persona reportada...</option>
                        {trabajadores.map((t) => (
                            <option key={t.id_trabajador} value={t.id_trabajador}>
                                {t.nombre} {t.rut ? `(${t.rut})` : ''} - {t.cargo || 'Trabajador'}
                            </option>
                        ))}
                    </select>
                    <MensajeError mensaje={errors.id_trabajador} />
                </div>
            )}

            <div>
                <label htmlFor="id_proyecto" className={ETIQUETA}>Proyecto</label>
                {proyectosDisponibles.length === 1 ? (
                    <div className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2 flex items-center justify-between text-gris-2">
                        <span className="text-[15px] font-semibold text-gris-2">{proyectosDisponibles[0].nombre}</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-verde-5/15 text-verde-6 border border-verde-5/30 shrink-0">
                            Proyecto asignado
                        </span>
                    </div>
                ) : proyectosDisponibles.length > 1 ? (
                    <>
                        <select
                            id="id_proyecto"
                            required
                            value={data.id_proyecto}
                            onChange={(e) => onCampo('id_proyecto', aNumero(e.target.value))}
                            className={`${CAMPO} cursor-pointer`}
                        >
                            <option value="">Selecciona el proyecto asignado...</option>
                            {proyectosDisponibles.map((p) => (
                                <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>
                            ))}
                        </select>
                        <p className="text-[11px] text-gris-1 mt-1">
                            El trabajador participa en más de un proyecto. Selecciona en cuál ocurrió el evento.
                        </p>
                    </>
                ) : (
                    <div className="w-full bg-verde-1/50 border border-verde-3/60 rounded-lg px-3 py-2 text-[14px] text-gris-1 italic">
                        {!data.es_para_mi && !data.id_trabajador
                            ? 'Selecciona a la persona reportada para cargar sus proyectos disponibles.'
                            : 'No se encontraron proyectos asignados para este trabajador.'}
                    </div>
                )}
                <MensajeError mensaje={errors.id_proyecto} />
            </div>

            {areasDisponibles.length > 0 && (
                <div>
                    <label htmlFor="id_area" className={ETIQUETA}>Área</label>
                    <select
                        id="id_area"
                        required
                        value={data.id_area}
                        onChange={(e) => onCampo('id_area', aNumero(e.target.value))}
                        className={`${CAMPO} cursor-pointer`}
                    >
                        <option value="">Selecciona el área...</option>
                        {areasDisponibles.map((a) => (
                            <option key={a.id_area} value={a.id_area}>{a.nombre}</option>
                        ))}
                    </select>
                </div>
            )}
            <MensajeError mensaje={errors.id_area} />
        </>
    );
}

/* ------------------------------ Fecha y turno ------------------------------ */

function turnoSugerido(fecha: string, turnos: Catalogos['turnos']): number | '' {
    const hora = Number(fecha.slice(11, 13));
    const nombre = hora >= 20 || hora < 6 ? 'noche' : 'día';
    return turnos.find((t) => t.nombre.toLowerCase() === nombre)?.id_turno ?? '';
}

interface CamposFechaTurnoProps {
    fecha: string;
    idTurno: number | '';
    turnos: Catalogos['turnos'];
    errors: Errores;
    onFecha: (valor: string) => void;
    onTurno: (valor: number | '') => void;
}

/**
 * Fecha de ocurrencia (opcional) y turno. El turno se propone según la hora y
 * queda vacío y deshabilitado si no hay fecha.
 */
export function CamposFechaTurno({ fecha, idTurno, turnos, errors, onFecha, onTurno }: CamposFechaTurnoProps) {
    useEffect(() => {
        onTurno(fecha ? turnoSugerido(fecha, turnos) : '');
    }, [fecha]);

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div>
                <label htmlFor="fecha_ocurrencia" className={ETIQUETA}>Fecha y hora en que ocurrió</label>
                <input
                    id="fecha_ocurrencia"
                    type="datetime-local"
                    value={fecha}
                    onChange={(e) => onFecha(e.target.value)}
                    className={CAMPO}
                />
                <MensajeError mensaje={errors.fecha_ocurrencia} />
            </div>
            <div>
                <label htmlFor="id_turno" className={ETIQUETA}>Turno</label>
                <select
                    id="id_turno"
                    value={idTurno}
                    disabled={!fecha}
                    onChange={(e) => onTurno(aNumero(e.target.value))}
                    className={CAMPO}
                >
                    <option value="">{fecha ? 'Sin indicar' : 'Indique primero la fecha'}</option>
                    {turnos.map((t) => (
                        <option key={t.id_turno} value={t.id_turno}>{t.nombre}</option>
                    ))}
                </select>
                <MensajeError mensaje={errors.id_turno} />
            </div>
        </div>
    );
}

/* -------------------------------- Evidencias -------------------------------- */

const MAX_ARCHIVOS = 3;
const MAX_BYTES = 5120 * 1024;
const EXTENSIONES = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'];

interface CampoEvidenciaProps {
    archivos: File[];
    errors: Errores;
    onCambio: (archivos: File[]) => void;
}

/** Hasta 3 archivos jpg/jpeg/png/pdf/doc/docx de 5 MB; los inválidos se rechazan al elegirlos. */
export function CampoEvidencia({ archivos, errors, onCambio }: CampoEvidenciaProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [aviso, setAviso] = useState('');

    const agregar = (e: ChangeEvent<HTMLInputElement>) => {
        const nuevos = Array.from(e.target.files || []);
        if (inputRef.current) inputRef.current.value = '';

        const formatoInvalido = nuevos.find((f) => !EXTENSIONES.includes(f.name.split('.').pop()?.toLowerCase() ?? ''));
        const muyGrande = nuevos.find((f) => f.size > MAX_BYTES);
        if (archivos.length + nuevos.length > MAX_ARCHIVOS) {
            setAviso(`Puede adjuntar un máximo de ${MAX_ARCHIVOS} archivos.`);
        } else if (formatoInvalido) {
            setAviso(`"${formatoInvalido.name}": los archivos deben ser jpg, jpeg, png, pdf, doc o docx.`);
        } else if (muyGrande) {
            setAviso(`"${muyGrande.name}": cada archivo puede pesar como máximo 5 MB.`);
        } else {
            setAviso('');
            onCambio([...archivos, ...nuevos]);
        }
    };

    const quitar = (indice: number) => {
        setAviso('');
        onCambio(archivos.filter((_, i) => i !== indice));
    };

    const errorServidor = Object.entries(errors).find(([campo]) => campo.startsWith('evidencia'))?.[1];

    return (
        <div>
            <label className={ETIQUETA}>Evidencia adjunta (máx. {MAX_ARCHIVOS} archivos de 5 MB)</label>
            {archivos.length < MAX_ARCHIVOS && (
                <input
                    type="file"
                    multiple
                    ref={inputRef}
                    accept={EXTENSIONES.map((ext) => `.${ext}`).join(',')}
                    onChange={agregar}
                    className="w-full max-w-sm bg-verde-1 border border-verde-3 rounded-lg px-2 py-1.5 text-sm text-gris-2 focus:outline-none focus:border-verde-5 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[13px] file:font-bold file:bg-verde-5/10 file:text-verde-6 hover:file:bg-verde-5/20 cursor-pointer transition-colors"
                />
            )}
            {archivos.length > 0 && (
                <div className="flex flex-row flex-wrap gap-2 mt-2">
                    {archivos.map((archivo, indice) => (
                        <div
                            key={indice}
                            className="flex items-center gap-2 bg-verde-1 border border-verde-5/50 px-3 py-1.5 rounded-lg max-w-[200px]"
                        >
                            <span className="text-sm shrink-0">📎</span>
                            <span className="text-xs text-verde-6 font-medium truncate flex-1">{archivo.name}</span>
                            <button
                                type="button"
                                onClick={() => quitar(indice)}
                                className="text-rojo-1 text-sm font-black hover:scale-110 transition-transform shrink-0"
                                title="Quitar archivo"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <MensajeError mensaje={aviso || errorServidor} />
        </div>
    );
}

/* --------------------------------- Botones --------------------------------- */

interface BotonesFormularioProps {
    procesando: boolean;
    texto: string;
    errorGeneral?: string;
    onCancelar: () => void;
}

export function BotonesFormulario({ procesando, texto, errorGeneral, onCancelar }: BotonesFormularioProps) {
    return (
        <>
            {errorGeneral && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">{errorGeneral}</p>
            )}
            <div className="pt-4 border-t border-verde-3 mt-4 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancelar}
                    disabled={procesando}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold border border-verde-3 text-gris-1 hover:text-gris-2 hover:border-gris-2 transition-colors disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={procesando}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold bg-verde-5 hover:bg-verde-6 text-black transition-colors shadow-lg shadow-verde-5/20 flex items-center gap-2 disabled:opacity-50"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {procesando ? 'Guardando...' : texto}
                </button>
            </div>
        </>
    );
}

/** Cancelar (RF-9.6 / RF-10.4): descarta lo ingresado y vuelve al inicio. */
export function cancelarRegistro(limpiar: () => void) {
    limpiar();
    router.visit('/');
}
