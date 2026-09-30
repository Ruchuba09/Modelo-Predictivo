import { Head, Link, usePage, useForm } from '@inertiajs/react';
import { FormEvent, useRef } from 'react';
import MainLayout from '../../layouts/MainLayout';

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
    abierto: 'bg-verde-5/10 text-verde-6 border-verde-5/40',
    en_revision: 'bg-amarillo-1/10 text-amarillo-1 border-amarillo-1/40',
    proceso: 'bg-amarillo-1/10 text-amarillo-1 border-amarillo-1/40',
    cerrado: 'bg-gris-1/10 text-gris-1 border-gris-1/40',
    cerrada: 'bg-gris-1/10 text-gris-1 border-gris-1/40',
};

interface Administrador {
    id_trabajador: number;
    cargo?: string;
    persona?: {
        nombre?: string;
        apellido?: string;
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
    tipoEvento?: { id_tipo_evento: number; nombre: string };
    proyecto?: { id_proyecto: number; nombre: string };
    area?: { id_area: number; nombre: string } | null;
    administrador?: Administrador | null;
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
    const { evento } = usePage().props as unknown as { evento: Evento };
    const estadoStyle = ESTADO_STYLES[evento.estado] ?? ESTADO_STYLES['abierto'];
    
    const estaCerrado = evento.estado === 'cerrado' || evento.estado === 'cerrada';

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
        <MainLayout>
            <Head title={`Evento #${evento.id_evento} | AVA`} />

            <div className="relative w-full">
                <div className="sticky top-8 z-40 h-0 hidden xl:block overflow-visible">
                    <div className="absolute left-10 xl:left-16">
                        <Link
                            href={route('eventos.index')}
                            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-bold bg-white text-verde-6 border border-verde-5 hover:bg-verde-5 hover:text-black transition-all shadow-md shadow-verde-5/10 whitespace-nowrap"
                        >
                            ← Volver al listado
                        </Link>
                    </div>
                </div>

                <div className="max-w-[1100px] mx-auto p-6 lg:p-8">
                    <div className="xl:hidden mb-6">
                        <Link
                            href={route('eventos.index')}
                            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-bold bg-white text-verde-6 border border-verde-5 hover:bg-verde-5 hover:text-black transition-all shadow-sm whitespace-nowrap"
                        >
                            ← Volver al listado
                        </Link>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gris-2 mb-2">Evento #{evento.id_evento}</h1>
                        <p className="text-gris-1 text-sm">Detalle del reporte registrado.</p>
                    </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna principal */}
                    <div className="lg:col-span-2 bg-white border border-verde-3 rounded-2xl p-8 shadow-2xl h-fit">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-gris-2 uppercase tracking-wider">
                                Información del evento
                            </h3>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${estadoStyle}`}
                            >
                                {evento.estado.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="flex flex-col mb-3">
                            <InfoRow label="Referencia (lugar)" value={evento.referencia} />
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

                        {/* FORMULARIO PARA CERRAR EL EVENTO (Solo visible si no está cerrado) */}
                        {!estaCerrado && (
                            <div className="pt-8 border-t border-verde-3">
                                <h3 className="text-lg font-bold text-gris-2 mb-4">Cerrar Evento</h3>
                                <p className="text-gris-1 text-sm mb-6">Proporciona los detalles y la evidencia de la resolución para dar por cerrado este reporte.</p>
                                
                                <form onSubmit={handleCerrar} className="space-y-6">
                                    <div>
                                        <label className="block text-[14px] uppercase tracking-wider text-gris-1 mb-2">
                                            Acción correctiva / Justificación
                                        </label>
                                        <textarea
                                            rows={4}
                                            required
                                            maxLength={500}
                                            value={data.justificacion}
                                            onChange={e => setData('justificacion', e.target.value)}
                                            placeholder="Detalla qué acciones se tomaron para solucionar el problema..."
                                            className="w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-3.5 text-sm text-gris-2 focus:outline-none focus:border-verde-5 resize-none transition-colors"
                                        ></textarea>
                                        <div className="flex justify-between mt-1">
                                            <div>{(errors as any).justificacion && <p className="text-red-400 text-xs">{(errors as any).justificacion}</p>}</div>
                                            <span className={`text-[11px] font-bold ${data.justificacion.length >= 500 ? 'text-rojo-1' : 'text-gris-1'}`}>
                                                {data.justificacion.length} / 500
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[14px] uppercase tracking-wider text-gris-1 mb-2">
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
                                                    className="w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 text-sm text-gris-2 focus:outline-none focus:border-verde-5 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-verde-5/10 file:text-verde-6 hover:file:bg-verde-5/20 cursor-pointer transition-colors"
                                                />
                                            </>
                                        )}

                                        {archivosSubidos.length > 0 && (
                                            <div className="flex flex-col gap-2 mt-3">
                                                {archivosSubidos.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between gap-3 bg-verde-1 border border-verde-5/50 p-2 pr-4 rounded-lg w-full">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <span className="text-xl shrink-0">📎</span>
                                                            <span className="text-sm text-verde-6 font-medium truncate">
                                                                {file.name}
                                                            </span>
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removerArchivo(index)}
                                                            className="text-rojo-1 text-lg font-black px-2 hover:scale-110 transition-transform shrink-0"
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
                                            className="px-6 py-3 rounded-lg text-sm font-bold bg-verde-5 hover:bg-verde-6 text-black transition-colors shadow-lg shadow-verde-5/20 disabled:opacity-50"
                                        >
                                            {processing ? 'Cerrando...' : 'Cerrar reporte'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Columna lateral: personas involucradas */}
                    <div className="bg-white border border-verde-3 rounded-2xl p-6 shadow-xl h-fit">
                        <h3 className="text-sm font-bold text-gris-2 uppercase tracking-wider mb-5">
                            Personas involucradas
                        </h3>

                        <div className="flex flex-col gap-4">
                            <div className="p-3 rounded-lg border border-verde-3/50 bg-verde-1">
                                <div className="text-[12px] uppercase tracking-wider text-gris-1 mb-1">
                                    Reportado por
                                </div>
                                <div className="text-sm text-gris-2">
                                    {evento.trabajador
                                        ? `${evento.trabajador.persona?.nombre ?? ''} ${evento.trabajador.persona?.apellido ?? ''}`.trim() ||
                                          `Trabajador #${evento.trabajador.id_trabajador}`
                                        : '—'}
                                </div>
                            </div>

                            <div className="p-3 rounded-lg border border-verde-3/50 bg-verde-1">
                                <div className="text-[12px] uppercase tracking-wider text-gris-1 mb-1">
                                    Supervisor asignado
                                </div>
                                <div className="text-sm text-gris-2">
                                    {evento.supervisor
                                        ? `${evento.supervisor.persona?.nombre ?? ''} ${evento.supervisor.persona?.apellido ?? ''}`.trim() ||
                                          `Supervisor #${evento.supervisor.id_trabajador}`
                                        : 'Sin asignar'}
                                </div>
                            </div>

                            <div className="p-3 rounded-lg border border-verde-3/50 bg-verde-1">
                                <div className="text-[12px] uppercase tracking-wider text-gris-1 mb-1">
                                    Cerrado por
                                </div>
                                <div className="text-sm text-gris-2">
                                    {evento.administrativo
                                        ? `${evento.administrativo.persona?.nombre ?? ''} ${evento.administrativo.persona?.apellido ?? ''}`.trim() ||
                                          `Administrativo #${evento.administrativo.id_trabajador}`
                                        : 'Sin cerrar'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </MainLayout>
    );
}
