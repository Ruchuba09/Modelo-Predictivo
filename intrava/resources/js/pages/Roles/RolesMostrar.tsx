import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Permiso {
    id_permiso: number;
    nombre: string;
}

interface Rol {
    id_rol: number;
    nombre: string;
    permisos: Permiso[];
}

export default function RolesMostrar() {
    const { rol } = usePage().props as unknown as { rol: Rol };

    return (
        <MainLayout>
            <Head title={`Rol #${rol.id_rol} | AVA`} />

            <div className="max-w-[700px] mx-auto p-6 lg:p-8">

                <div className="flex items-center gap-3 mb-8">
                    <Link href="/roles" className="text-gris-1 hover:text-gris-2 transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Detalles del Rol</h1>
                    <p className="text-gris-1 text-sm">Información del rol #{rol.id_rol}.</p>
                </div>

                <div className="bg-white border border-verde-3 rounded-xl p-6 lg:p-8 space-y-5">
                    <div>
                        <p className="text-xs text-gris-1 mb-1">Nombre</p>
                        <p className="text-gris-2 text-sm">{rol.nombre}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gris-1 mb-1">Permisos asociados</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {rol.permisos?.map((p) => (
                                <span key={p.id_permiso} className="bg-verde-2 text-verde-6 text-xs px-2 py-1 rounded-md border border-verde-5/20">
                                    {p.nombre}
                                </span>
                            ))}
                            {rol.permisos?.length === 0 && <p className="text-gris-1 text-sm">Sin permisos asignados.</p>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Link href={`/roles/${rol.id_rol}/editar`} className="bg-verde-5 hover:bg-verde-6 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">
                        Editar Rol
                    </Link>
                </div>

            </div>
        </MainLayout>
    );
}