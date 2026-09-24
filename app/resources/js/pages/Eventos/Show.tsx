import { Head, Link, usePage } from '@inertiajs/react';
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
    abierto: 'bg-[#a0f700]/10 text-[#a0f700] border-[#a0f700]/40',
    proceso: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/40',
    cerrada: 'bg-[#7a7f85]/10 text-[#7a7f85] border-[#7a7f85]/40',
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
        <div className="flex flex-col gap-1 py-3 border-b border-[#2d3238]/60 last:border-b-0">
            <span className="text-[12px] uppercase tracking-wider text-[#7a7f85]">{label}</span>
            <span className="text-sm text-white">{value}</span>
        </div>
    );
}

export default function Show() {
    const { evento } = usePage().props as unknown as { evento: Evento };

    const estadoStyle = ESTADO_STYLES[evento.estado] ?? ESTADO_STYLES['abierto'];

    return (
        <MainLayout>
            <Head title={`Evento #${evento.id_evento} | AVA`} />

            <div className="max-w-[1100px] mx-auto p-6 lg:p-8 lg:mt-2">
                <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Evento #{evento.id_evento}</h1>
                        <p className="text-[#7a7f85] text-sm">Detalle del reporte registrado.</p>
                    </div>

                    <Link
                        href={route('eventos.index')}
                        className="px-4 py-2 rounded-lg text-sm font-bold border border-[#2d3238] text-white hover:border-[#7a7f85] transition-colors"
                    >
                        ← Volver al listado
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna principal */}
                    <div className="lg:col-span-2 bg-[#141414] border border-[#2d3238] rounded-2xl p-8 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                Información del evento
                            </h3>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${estadoStyle}`}
                            >
                                {evento.estado}
                            </span>
                        </div>

                        <div className="flex flex-col">
                            <InfoRow
                                label="Tipo de evento"
                                value={evento.tipoEvento?.nombre ?? `#${evento.id_tipo_evento}`}
                            />
                            <InfoRow label="Referencia (lugar)" value={evento.referencia} />
                            <InfoRow
                                label={`Condición #${evento.condicion}`}
                                value={CONDICIONES_PARE[evento.condicion]}
                            />
                            <InfoRow label="Descripción" value={evento.descripcion} />
                            <InfoRow label="Proyecto" value={evento.proyecto?.nombre} />
                            <InfoRow
                                label="Fecha de creación"
                                value={
                                    evento.fecha_creacion
                                        ? new Date(evento.fecha_creacion).toLocaleString('es-CL')
                                        : undefined
                                }
                            />
                            <InfoRow
                                label="Última actualización"
                                value={
                                    evento.fecha_actualizacion
                                        ? new Date(evento.fecha_actualizacion).toLocaleString('es-CL')
                                        : undefined
                                }
                            />
                        </div>
                    </div>

                    {/* Columna lateral: personas involucradas */}
                    <div className="bg-[#111111] border border-[#2d3238] rounded-2xl p-6 shadow-xl h-fit">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">
                            Personas involucradas
                        </h3>

                        <div className="flex flex-col gap-4">
                            <div className="p-3 rounded-lg border border-[#2d3238]/50 bg-[#0a0a0a]">
                                <div className="text-[12px] uppercase tracking-wider text-[#7a7f85] mb-1">
                                    Reportado por
                                </div>
                                <div className="text-sm text-white">
                                    {evento.trabajador
                                        ? `${evento.trabajador.persona?.nombre ?? ''} ${evento.trabajador.persona?.apellido ?? ''}`.trim() ||
                                          `Trabajador #${evento.trabajador.id_trabajador}`
                                        : '—'}
                                </div>
                            </div>

                            <div className="p-3 rounded-lg border border-[#2d3238]/50 bg-[#0a0a0a]">
                                <div className="text-[12px] uppercase tracking-wider text-[#7a7f85] mb-1">
                                    Supervisor asignado
                                </div>
                                <div className="text-sm text-white">
                                    {evento.supervisor
                                        ? `${evento.supervisor.persona?.nombre ?? ''} ${evento.supervisor.persona?.apellido ?? ''}`.trim() ||
                                          `Supervisor #${evento.supervisor.id_trabajador}`
                                        : 'Sin asignar'}
                                </div>
                            </div>

                            <div className="p-3 rounded-lg border border-[#2d3238]/50 bg-[#0a0a0a]">
                                <div className="text-[12px] uppercase tracking-wider text-[#7a7f85] mb-1">
                                    Cerrado por
                                </div>
                                <div className="text-sm text-white">
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
        </MainLayout>
    );
}
