import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { EstadoRol } from '../Roles/Index';
import type { Permiso } from './PermisoForm';
import { eliminarPermiso, motivoNoEliminable } from './eliminarPermiso';
import { NivelPermiso } from './nivel';

/** RF-25.3: detalle del Permiso con los Roles que lo otorgan. */
export default function PermisosMostrar() {
    const { permiso } = usePage().props as unknown as { permiso: Permiso };
    const roles = permiso.roles ?? [];
    const motivo = motivoNoEliminable(permiso);

    return (
        <MainLayout>
            <Head title={`Permiso ${permiso.nombre} | AVA`} />

            <div className="max-w-[700px] mx-auto p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/permisos" className="text-gris-1 hover:text-gris-2 transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Detalles del Permiso</h1>
                    <p className="text-gris-1 text-sm">
                        {permiso.es_sistema
                            ? 'Permiso del sistema: su nombre no se puede cambiar y no se puede eliminar.'
                            : 'Información del permiso y los roles que lo otorgan.'}
                    </p>
                </div>

                <div className="bg-white border border-verde-3 rounded-xl p-6 lg:p-8 space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-gris-1 mb-1">Nombre</p>
                            <p className="text-gris-2 text-sm font-mono font-medium break-all">{permiso.nombre}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gris-1 mb-1">Nivel</p>
                            <NivelPermiso nivel={permiso.nivel} />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gris-1 mb-1">Descripción</p>
                        <p className="text-gris-2 text-sm whitespace-pre-wrap">{permiso.descripcion || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gris-1 mb-1">Roles que lo tienen asignado ({roles.length})</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {roles.map((rol) => (
                                <Link
                                    key={rol.id_rol}
                                    href={`/roles/${rol.id_rol}`}
                                    className="inline-flex items-center gap-2 rounded-md border border-verde-3 px-2 py-1 text-xs text-gris-2 hover:border-verde-5"
                                >
                                    {rol.nombre}
                                    <EstadoRol estado={rol.estado} />
                                </Link>
                            ))}
                            {roles.length === 0 && <p className="text-gris-1 text-sm">Sin roles asignados</p>}
                        </div>
                        <p className="mt-3 text-xs text-gris-1">El Administrador lo tiene aunque no figure en la lista.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => eliminarPermiso(permiso)}
                        disabled={motivo !== null}
                        title={motivo ?? 'Eliminar permiso'}
                        className="rounded-lg border border-red-400/30 px-5 py-2.5 text-sm font-medium text-red-400 hover:border-red-400/60 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Eliminar
                    </button>
                    <Link href={`/permisos/${permiso.id_permiso}/editar`} className="bg-verde-5 hover:bg-verde-6 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">
                        Editar Permiso
                    </Link>
                </div>
                {motivo && <p className="mt-2 text-right text-xs text-gris-1">{motivo}</p>}
            </div>
        </MainLayout>
    );
}
