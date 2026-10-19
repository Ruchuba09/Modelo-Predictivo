import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';

interface ProyectoItem {
    id_proyecto: number;
    nombre: string;
}

interface TrabajadorItem {
    id_trabajador: number;
    nombre: string;
    nombre_completo?: string;
    rut?: string;
    cargo?: string;
    proyectos: ProyectoItem[];
}

interface UsuarioTrabajador {
    id_trabajador: number;
    nombre: string;
    cargo?: string;
    proyectos: ProyectoItem[];
}

interface CreatePageProps {
    tiposEvento: any[];
    usuarioTrabajador?: UsuarioTrabajador | null;
    trabajadores?: TrabajadorItem[];
    proyectos?: ProyectoItem[];
}

const condicionesPare: { [key: number]: string } = {
    1: 'Si las condiciones de trabajo NO son seguras.',
    2: 'Si NO tiene las herramientas adecuadas o están en mal estado.',
    3: 'Si NO tiene los EPP adecuados.',
    4: 'Si NO sabe o no está capacitado / autorizado para realizar la actividad.',
    5: 'Si NO hay un procedimiento / instructivo asociado a la actividad o si este existe pero no ha sido difundido.',
    6: 'NO contar con el apoyo de recursos humanos y/o materiales necesarios para realizar la actividad.',
    7: 'NO contar con AST, VATS, ERT.',
    8: 'NO contar con el o los permisos exigidos para realizar la actividad.',
    9: 'NO encontrarse en condiciones físicas o emocionales para realizar la actividad.',
    10: 'Otras condiciones no consideradas que impliquen un riesgo no controlado.',
};

export default function Create() {
    const {
        tiposEvento = [],
        usuarioTrabajador = null,
        trabajadores = [],
        proyectos = [],
    } = usePage().props as unknown as CreatePageProps;

    const [esParaMi, setEsParaMi] = useState<boolean>(true);

    const { data, setData, post, processing, errors } = useForm({
        id_tipo_evento: 4, // 4 = Tarjeta PARE (Accidente)
        condicion: 0,
        descripcion: '',
        referencia: '',
        id_proyecto: '' as number | '',
        id_trabajador: (usuarioTrabajador?.id_trabajador || '') as number | '',
        es_para_mi: true,
        evidencia: [] as File[],
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Calcular proyectos disponibles según el trabajador activo
    const proyectosDisponibles: ProyectoItem[] = useMemo(() => {
        if (esParaMi) {
            if (usuarioTrabajador?.proyectos && usuarioTrabajador.proyectos.length > 0) {
                return usuarioTrabajador.proyectos;
            }
            return proyectos || [];
        } else {
            if (!data.id_trabajador) {
                return [];
            }
            const trabajador = trabajadores.find(
                (item) => item.id_trabajador === Number(data.id_trabajador)
            );
            if (trabajador?.proyectos && trabajador.proyectos.length > 0) {
                return trabajador.proyectos;
            }
            return proyectos || [];
        }
    }, [esParaMi, data.id_trabajador, usuarioTrabajador, trabajadores, proyectos]);

    // Sincronizar el id_proyecto cuando cambian los proyectos disponibles
    useEffect(() => {
        if (proyectosDisponibles.length === 1) {
            setData((prev) => ({
                ...prev,
                id_proyecto: proyectosDisponibles[0].id_proyecto,
            }));
        } else if (proyectosDisponibles.length > 1) {
            const existe = proyectosDisponibles.some(
                (p) => p.id_proyecto === Number(data.id_proyecto)
            );
            if (!existe) {
                setData((prev) => ({
                    ...prev,
                    id_proyecto: proyectosDisponibles[0].id_proyecto,
                }));
            }
        } else {
            setData((prev) => ({
                ...prev,
                id_proyecto: '',
            }));
        }
    }, [proyectosDisponibles]);

    // Cambiar entre 'Para mí' y 'Para un tercero'
    const handleCambiarModo = (paraMi: boolean) => {
        setEsParaMi(paraMi);
        if (paraMi) {
            setData((prev) => ({
                ...prev,
                es_para_mi: true,
                id_trabajador: usuarioTrabajador?.id_trabajador || '',
            }));
        } else {
            setData((prev) => ({
                ...prev,
                es_para_mi: false,
                id_trabajador: '',
                id_proyecto: '',
            }));
        }
    };

    // Seleccionar persona reportada en modo tercero
    const handleSeleccionarTrabajador = (id: number | '') => {
        setData((prev) => ({
            ...prev,
            id_trabajador: id,
        }));
    };

    // Manejo de archivos
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivosNuevos = Array.from(e.target.files || []);
        const archivosActuales = data.evidencia || [];

        const totalArchivos = archivosActuales.length + archivosNuevos.length;

        if (totalArchivos > 3) {
            alert('Puedes subir un máximo de 3 archivos.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setData('evidencia', [...archivosActuales, ...archivosNuevos]);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removerArchivo = (index: number) => {
        const nuevosArchivos = [...(data.evidencia || [])];
        nuevosArchivos.splice(index, 1);
        setData('evidencia', nuevosArchivos);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!data.id_proyecto) {
            alert('Por favor, seleccione un proyecto.');
            return;
        }

        if (!esParaMi && !data.id_trabajador) {
            alert('Por favor, seleccione a la persona reportada.');
            return;
        }

        if (data.condicion === 0) {
            alert('Por favor, seleccione una condición de uso (1 a 10).');
            return;
        }

        post('/eventos');
    };

    const archivosSubidos = data.evidencia || [];

    return (
        <MainLayout>
            <Head title="Ingreso de Reporte | AVA" />

            <div className="max-w-[1400px] mx-auto p-4 lg:p-6 lg:mt-0">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Ingreso de Reporte</h1>
                    <p className="text-gris-1 text-sm">
                        Registra un evento detallando la condición y la descripción.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-verde-3 rounded-xl p-6 shadow-2xl h-full flex flex-col justify-between">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* SECCIÓN: ¿PARA QUIÉN ES EL REPORTE? */}
                            <div>
                                <label className="block text-[13px] font-bold uppercase tracking-wider text-gris-1 mb-1.5">
                                    ¿Para quién es el reporte?
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleCambiarModo(true)}
                                        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all ${
                                            esParaMi
                                                ? 'bg-verde-5/20 border-verde-5 text-verde-6 shadow-sm ring-1 ring-verde-5/30'
                                                : 'bg-verde-1 border-verde-3 text-gris-1 hover:border-gris-2 hover:text-gris-2'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Para mí
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleCambiarModo(false)}
                                        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all ${
                                            !esParaMi
                                                ? 'bg-verde-5/20 border-verde-5 text-verde-6 shadow-sm ring-1 ring-verde-5/30'
                                                : 'bg-verde-1 border-verde-3 text-gris-1 hover:border-gris-2 hover:text-gris-2'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Para un tercero
                                    </button>
                                </div>
                                {esParaMi && usuarioTrabajador && (
                                    <p className="text-[11px] text-gris-1 mt-1.5 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-verde-6 shrink-0"></span>
                                        Reportando como:{' '}
                                        <span className="font-semibold text-gris-2">{usuarioTrabajador.nombre}</span>{' '}
                                        {usuarioTrabajador.cargo ? `(${usuarioTrabajador.cargo})` : ''}
                                    </p>
                                )}
                            </div>

                            {/* PERSONA REPORTADA (SOLO SI ES PARA UN TERCERO) */}
                            {!esParaMi && (
                                <div>
                                    <label className="block text-[13px] font-bold uppercase tracking-wider text-gris-1 mb-1">
                                        Persona Reportada
                                    </label>
                                    <select
                                        required={!esParaMi}
                                        value={data.id_trabajador}
                                        onChange={(e) =>
                                            handleSeleccionarTrabajador(
                                                e.target.value ? Number(e.target.value) : ''
                                            )
                                        }
                                        className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2 text-[15px] text-gris-2 focus:outline-none focus:border-verde-5 transition-colors cursor-pointer"
                                    >
                                        <option value="">Selecciona a la persona reportada...</option>
                                        {trabajadores.map((t) => (
                                            <option key={t.id_trabajador} value={t.id_trabajador}>
                                                {t.nombre} {t.rut ? `(${t.rut})` : ''} - {t.cargo || 'Trabajador'}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.id_trabajador && (
                                        <p className="text-red-400 text-xs mt-1">{errors.id_trabajador}</p>
                                    )}
                                </div>
                            )}

                            {/* SELECTOR O CAMPO BLOQUEADO DE PROYECTO */}
                            <div>
                                <label className="block text-[13px] font-bold uppercase tracking-wider text-gris-1 mb-1">
                                    Proyecto
                                </label>

                                {proyectosDisponibles.length === 1 ? (
                                    <div className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2 flex items-center justify-between text-gris-2">
                                        <span className="text-[15px] font-semibold text-gris-2">
                                            {proyectosDisponibles[0].nombre}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-verde-5/15 text-verde-6 border border-verde-5/30 shrink-0">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            Proyecto asignado
                                        </span>
                                    </div>
                                ) : proyectosDisponibles.length > 1 ? (
                                    <select
                                        required
                                        value={data.id_proyecto}
                                        onChange={(e) => setData('id_proyecto', Number(e.target.value))}
                                        className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2 text-[15px] text-gris-2 focus:outline-none focus:border-verde-5 transition-colors cursor-pointer"
                                    >
                                        <option value="">Selecciona el proyecto asignado...</option>
                                        {proyectosDisponibles.map((p) => (
                                            <option key={p.id_proyecto} value={p.id_proyecto}>
                                                {p.nombre}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="w-full bg-verde-1/50 border border-verde-3/60 rounded-lg px-3 py-2 text-[14px] text-gris-1 italic">
                                        {!esParaMi && !data.id_trabajador
                                            ? 'Selecciona a la persona reportada para cargar sus proyectos disponibles.'
                                            : 'No se encontraron proyectos asignados para este trabajador.'}
                                    </div>
                                )}

                                {proyectosDisponibles.length > 1 && (
                                    <p className="text-[11px] text-gris-1 mt-1">
                                        El trabajador participa en más de un proyecto. Selecciona en cuál ocurrió el evento.
                                    </p>
                                )}
                                {errors.id_proyecto && (
                                    <p className="text-red-400 text-xs mt-1">{errors.id_proyecto}</p>
                                )}
                            </div>

                            {/* ÁREA / REFERENCIA */}
                            <div>
                                <label className="block text-[13px] font-bold uppercase tracking-wider text-gris-1 mb-1">
                                    Área/Zona
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.referencia}
                                    onChange={(e) => setData('referencia', e.target.value)}
                                    placeholder="Ej: Chancador primario, Nivel 4..."
                                    className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2 text-[15px] text-gris-2 focus:outline-none focus:border-verde-5 transition-colors"
                                />
                                {errors.referencia && (
                                    <p className="text-red-400 text-xs mt-1">{errors.referencia}</p>
                                )}
                            </div>

                            {/* CONDICIÓN DEL EVENTO */}
                            <div>
                                <label className="block text-[13px] font-bold uppercase tracking-wider text-gris-1 mb-1">
                                    Condición del Evento (PARE)
                                </label>
                                <select
                                    required
                                    value={data.condicion}
                                    onChange={(e) => setData('condicion', Number(e.target.value))}
                                    className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2 text-[15px] text-gris-2 focus:outline-none focus:border-verde-5 transition-colors cursor-pointer"
                                >
                                    <option value={0}>Seleccione la condición identificada</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                        <option key={num} value={num}>
                                            {num.toString().padStart(2, '0')}. {condicionesPare[num]}
                                        </option>
                                    ))}
                                </select>
                                {(errors as any).condicion && (
                                    <p className="text-red-400 text-xs mt-1">
                                        {(errors as any).condicion}
                                    </p>
                                )}
                            </div>

                            {/* DESCRIPCIÓN DETALLADA */}
                            <div>
                                <label className="block text-[13px] font-bold uppercase tracking-wider text-gris-1 mb-1">
                                    Descripción Detallada
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    maxLength={500}
                                    value={data.descripcion}
                                    onChange={(e) => setData('descripcion', e.target.value)}
                                    placeholder="Describe el contexto del hallazgo..."
                                    className="w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2 text-[15px] text-gris-2 focus:outline-none focus:border-verde-5 resize-none transition-colors"
                                ></textarea>
                                <div className="flex justify-between mt-1">
                                    <div>
                                        {errors.descripcion && (
                                            <p className="text-red-400 text-xs">{errors.descripcion}</p>
                                        )}
                                    </div>
                                    <span
                                        className={`text-[11px] font-bold ${
                                            data.descripcion.length >= 500
                                                ? 'text-rojo-1'
                                                : 'text-gris-1'
                                        }`}
                                    >
                                        {data.descripcion.length} / 500
                                    </span>
                                </div>
                            </div>

                            {/* EVIDENCIA ADJUNTA */}
                            <div>
                                <label className="block text-[13px] font-bold uppercase tracking-wider text-gris-1 mb-1">
                                    Evidencia Adjunta (Máx 3. archivos)
                                </label>

                                {archivosSubidos.length < 3 && (
                                    <div className="flex items-center justify-between">
                                        <input
                                            type="file"
                                            multiple
                                            ref={fileInputRef}
                                            accept="image/*,.pdf,.doc,.docx"
                                            onChange={handleFileChange}
                                            className="w-full max-w-sm bg-verde-1 border border-verde-3 rounded-lg px-2 py-1.5 text-sm text-gris-2 focus:outline-none focus:border-verde-5 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[13px] file:font-bold file:bg-verde-5/10 file:text-verde-6 hover:file:bg-verde-5/20 cursor-pointer transition-colors"
                                        />
                                        <p className="text-gris-1 text-xs">Máx 3 fotos/docs</p>
                                    </div>
                                )}

                                {archivosSubidos.length > 0 && (
                                    <div className="flex flex-row flex-wrap gap-2 mt-2">
                                        {archivosSubidos.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 bg-verde-1 border border-verde-5/50 px-3 py-1.5 rounded-lg max-w-[200px]"
                                            >
                                                <span className="text-sm shrink-0">📎</span>
                                                <span className="text-xs text-verde-6 font-medium truncate flex-1">
                                                    {file.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removerArchivo(index)}
                                                    className="text-rojo-1 text-sm font-black hover:scale-110 transition-transform shrink-0"
                                                    title="Quitar archivo"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {(errors as any).evidencia && (
                                    <p className="text-red-400 text-xs mt-1">
                                        {(errors as any).evidencia}
                                    </p>
                                )}
                            </div>

                            {(errors as any).general && (
                                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
                                    {(errors as any).general}
                                </p>
                            )}

                            <div className="pt-4 border-t border-verde-3 mt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 rounded-lg text-sm font-bold bg-verde-5 hover:bg-verde-6 text-black transition-colors shadow-lg shadow-verde-5/20 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2.5"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    {processing ? 'Guardando...' : 'Registrar evento'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* GUÍA DE CONDICIONES A LA DERECHA */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-verde-3 rounded-xl p-4 shadow-xl flex flex-col h-full">
                            <h3 className="text-[13px] font-bold text-gris-2 uppercase tracking-wider mb-3">
                                Guía de Condiciones
                            </h3>
                            <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                    <div
                                        key={num}
                                        className={`px-3 py-2 rounded-lg border text-[13px] leading-tight transition-colors duration-300 flex gap-2 cursor-pointer ${
                                            data.condicion === num
                                                ? 'bg-verde-5/10 border-verde-5/50 text-gris-2 shadow-inner'
                                                : 'bg-verde-1 border-verde-3/50 text-gris-1 hover:border-gris-1/50'
                                        }`}
                                        onClick={() => setData('condicion', num)}
                                    >
                                        <div
                                            className={`font-black shrink-0 ${
                                                data.condicion === num
                                                    ? 'text-verde-6'
                                                    : 'text-gray-600'
                                            }`}
                                        >
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