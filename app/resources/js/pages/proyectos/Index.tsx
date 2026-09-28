import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';

interface Faena {
    id_faena: number;
    nombre: string;
}

interface Cliente {
    id_cliente: number;
    nombre: string;
}

interface Proyecto {
    id_proyecto: number;
    id_faena: number;
    id_cliente: number;
    nombre: string;
    descripcion?: string | null;
    ubicacion?: string | null;
    fecha_inicio?: string | null;
    fecha_termino?: string | null;
    estado: string;
    faena?: Faena;
    cliente?: Cliente;
}

const ESTADO_STYLES: { [key: string]: string } = {
    activo: 'bg-[#a0f700]/10 text-[#a0f700] border-[#a0f700]/40',
    en_proceso: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/40',
    finalizado: 'bg-[#7a7f85]/10 text-[#7a7f85] border-[#7a7f85]/40',
    cerrado: 'bg-[#7a7f85]/10 text-[#7a7f85] border-[#7a7f85]/40',
    pausado: 'bg-orange-400/10 text-orange-400 border-orange-400/40',
};

function EstadoBadge({ estado }: { estado: string }) {
    const style =
        ESTADO_STYLES[estado] ??
        'bg-[#7a7f85]/10 text-[#7a7f85] border-[#7a7f85]/40';

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase border whitespace-nowrap ${style}`}
        >
            {estado.replaceAll('_', ' ')}
        </span>
    );
}

function formatearFecha(fecha?: string | null) {
    if (!fecha) return '—';

    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CL');
}

export default function Index() {
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarProyectos();
    }, []);

    const cargarProyectos = async () => {
        try {
            setCargando(true);
            setError('');

            const response = await fetch('/api/proyectos', {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('No se pudieron obtener los proyectos.');
            }

            const data = await response.json();

            setProyectos(data);
        } catch (error) {
            console.error(error);
            setError('No fue posible cargar los proyectos.');
        } finally {
            setCargando(false);
        }
    };

    const eliminarProyecto = async (id: number) => {
        const confirmar = window.confirm(
            '¿Estás seguro de que deseas eliminar este proyecto?'
        );

        if (!confirmar) return;

        try {
            const response = await fetch(`/api/proyectos/${id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('No se pudo eliminar el proyecto.');
            }

            setProyectos((actuales) =>
                actuales.filter((proyecto) => proyecto.id_proyecto !== id)
            );
        } catch (error) {
            console.error(error);
            alert('No fue posible eliminar el proyecto.');
        }
    };

    const estadosDisponibles = Array.from(
        new Set(proyectos.map((proyecto) => proyecto.estado))
    );

    const proyectosFiltrados =
        filtroEstado === 'todos'
            ? proyectos
            : proyectos.filter(
                  (proyecto) => proyecto.estado === filtroEstado
              );

    return (
        <MainLayout>
            <Head title="Proyectos | AVA" />

            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 lg:mt-2">

                {/* Header */}
                <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Proyectos
                        </h1>

                        <p className="text-[#7a7f85] text-sm">
                            Listado de proyectos registrados.
                        </p>
                    </div>

                    <Link
                        href="/proyectos/create"
                        className="px-5 py-3 rounded-lg bg-[#a0f700] text-black text-xs font-bold uppercase hover:bg-[#b4ff33] transition-colors"
                    >
                        + Nuevo proyecto
                    </Link>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-2 mb-6">

                    <button
                        onClick={() => setFiltroEstado('todos')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase border transition-colors ${
                            filtroEstado === 'todos'
                                ? 'bg-[#a0f700] text-black border-[#a0f700]'
                                : 'bg-[#141414] border-[#2d3238] text-[#7a7f85] hover:border-[#7a7f85]'
                        }`}
                    >
                        Todos ({proyectos.length})
                    </button>

                    {estadosDisponibles.map((estado) => (
                        <button
                            key={estado}
                            onClick={() => setFiltroEstado(estado)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase border transition-colors ${
                                filtroEstado === estado
                                    ? 'bg-[#a0f700] text-black border-[#a0f700]'
                                    : 'bg-[#141414] border-[#2d3238] text-[#7a7f85] hover:border-[#7a7f85]'
                            }`}
                        >
                            {estado.replaceAll('_', ' ')} (
                            {
                                proyectos.filter(
                                    (proyecto) =>
                                        proyecto.estado === estado
                                ).length
                            }
                            )
                        </button>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
                        {error}
                    </div>
                )}

                {/* Tabla */}
                <div className="bg-[#141414] border border-[#2d3238] rounded-2xl shadow-2xl overflow-hidden">

                    {cargando ? (
                        <div className="p-10 text-center text-[#7a7f85] text-sm">
                            Cargando proyectos...
                        </div>
                    ) : proyectosFiltrados.length === 0 ? (
                        <div className="p-10 text-center text-[#7a7f85] text-sm">
                            No hay proyectos registrados.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">

                                <thead>
                                    <tr className="border-b border-[#2d3238] text-left">

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            #
                                        </th>

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            Proyecto
                                        </th>

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            Cliente
                                        </th>

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            Faena
                                        </th>

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            Ubicación
                                        </th>

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            Inicio
                                        </th>

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            Término
                                        </th>

                                        <th className="px-6 py-4 text-[12px] uppercase tracking-wider text-[#7a7f85] font-bold">
                                            Estado
                                        </th>

                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {proyectosFiltrados.map((proyecto) => (
                                        <tr
                                            key={proyecto.id_proyecto}
                                            className="border-b border-[#2d3238]/60 last:border-b-0 hover:bg-[#1a1a1a] transition-colors"
                                        >
                                            <td className="px-6 py-4 text-[#7a7f85] font-bold">
                                                #{proyecto.id_proyecto}
                                            </td>

                                            <td className="px-6 py-4 text-white font-medium">
                                                {proyecto.nombre}
                                            </td>

                                            <td className="px-6 py-4 text-[#7a7f85]">
                                                {proyecto.cliente?.nombre ?? '—'}
                                            </td>

                                            <td className="px-6 py-4 text-[#7a7f85]">
                                                {proyecto.faena?.nombre ?? '—'}
                                            </td>

                                            <td className="px-6 py-4 text-[#7a7f85]">
                                                {proyecto.ubicacion ?? '—'}
                                            </td>

                                            <td className="px-6 py-4 text-[#7a7f85]">
                                                {formatearFecha(
                                                    proyecto.fecha_inicio
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-[#7a7f85]">
                                                {formatearFecha(
                                                    proyecto.fecha_termino
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <EstadoBadge
                                                    estado={proyecto.estado}
                                                />
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-4">

                                                    <Link
                                                        href={`/proyectos/${proyecto.id_proyecto}`}
                                                        className="text-[#a0f700] hover:underline font-bold text-xs uppercase"
                                                    >
                                                        Ver →
                                                    </Link>

                                                    <button
                                                        onClick={() =>
                                                            eliminarProyecto(
                                                                proyecto.id_proyecto
                                                            )
                                                        }
                                                        className="text-red-400 hover:text-red-300 font-bold text-xs uppercase"
                                                    >
                                                        Eliminar
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}