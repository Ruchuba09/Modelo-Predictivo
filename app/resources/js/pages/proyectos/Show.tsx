import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";

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
    descripcion: string | null;
    ubicacion: string | null;
    fecha_inicio: string | null;
    fecha_termino: string | null;
    estado: string;
    faena?: Faena;
    cliente?: Cliente;
}

interface PageProps {
    id: number;
}

export default function Show() {
    const { id } = usePage<PageProps>().props;

    const [proyecto, setProyecto] = useState<Proyecto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const cargarProyecto = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(`/api/proyectos/${id}`);

                if (!response.ok) {
                    throw new Error("No se pudo obtener el proyecto");
                }

                const data = await response.json();

                setProyecto(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Error al cargar el proyecto"
                );
            } finally {
                setLoading(false);
            }
        };

        cargarProyecto();
    }, [id]);

    if (loading) {
        return (
            <>
                <Head title="Proyecto" />

                <div className="min-h-screen bg-[#101010] text-white flex items-center justify-center">
                    <p className="text-[#7a7f85]">
                        Cargando proyecto...
                    </p>
                </div>
            </>
        );
    }

    if (error || !proyecto) {
        return (
            <>
                <Head title="Proyecto" />

                <div className="min-h-screen bg-[#101010] text-white p-6 lg:p-8">
                    <div className="max-w-[1700px] mx-auto">
                        <div className="bg-[#141414] border border-[#2d3238] rounded-2xl p-8">
                            <h1 className="text-xl font-bold mb-3">
                                Proyecto no encontrado
                            </h1>

                            <p className="text-[#7a7f85] mb-6">
                                {error || "No se encontró el proyecto."}
                            </p>

                            <Link
                                href="/proyectos"
                                className="inline-flex items-center px-4 py-2 rounded-lg bg-[#a0f700] text-black font-semibold hover:opacity-90 transition"
                            >
                                Volver a proyectos
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={proyecto.nombre} />

            <div className="min-h-screen bg-[#101010] text-white">
                <main className="max-w-[1700px] mx-auto p-6 lg:p-8 lg:mt-2">

                    {/* Encabezado */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

                        <div>
                            <div className="text-xs uppercase tracking-wider text-[#7a7f85] font-bold mb-2">
                                Proyecto
                            </div>

                            <h1 className="text-3xl font-bold">
                                {proyecto.nombre}
                            </h1>
                        </div>

                        <div className="flex gap-3">
                            <Link
                                href="/proyectos"
                                className="px-4 py-2 rounded-lg border border-[#2d3238] text-[#d0d3d6] hover:bg-[#1a1a1a] transition"
                            >
                                Volver
                            </Link>

                            <Link
                                href={`/proyectos/${proyecto.id_proyecto}/edit`}
                                className="px-4 py-2 rounded-lg bg-[#a0f700] text-black font-semibold hover:opacity-90 transition"
                            >
                                Editar
                            </Link>
                        </div>
                    </div>

                    {/* Información principal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

                        <div className="bg-[#141414] border border-[#2d3238] rounded-2xl p-5">
                            <div className="text-xs uppercase tracking-wider text-[#7a7f85] font-bold mb-2">
                                Cliente
                            </div>

                            <div className="text-lg font-semibold">
                                {proyecto.cliente?.nombre ?? "Sin cliente"}
                            </div>
                        </div>

                        <div className="bg-[#141414] border border-[#2d3238] rounded-2xl p-5">
                            <div className="text-xs uppercase tracking-wider text-[#7a7f85] font-bold mb-2">
                                Faena
                            </div>

                            <div className="text-lg font-semibold">
                                {proyecto.faena?.nombre ?? "Sin faena"}
                            </div>
                        </div>

                        <div className="bg-[#141414] border border-[#2d3238] rounded-2xl p-5">
                            <div className="text-xs uppercase tracking-wider text-[#7a7f85] font-bold mb-2">
                                Estado
                            </div>

                            <span className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-[#a0f700]/10 text-[#a0f700] border border-[#a0f700]/40">
                                {proyecto.estado}
                            </span>
                        </div>

                        <div className="bg-[#141414] border border-[#2d3238] rounded-2xl p-5">
                            <div className="text-xs uppercase tracking-wider text-[#7a7f85] font-bold mb-2">
                                Ubicación
                            </div>

                            <div className="text-lg font-semibold">
                                {proyecto.ubicacion ?? "Sin ubicación"}
                            </div>
                        </div>
                    </div>

                    {/* Detalles */}
                    <div className="bg-[#141414] border border-[#2d3238] rounded-2xl p-6">

                        <h2 className="text-xl font-bold mb-6">
                            Información del proyecto
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div>
                                <div className="text-xs uppercase tracking-wider text-[#7a7f85] font-bold mb-2">
                                    Fecha de inicio
                                </div>

                                <div className="text-[#d0d3d6]">
                                    {proyecto.fecha_inicio
                                        ? new Date(
                                              proyecto.fecha_inicio
                                          ).toLocaleDateString("es-CL")
                                        : "No definida"}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs uppercase tracking-wider text-[#7a7f85] font-bold mb-2">
                                    Fecha de término
                                </div>

                                <div className="text-[#d0d3d6]">
                                    {proyecto.fecha_termino
                                        ? new Date(
                                              proyecto.fecha_termino
                                          ).toLocaleDateString("es-CL")
                                        : "No definida"}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <div className="text-xs uppercase tracking-wider text-[#7a7f85] font-bold mb-2">
                                    Descripción
                                </div>

                                <div className="text-[#d0d3d6] whitespace-pre-wrap">
                                    {proyecto.descripcion ||
                                        "Sin descripción"}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}