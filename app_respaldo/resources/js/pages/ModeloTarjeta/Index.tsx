import { Head, Link, router, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Modelo {
    id: number;
    nombre: string;
    descripcion: string | null;
}

export default function Index() {
    const { modelos } = usePage().props as unknown as { modelos: Modelo[] };

    const eliminar = (modelo: Modelo) => {
        if (confirm(`¿Eliminar el modelo "${modelo.nombre}"?`)) {
            router.delete(`/modelo-tarjeta/${modelo.id}`);
        }
    };

    return (
        <MainLayout>
            <Head title="Modelos de Tarjeta | AVA" />

            <div className="max-w-[1200px] mx-auto p-6 lg:p-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gris-2 mb-1">Modelos de Tarjeta PARE</h1>
                        <p className="text-gris-1 text-sm">Tipos de tarjeta disponibles para el reporte.</p>
                    </div>
                    <Link href="/modelo-tarjeta/crear" className="bg-verde-5 hover:bg-verde-6 text-black px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-verde-5/10">
                        <span className="text-lg leading-none">+</span> Crear Modelo
                    </Link>
                </div>

                <div className="bg-white border border-verde-3 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-verde-3 text-left text-gris-1">
                                <th className="px-6 py-4 font-medium">Nombre</th>
                                <th className="px-6 py-4 font-medium">Descripción</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modelos?.map((modelo) => (
                                <tr key={modelo.id} className="border-b border-verde-3 last:border-0 hover:bg-verde-1 transition-colors">
                                    <td className="px-6 py-4 text-gris-2">{modelo.nombre}</td>
                                    <td className="px-6 py-4 text-gris-1">{modelo.descripcion ?? '—'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/modelo-tarjeta/${modelo.id}`} className="text-gris-1 hover:text-gris-2 text-xs font-medium px-3 py-1.5 rounded-md border border-verde-3 hover:border-verde-4 transition-colors">Detalles</Link>
                                            <Link href={`/modelo-tarjeta/${modelo.id}/editar`} className="text-verde-6 hover:text-verde-6 text-xs font-medium px-3 py-1.5 rounded-md border border-verde-5/20 hover:border-verde-5/40 transition-colors">Editar</Link>
                                            <button onClick={() => eliminar(modelo)} className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-md border border-red-400/20 hover:border-red-400/40 transition-colors">Borrar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!modelos || modelos.length === 0) && (
                                <tr><td colSpan={3} className="px-6 py-10 text-center text-gris-1">No hay modelos registrados todavía.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </MainLayout>
    );
}