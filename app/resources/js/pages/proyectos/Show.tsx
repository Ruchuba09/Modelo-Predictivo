import { Link, useParams } from "react-router-dom";

import { useProyecto } from "../../hooks/useProyecto";

export default function Show() {
    const { id } = useParams();

    const {
        proyecto,
        loading,
        error,
    } = useProyecto(id ? Number(id) : undefined);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#101010] text-white flex items-center justify-center">
                Cargando proyecto...
            </div>
        );
    }

    if (error || !proyecto) {
        return (
            <div className="min-h-screen bg-[#101010] text-white p-8">
                <h1 className="text-2xl font-bold">
                    Proyecto no encontrado
                </h1>

                <p className="text-[#7a7f85] mt-2">
                    {error}
                </p>

                <Link
                    to="/proyectos"
                    className="inline-block mt-6 text-[#a0f700]"
                >
                    Volver
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#101010] text-white">
            <main className="max-w-[1700px] mx-auto p-6 lg:p-8">

                <div className="flex justify-between items-center mb-8">

                    <div>
                        <div className="text-xs uppercase text-[#7a7f85] font-bold">
                            Proyecto
                        </div>

                        <h1 className="text-3xl font-bold">
                            {proyecto.nombre}
                        </h1>
                    </div>

                    <Link
                        to="/proyectos"
                        className="px-4 py-2 rounded-lg border border-[#2d3238]"
                    >
                        Volver
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                    <div className="bg-[#141414] border border-[#2d3238] rounded-2xl p-5">
                        <div className="text-xs uppercase text-[#7a7f85]">
                            Cliente
                        </div>

                        <div className="text-lg font-semibold mt-2">
                            {proyecto.cliente?.nombre ??
                                "Sin cliente"}
                        </div>
                    </div>

                    <div className="bg-[#141414] border border-[#2d3238] rounded-2xl p-5">
                        <div className="text-xs uppercase text-[#7a7f85]">
                            Faena
                        </div>

                        <div className="text-lg font-semibold mt-2">
                            {proyecto.faena?.nombre ??
                                "Sin faena"}
                        </div>
                    </div>

                    <div className="bg-[#141414] border border-[#2d3238] rounded-2xl p-5">
                        <div className="text-xs uppercase text-[#7a7f85]">
                            Estado
                        </div>

                        <div className="text-lg font-semibold mt-2 text-[#a0f700]">
                            {proyecto.estado}
                        </div>
                    </div>

                    <div className="bg-[#141414] border border-[#2d3238] rounded-2xl p-5">
                        <div className="text-xs uppercase text-[#7a7f85]">
                            Ubicación
                        </div>

                        <div className="text-lg font-semibold mt-2">
                            {proyecto.ubicacion ??
                                "Sin ubicación"}
                        </div>
                    </div>

                </div>

                <div className="mt-6 bg-[#141414] border border-[#2d3238] rounded-2xl p-6">

                    <h2 className="text-xl font-bold mb-6">
                        Detalles
                    </h2>

                    <div className="mb-6">
                        <div className="text-xs uppercase text-[#7a7f85]">
                            Descripción
                        </div>

                        <p className="mt-2 text-[#d0d3d6]">
                            {proyecto.descripcion ??
                                "Sin descripción"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div>
                            <div className="text-xs uppercase text-[#7a7f85]">
                                Fecha inicio
                            </div>

                            <p className="mt-2">
                                {proyecto.fecha_inicio ??
                                    "No definida"}
                            </p>
                        </div>

                        <div>
                            <div className="text-xs uppercase text-[#7a7f85]">
                                Fecha término
                            </div>

                            <p className="mt-2">
                                {proyecto.fecha_termino ??
                                    "No definida"}
                            </p>
                        </div>

                    </div>

                </div>

            </main>
        </div>
    );
}