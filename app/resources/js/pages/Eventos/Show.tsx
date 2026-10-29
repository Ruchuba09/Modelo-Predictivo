import { Head, Link, usePage, useForm } from '@inertiajs/react';
import { FormEvent, useRef, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '@/hooks/use-auth';

interface ArchivoEvidencia {
    nombre: string;
    ruta: string;
    extension: string;
    es_imagen: boolean;
}

const CONDICIONES_PARE: { [key: number]: string } = {
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

const ESTADO_STYLES: { [key: string]: string } = {
    abierta: 'bg-verde-5/10 text-verde-6 border-verde-5/40',
    en_revision: 'bg-amarillo-1/10 text-amarillo-1 border-amarillo-1/40',
    proceso: 'bg-amarillo-1/10 text-amarillo-1 border-amarillo-1/40',
    cerrada: 'bg-gris-1/10 text-gris-1 border-gris-1/40',
};

interface Persona {
    rut?: string;
    nombre_1?: string;
    nombre_2?: string;
    apellido_1?: string;
    apellido_2?: string;
    nombre?: string;
    apellido?: string;
}

interface PersonaRel {
    id_trabajador: number;
    cargo?: string;
    persona?: Persona;
    trabajador?: {
        id_trabajador: number;
        cargo?: string;
        persona?: Persona;
    };
}

interface Evento {
    id_evento: number;
    id_tipo_evento: number;
    id_area: number | null;
    condicion: number;
    descripcion: string;
    referencia: string;
    estado: string;
    fecha_creacion?: string;
    fecha_actualizacion?: string;
    fecha_cierre?: string;
    justificacion?: string;
    evidencia_cierre?: string[] | null;
    tipoEvento?: { id_tipo_evento: number; nombre: string };
    proyecto?: { id_proyecto: number; nombre: string };
    area?: { id_area: number; nombre: string } | null;
    administrador?: PersonaRel | null;
    administrativo?: PersonaRel | null;
    trabajador?: PersonaRel | null;
    supervisor?: PersonaRel | null;
}

function formatNombrePersona(p?: Persona | null): string {
    if (!p) return '';
    const n1 = p.nombre_1 ?? p.nombre ?? '';
    const a1 = p.apellido_1 ?? p.apellido ?? '';
    const a2 = p.apellido_2 ?? '';
    return `${n1} ${a1} ${a2}`.trim();
}

function getNombreTrabajador(t: any): string {
    if (!t) return '—';
    const persona = t.persona ?? t.trabajador?.persona;
    const nombre = formatNombrePersona(persona);
    return nombre ? `${nombre}${t.cargo ? ` • ${t.cargo}` : ''}` : `Trabajador #${t.id_trabajador}`;
}

function getNombreSupervisor(s: any): string {
    if (!s) return 'Sin asignar';
    const persona = s.trabajador?.persona ?? s.persona;
    const cargo = s.trabajador?.cargo ?? s.cargo;
    const nombre = formatNombrePersona(persona);
    return nombre ? `${nombre}${cargo ? ` • ${cargo}` : ''}` : `Supervisor #${s.id_trabajador}`;
}

function getNombreCerrador(adm: any): string {
    if (!adm) return 'Sin cerrar';
    const persona = adm.trabajador?.persona ?? adm.persona;
    const cargo = adm.trabajador?.cargo ?? adm.cargo;
    const nombre = formatNombrePersona(persona);
    return nombre ? `${nombre}${cargo ? ` • ${cargo}` : ''}` : `Administrativo #${adm.id_trabajador}`;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    if (value === null || value === undefined || value === '') return null;

    return (
        <div className="flex flex-col gap-1 py-3 border-b border-verde-3/60 last:border-b-0">
            <span className="text-[12px] uppercase tracking-wider text-gris-1">{label}</span>
            <span className="text-sm text-gris-2">{value}</span>
        </div>
    );
}

export default function Show() {
    const usuario = useAuth();
    const roles = usuario?.roles ?? [];
    const esAdmin = roles.some((r) => r.toLowerCase() === 'administrador');
    const esSupervisor = roles.some((r) => r.toLowerCase() === 'supervisor');
    const esTrabajadorPuro = !esAdmin && !esSupervisor;
    const rutaListado = esTrabajadorPuro ? route('eventos.mis-reportes') : route('eventos.index');

    const { evento } = usePage().props as unknown as { evento: Evento };
    const estadoStyle = ESTADO_STYLES[evento.estado] ?? ESTADO_STYLES['abierta'];
    
    const estaCerrada = evento.estado === 'cerrada' || evento.estado === 'cerrada';

    // ESTADO PARA CARGA DE EVIDENCIA BAJO DEMANDA (MÓDULO A)
    const [cargandoEvidencia, setCargandoEvidencia] = useState(false);
    const [mostrarEvidencia, setMostrarEvidencia] = useState(false);
    const [evidenciaCargada, setEvidenciaCargada] = useState(false);
    const [evidencias, setEvidencias] = useState<ArchivoEvidencia[]>([]);
    const [errorEvidencia, setErrorEvidencia] = useState<string | null>(null);
    const [imagenModal, setImagenModal] = useState<string | null>(null);

    const toggleEvidencia = async () => {
        if (mostrarEvidencia) {
            setMostrarEvidencia(false);
            return;
        }

        setMostrarEvidencia(true);

        if (!evidenciaCargada) {
            setCargandoEvidencia(true);
            setErrorEvidencia(null);

            try {
                const url = `/eventos/${evento.id_evento}/evidencias`;

                const res = await fetch(url, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!res.ok) {
                    throw new Error('No se pudo obtener la evidencia del servidor.');
                }

                const json = await res.json();
                setEvidencias(json.evidencias || []);
                setEvidenciaCargada(true);
            } catch (err: any) {
                setErrorEvidencia(err.message || 'Error al conectar con la base de datos.');
            } finally {
                setCargandoEvidencia(false);
            }
        }
    };

    // CONFIGURACIÓN DEL FORMULARIO DE CIERRE
    const { data, setData, post, processing, errors } = useForm({
        _method: 'patch', // Necesario en Laravel para enviar archivos en rutas PATCH
        justificacion: '',
        evidencia_cierre: [] as File[]
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivosNuevos = Array.from(e.target.files || []);
        const archivosActuales = data.evidencia_cierre || [];
        
        const totalArchivos = archivosActuales.length + archivosNuevos.length;

        if (totalArchivos > 3) {
            alert("Puedes subir un máximo de 3 archivos como evidencia de cierre.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setData('evidencia_cierre', [...archivosActuales, ...archivosNuevos]);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; 
        }
    };

    const removerArchivo = (index: number) => {
        const nuevosArchivos = [...(data.evidencia_cierre || [])];
        nuevosArchivos.splice(index, 1);
        setData('evidencia_cierre', nuevosArchivos);
    };

    const handleCerrar = (e: FormEvent) => {
        e.preventDefault();
        // Envía los datos a la ruta de cierre configurada por tu compañero
        post(route('eventos.cerrar', evento.id_evento));
    };

    const archivosSubidos = data.evidencia_cierre || [];

    return (
        <MainLayout title={`Reporte #${evento.id_evento}`} subtitle="Detalle del reporte registrado">
            <Head title={`Reporte #${evento.id_evento} | AVA`} />

            <div className="max-w-[1100px] mx-auto p-6 lg:p-8">
                {/* Barra de Acciones */}
                <div className="mb-6 flex items-center justify-start">
                    <Link
                        href={rutaListado}
                        className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-bold bg-white dark:bg-[#1E242B] text-verde-6 dark:text-verde-5 border border-verde-5 hover:bg-verde-5 hover:text-black transition-all shadow-sm whitespace-nowrap cursor-pointer"
                    >
                        ← Volver al listado
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna principal */}
                    <div className="lg:col-span-2 bg-white border border-verde-3 rounded-2xl p-8 shadow-2xl h-fit">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-gris-2 uppercase tracking-wider">
                                Información del reporte
                            </h3>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${estadoStyle}`}
                            >
                                {evento.estado.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="flex flex-col mb-3">
                            <InfoRow label="Área/Zona" value={evento.referencia} />
                            <InfoRow
                                label={`Condición #${evento.condicion}`}
                                value={CONDICIONES_PARE[evento.condicion]}
                            />
                            
                            <div className="border-b border-verde-3/60 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                <div className="flex flex-col gap-1 py-3">
                                    <span className="text-[12px] uppercase tracking-wider text-gris-1">Descripción original</span>
                                    <span className="text-sm text-gris-2">{evento.descripcion}</span>
                                </div>
                                <div className="flex flex-col gap-1 py-3">
                                    <span className="text-[12px] uppercase tracking-wider text-gris-1">Fecha de creación</span>
                                    <span className="text-sm text-gris-2">
                                        {evento.fecha_creacion
                                            ? new Date(evento.fecha_creacion).toLocaleString('es-CL')
                                            : undefined}
                                    </span>
                                </div>
                            </div>
                            <InfoRow label="Proyecto" value={evento.proyecto?.nombre} />
                        </div>

                        {/* SECCIÓN DE EVIDENCIA ADJUNTA DEL TRABAJADOR (CARGA BAJO DEMANDA) */}
                        <div className="pt-6 pb-2 border-t border-verde-3/60">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                <div>
                                    <h4 className="text-[12px] font-bold uppercase tracking-wider text-gris-1 flex items-center gap-1.5">
                                        <span>📁</span> Evidencia Adjunta del Reporte
                                    </h4>
                                    <p className="text-xs text-gris-1 mt-0.5">
                                        Archivos o fotografías registradas por el trabajador al crear este PARE.
                                    </p>
                                </div>
                                
                                <button
                                    type="button"
                                    onClick={toggleEvidencia}
                                    disabled={cargandoEvidencia}
                                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                                        mostrarEvidencia
                                            ? 'bg-verde-1 border border-verde-3 text-gris-2 hover:bg-verde-2'
                                            : 'bg-verde-5 hover:bg-verde-6 text-black shadow-verde-5/20 hover:scale-[1.02]'
                                    } disabled:opacity-60 cursor-pointer shrink-0`}
                                >
                                    {cargandoEvidencia ? (
                                        <>
                                            <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
                                            Cargando evidencia...
                                        </>
                                    ) : mostrarEvidencia ? (
                                        <>
                                            <span>✕</span> Ocultar evidencia
                                        </>
                                    ) : (
                                        <>
                                            <span>📂</span> Cargar evidencia
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Contenedor expandible de evidencias */}
                            {mostrarEvidencia && (
                                <div className="p-4 rounded-xl bg-verde-1/60 border border-verde-3 transition-all">
                                    {cargandoEvidencia && (
                                        <div className="py-8 flex flex-col items-center justify-center text-center">
                                            <div className="animate-spin w-7 h-7 border-3 border-verde-6 border-t-transparent rounded-full mb-2"></div>
                                            <p className="text-xs text-gris-1 font-medium">
                                                Consultando archivos en la base de datos...
                                            </p>
                                        </div>
                                    )}

                                    {errorEvidencia && (
                                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center justify-between">
                                            <span>⚠️ {errorEvidencia}</span>
                                            <button
                                                type="button"
                                                onClick={() => { setEvidenciaCargada(false); toggleEvidencia(); }}
                                                className="font-bold underline hover:text-red-800 ml-2"
                                            >
                                                Reintentar
                                            </button>
                                        </div>
                                    )}

                                    {!cargandoEvidencia && !errorEvidencia && evidencias.length === 0 && (
                                        <div className="py-6 text-center">
                                            <p className="text-2xl mb-1">📭</p>
                                            <p className="text-xs text-gris-1 font-medium">
                                                Este reporte no tiene archivos o fotografías adjuntas en la base de datos.
                                            </p>
                                        </div>
                                    )}

                                    {!cargandoEvidencia && !errorEvidencia && evidencias.length > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-verde-3/40">
                                                <span className="text-xs font-bold text-gris-2">
                                                    Archivos encontrados ({evidencias.length})
                                                </span>
                                                <span className="text-[11px] text-gris-1">
                                                    Haz clic en una imagen para ampliarla
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {evidencias.map((archivo, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="bg-white border border-verde-3 rounded-xl p-2.5 flex flex-col justify-between hover:border-verde-5 transition-all shadow-sm group"
                                                    >
                                                        {archivo.es_imagen ? (
                                                            <div
                                                                onClick={() => setImagenModal(archivo.ruta)}
                                                                className="relative aspect-video w-full rounded-lg overflow-hidden bg-gris-1/10 cursor-pointer mb-2 flex items-center justify-center group-hover:opacity-95"
                                                            >
                                                                <img
                                                                    src={archivo.ruta}
                                                                    alt={archivo.nombre}
                                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                    loading="lazy"
                                                                />
                                                                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <span className="bg-white/95 text-gris-2 text-[11px] font-bold px-2.5 py-1 rounded-md shadow">
                                                                        🔍 Ampliar foto
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="aspect-video w-full rounded-lg bg-verde-2/60 border border-verde-3/60 mb-2 flex flex-col items-center justify-center p-3 text-center">
                                                                <span className="text-3xl mb-1">📄</span>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-verde-6 bg-verde-5/20 px-2 py-0.5 rounded-full">
                                                                    {archivo.extension}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                                                            <span className="text-xs text-gris-2 truncate font-medium flex-1" title={archivo.nombre}>
                                                                {archivo.nombre}
                                                            </span>
                                                            <a
                                                                href={archivo.ruta}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-verde-6 hover:text-verde-7 text-xs font-bold whitespace-nowrap bg-verde-5/10 hover:bg-verde-5/20 px-2 py-1 rounded transition-colors"
                                                                title="Abrir archivo en pestaña nueva"
                                                            >
                                                                ↗ Abrir
                                                            </a>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RESOLUCIÓN O FORMULARIO DE CIERRE */}
                        {estaCerrada ? (
                            <div className="pt-8 border-t border-verde-3 dark:border-[#2A333E]">
                                <div className="bg-verde-5/10 dark:bg-verde-5/5 border border-verde-5/30 rounded-2xl p-6 transition-colors">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-verde-3/60 dark:border-[#2A333E]">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-verde-6 animate-pulse"></span>
                                            <h3 className="text-base font-bold text-gris-2 dark:text-white">
                                                Resolución y Cierre del Reporte
                                            </h3>
                                        </div>
                                        <span className="text-xs uppercase tracking-wider font-bold bg-verde-5/20 text-verde-6 px-3 py-1 rounded-full border border-verde-5/40">
                                            Evento Cerrado
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-verde-3/60 dark:border-[#2A333E]">
                                        <div>
                                            <span className="text-[11px] uppercase tracking-wider text-gris-1 dark:text-gray-400 font-bold block mb-1">
                                                Responsable del Cierre
                                            </span>
                                            <span className="text-sm font-bold text-gris-2 dark:text-gray-100">
                                                {getNombreCerrador(evento.administrador ?? evento.administrativo)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[11px] uppercase tracking-wider text-gris-1 dark:text-gray-400 font-bold block mb-1">
                                                Fecha y Hora de Cierre
                                            </span>
                                            <span className="text-sm text-gris-2 dark:text-gray-100 font-medium">
                                                {evento.fecha_cierre ? new Date(evento.fecha_cierre).toLocaleString('es-CL') : '—'}
                                            </span>
                                        </div>
                                    </div>

                                    {evento.justificacion && (
                                        <div className="mb-4">
                                            <span className="text-[11px] uppercase tracking-wider text-gris-1 dark:text-gray-400 font-bold block mb-1.5">
                                                Acción correctiva / Justificación registrada
                                            </span>
                                            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1E242B] border border-verde-3 dark:border-[#2A333E] text-sm text-gris-2 dark:text-gray-100 whitespace-pre-wrap">
                                                {evento.justificacion}
                                            </div>
                                        </div>
                                    )}

                                    {evento.evidencia_cierre && evento.evidencia_cierre.length > 0 && (
                                        <div>
                                            <span className="text-[11px] uppercase tracking-wider text-gris-1 dark:text-gray-400 font-bold block mb-2">
                                                Evidencias de cierre adjuntas ({evento.evidencia_cierre.length})
                                            </span>
                                            <div className="flex flex-wrap gap-2.5">
                                                {evento.evidencia_cierre.map((ruta, idx) => {
                                                    const nombre = ruta.split('/').pop() || `Archivo ${idx + 1}`;
                                                    const url = `/eventos/archivo/${nombre}`;
                                                    return (
                                                        <a
                                                            key={idx}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 bg-white dark:bg-[#1E242B] border border-verde-3 dark:border-[#2A333E] px-3 py-1.5 rounded-lg text-xs font-semibold text-gris-2 dark:text-gray-100 hover:border-verde-5 transition-colors shadow-sm"
                                                        >
                                                            <span>📎</span>
                                                            <span className="truncate max-w-[200px]">{nombre}</span>
                                                            <span className="text-verde-6 text-[10px]">↗</span>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : esAdmin ? (
                            <div className="pt-8 border-t border-verde-3 dark:border-[#2A333E]">
                                <h3 className="text-lg font-bold text-gris-2 dark:text-white mb-4">Cerrar Reporte</h3>
                                <p className="text-gris-1 dark:text-gray-400 text-sm mb-6">Proporciona los detalles y la evidencia de la resolución para dar por cerrado este reporte.</p>
                                
                                <form onSubmit={handleCerrar} className="space-y-6">
                                    <div>
                                        <label className="block text-[14px] uppercase tracking-wider text-gris-1 dark:text-gray-400 mb-2">
                                            Acción correctiva / Justificación
                                        </label>
                                        <textarea
                                            rows={4}
                                            required
                                            maxLength={500}
                                            value={data.justificacion}
                                            onChange={e => setData('justificacion', e.target.value)}
                                            placeholder="Detalla qué acciones se tomaron para solucionar el problema..."
                                            className="w-full bg-verde-1 dark:bg-[#151A1F] border border-verde-3 dark:border-[#2A333E] rounded-lg px-4 py-3.5 text-sm text-gris-2 dark:text-white focus:outline-none focus:border-verde-5 resize-none transition-colors"
                                        ></textarea>
                                        <div className="flex justify-between mt-1">
                                            <div>{(errors as any).justificacion && <p className="text-red-400 text-xs">{(errors as any).justificacion}</p>}</div>
                                            <span className={`text-[11px] font-bold ${data.justificacion.length >= 500 ? 'text-rojo-1' : 'text-gris-1 dark:text-gray-400'}`}>
                                                {data.justificacion.length} / 500
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[14px] uppercase tracking-wider text-gris-1 dark:text-gray-400 mb-2">
                                            Evidencia de Cierre (Máx 3. archivos)
                                        </label>
                                        
                                        {archivosSubidos.length < 3 && (
                                            <>
                                                <input
                                                    type="file"
                                                    multiple
                                                    ref={fileInputRef}
                                                    accept="image/*,.pdf,.doc,.docx"
                                                    onChange={handleFileChange}
                                                    className="w-full bg-verde-1 dark:bg-[#151A1F] border border-verde-3 dark:border-[#2A333E] rounded-lg px-4 py-2.5 text-sm text-gris-2 dark:text-white focus:outline-none focus:border-verde-5 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-verde-5/10 file:text-verde-6 hover:file:bg-verde-5/20 cursor-pointer transition-colors"
                                                />
                                            </>
                                        )}

                                        {archivosSubidos.length > 0 && (
                                            <div className="flex flex-col gap-2 mt-3">
                                                {archivosSubidos.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between gap-3 bg-verde-1 dark:bg-[#151A1F] border border-verde-5/50 p-2 pr-4 rounded-lg w-full">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <span className="text-xl shrink-0">📎</span>
                                                            <span className="text-sm text-verde-6 font-medium truncate">
                                                                {file.name}
                                                            </span>
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removerArchivo(index)}
                                                            className="text-rojo-1 text-lg font-black px-2 hover:scale-110 transition-transform shrink-0 cursor-pointer"
                                                            title="Quitar archivo"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {(errors as any).evidencia_cierre && <p className="text-red-400 text-xs mt-1">{(errors as any).evidencia_cierre}</p>}
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-6 py-3 rounded-lg text-sm font-bold bg-verde-5 hover:bg-verde-6 text-black transition-colors shadow-lg shadow-verde-5/20 disabled:opacity-50 cursor-pointer"
                                        >
                                            {processing ? 'Cerrando...' : 'Cerrar reporte'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="pt-8 border-t border-verde-3 dark:border-[#2A333E]">
                                <div className="bg-amarillo-1/10 border border-amarillo-1/30 rounded-2xl p-5 flex items-start gap-4">
                                    <span className="text-2xl">⏳</span>
                                    <div>
                                        <h4 className="text-sm font-bold text-gris-2 dark:text-white mb-1">
                                            Reporte en seguimiento
                                        </h4>
                                        <p className="text-xs text-gris-1 dark:text-gray-400">
                                            Este reporte se encuentra en estado <span className="font-bold uppercase text-amarillo-1">{evento.estado.replace('_', ' ')}</span> y está pendiente de resolución final por el equipo administrativo.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Columna lateral: personas involucradas y trazabilidad */}
                    <div className="bg-white dark:bg-[#1E242B] border border-verde-3 dark:border-[#2A333E] rounded-2xl p-6 shadow-xl h-fit transition-colors">
                        <h3 className="text-sm font-bold text-gris-2 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                            Información del reporte
                        </h3>

                        <div className="flex flex-col gap-4">
                            {/* 1. Reportado por */}
                            <div className="p-3.5 rounded-xl border border-verde-3/60 dark:border-[#2A333E] bg-verde-1/50 dark:bg-[#151A1F] transition-colors">
                                <div className="text-[11px] uppercase tracking-wider text-gris-1 dark:text-gray-400 font-bold mb-1 flex items-center justify-between">
                                    <span>Reportado por</span>
                                    <span className="text-[10px] text-verde-6 font-bold bg-verde-5/10 px-2 py-0.5 rounded">Trabajador</span>
                                </div>
                                <div className="text-sm font-bold text-gris-2 dark:text-gray-100">
                                    {getNombreTrabajador(evento.trabajador)}
                                </div>
                                {evento.trabajador?.persona?.rut && (
                                    <div className="text-[11px] text-gris-1 dark:text-gray-400 mt-0.5">
                                        RUT: {evento.trabajador.persona.rut}
                                    </div>
                                )}
                                {evento.fecha_creacion && (
                                    <div className="text-[11px] text-gris-1 dark:text-gray-400 mt-1">
                                        Fecha: {new Date(evento.fecha_creacion).toLocaleString('es-CL')}
                                    </div>
                                )}
                            </div>

                            {/* 2. Supervisor asignado */}
                            <div className="p-3.5 rounded-xl border border-verde-3/60 dark:border-[#2A333E] bg-verde-1/50 dark:bg-[#151A1F] transition-colors">
                                <div className="text-[11px] uppercase tracking-wider text-gris-1 dark:text-gray-400 font-bold mb-1 flex items-center justify-between">
                                    <span>Supervisor asignado</span>
                                    <span className="text-[10px] text-amarillo-1 font-bold bg-amarillo-1/10 px-2 py-0.5 rounded">Supervisión</span>
                                </div>
                                <div className="text-sm font-bold text-gris-2 dark:text-gray-100">
                                    {getNombreSupervisor(evento.supervisor)}
                                </div>
                                {(evento.supervisor?.trabajador?.persona?.rut || evento.supervisor?.persona?.rut) && (
                                    <div className="text-[11px] text-gris-1 dark:text-gray-400 mt-0.5">
                                        RUT: {evento.supervisor?.trabajador?.persona?.rut ?? evento.supervisor?.persona?.rut}
                                    </div>
                                )}
                            </div>

                            {/* 3. Cerrada por */}
                            <div className="p-3.5 rounded-xl border border-verde-3/60 dark:border-[#2A333E] bg-verde-1/50 dark:bg-[#151A1F] transition-colors">
                                <div className="text-[11px] uppercase tracking-wider text-gris-1 dark:text-gray-400 font-bold mb-1 flex items-center justify-between">
                                    <span>Cerrado por</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${estaCerrada ? 'bg-verde-5/20 text-verde-6' : 'bg-gris-1/10 text-gris-1 dark:text-gray-400'}`}>
                                        {estaCerrada ? 'Cierre SGI' : 'Pendiente'}
                                    </span>
                                </div>
                                <div className="text-sm font-bold text-gris-2 dark:text-gray-100">
                                    {getNombreCerrador(evento.administrador ?? evento.administrativo)}
                                </div>
                                {(evento.administrador?.trabajador?.persona?.rut || evento.administrativo?.trabajador?.persona?.rut) && (
                                    <div className="text-[11px] text-gris-1 dark:text-gray-400 mt-0.5">
                                        RUT: {evento.administrador?.trabajador?.persona?.rut ?? evento.administrativo?.trabajador?.persona?.rut}
                                    </div>
                                )}
                                {evento.fecha_cierre && (
                                    <div className="text-[11px] text-gris-1 dark:text-gray-400 mt-1">
                                        Cerrado el {new Date(evento.fecha_cierre).toLocaleString('es-CL')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para ver imagen en tamaño completo (Lightbox) */}
            {imagenModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setImagenModal(null)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-3 shadow-2xl overflow-hidden flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setImagenModal(null)}
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/70 text-white hover:bg-black flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                            title="Cerrar vista previa"
                        >
                            ✕
                        </button>
                        <img
                            src={imagenModal}
                            alt="Evidencia ampliada"
                            className="max-h-[78vh] w-auto max-w-full object-contain rounded-xl"
                        />
                        <div className="w-full pt-3 px-2 flex justify-between items-center text-xs text-gris-1">
                            <span className="font-medium">Fotografía de evidencia</span>
                            <a
                                href={imagenModal}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-verde-6 hover:underline font-bold"
                            >
                                Abrir en tamaño original ↗
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
