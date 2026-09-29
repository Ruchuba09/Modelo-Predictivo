import { Link } from '@inertiajs/react';
import { useProyectos } from "../../hooks/useProyectos";

export default function Index() {
    const {
        proyectos,
        loading,
        error,
        eliminar,
    } = useProyectos();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#101010] text-white flex items-center justify-center">
                <p className="text-[#7a7f85]">
                    Cargando proyectos...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#101010] text-white">
            <main className="max-w-[1700px] mx-auto p-6 lg:p-8">

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <div className="text-xs uppercase tracking-wider text-[#7a7f85] font-bold">
                            Gestión
                        </div>

                        <h1 className="text-3xl font-bold">
                            Proyectos
                        </h1>
                    </div>

                    <Link
                        to="/proyectos/create"
                        className="px-4 py-2 rounded-lg bg-[#a0f700] text-black font-semibold"
                    >
                        Nuevo proyecto
                    </Link>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400">
                        {error}
                    </div>
                )}

                <div className="bg-[#141414] border border-[#2d3238] rounded-2xl overflow-hidden">

                    <table className="w-full">
                        <thead className="bg-[#101010]">
                            <tr>
                                <th className="text-left p-4 text-xs uppercase text-[#7a7f85]">
                                    Proyecto
                                </th>

                                <th className="text-left p-4 text-xs uppercase text-[#7a7f85]">
                                    Cliente
                                </th>

                                <th className="text-left p-4 text-xs uppercase text-[#7a7f85]">
                                    Faena
                                </th>

                                <th className="text-left p-4 text-xs uppercase text-[#7a7f85]">
                                    Estado
                                </th>

                                <th className="p-4"></th>
                            </tr>
                        </thead>

                        <tbody>
                            {proyectos.map((proyecto) => (
                                <tr
                                    key={proyecto.id_proyecto}
                                    className="border-t border-[#2d3238] hover:bg-[#1a1a1a]"
                                >
                                    <td className="p-4">
                                        <Link
                                            to={`/proyectos/${proyecto.id_proyecto}`}
                                            className="font-semibold hover:text-[#a0f700]"
                                        >
                                            {proyecto.nombre}
                                        </Link>
                                    </td>

                                    <td className="p-4 text-[#d0d3d6]">
                                        {proyecto.cliente?.nombre ??
                                            "Sin cliente"}
                                    </td>

                                    <td className="p-4 text-[#d0d3d6]">
                                        {proyecto.faena?.nombre ??
                                            "Sin faena"}
                                    </td>

                                    <td className="p-4">
                                        <span className="px-3 py-1 rounded-full text-sm bg-[#a0f700]/10 text-[#a0f700] border border-[#a0f700]/40">
                                            {proyecto.estado}
                                        </span>
                                    </td>

                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() =>
                                                eliminar(
                                                    proyecto.id_proyecto
                                                )
                                            }
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            </main>
        </div>
    );
}