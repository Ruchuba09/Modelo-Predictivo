import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Rol {
    id_rol: number;
    nombre: string;
}

interface Permiso {
    id_permiso: number;
    nombre: string;
    nivel: string | null;
    roles: Rol[];
}

export default function PermisosMostrar() {
    const { permiso } = usePage().props as unknown as { permiso: Permiso };

    return (
        <MainLayout>
            <Head title={`Permiso #${permiso.id_permiso} | AVA`} />

            <div className="max-w-[700px] mx-auto p-6 lg:p-8">

                <div className="flex items-center gap-3 mb-8">
                    <Link href="/permisos" className="text-gris-1 hover:text-gris-2 transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Detalles del Permiso</h1>
                    <p className="text-gris-1 text-sm">Información del permiso #{permiso.id_permiso}.</p>
                </div>

                <div className="bg-white border border-verde-3 rounded-xl p-6 lg:p-8 space-y-5">
                    <div>
                        <p className="text-xs text-gris-1 mb-1">Nombre</p>
                        <p className="text-gris-2 text-sm">{permiso.nombre}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gris-1 mb-1">Nivel</p>
                        <p className="text-gris-2 text-sm">{permiso.nivel ?? 'Sin nivel definido'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gris-1 mb-1">Roles que lo usan</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {permiso.roles?.map((r) => (
                                <span key={r.id_rol} className="bg-verde-2 text-verde-6 text-xs px-2 py-1 rounded-md border border-verde-5/20">
                                    {r.nombre}
                                </span>
                            ))}
                            {permiso.roles?.length === 0 && <p className="text-gris-1 text-sm">No está asignado a ningún rol.</p>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Link href={`/permisos/${permiso.id_permiso}/editar`} className="bg-verde-5 hover:bg-verde-6 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">
                        Editar Permiso
                    </Link>
                </div>

            </div>
        </MainLayout>
    );
}