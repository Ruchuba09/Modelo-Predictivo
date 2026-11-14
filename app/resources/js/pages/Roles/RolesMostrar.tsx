import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { EstadoRol } from './Index';
import type { Rol } from './RolForm';
import { eliminarRol, motivoNoEliminable } from './eliminarRol';
import { NivelPermiso } from '../Permisos/nivel';

/** RF-21.3: detalle del Rol con sus Permisos. */
export default function RolesMostrar() {
    const { rol } = usePage().props as unknown as { rol: Rol };
    const permisos = rol.permisos ?? [];
    const motivo = motivoNoEliminable(rol);

    return (
        <MainLayout>
            <Head title={`Rol ${rol.nombre} | AVA`} />

            <div className="max-w-[700px] mx-auto p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/roles" className="text-gris-1 hover:text-gris-2 transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Detalles del Rol</h1>
                    <p className="text-gris-1 text-sm">
                        {rol.es_sistema ? 'Rol del sistema: su nombre y su estado no se pueden cambiar.' : 'Información del rol y sus permisos.'}
                    </p>
                </div>

                <div className="bg-white border border-verde-3 rounded-xl p-6 lg:p-8 space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <div>
                            <p className="text-xs text-gris-1 mb-1">Nombre</p>
                            <p className="text-gris-2 text-sm font-medium">{rol.nombre}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gris-1 mb-1">Estado</p>
                            <EstadoRol estado={rol.estado} />
                        </div>
                        <div>
                            <p className="text-xs text-gris-1 mb-1">Usuarios asignados</p>
                            <p className="text-gris-2 text-sm">{rol.usuarios_count ?? 0}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gris-1 mb-1">Descripción</p>
                        <p className="text-gris-2 text-sm whitespace-pre-wrap">{rol.descripcion || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gris-1 mb-1">
                            Permisos asignados {rol.todos_los_permisos ? '' : `(${permisos.length})`}
                        </p>
                        {rol.todos_los_permisos ? (
                            <p className="mt-2 text-gris-2 text-sm">Tiene todos los permisos del sistema</p>
                        ) : (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {permisos.map((p) => (
                                <span
                                    key={p.id_permiso}
                                    title={p.descripcion ?? undefined}
                                    className="inline-flex items-center gap-1.5 bg-verde-2 text-verde-6 text-xs px-2 py-1 rounded-md border border-verde-5/20"
                                >
                                    {p.nombre}
                                    {p.nivel ? <NivelPermiso nivel={p.nivel} /> : null}
                                </span>
                            ))}
                            {permisos.length === 0 && <p className="text-gris-1 text-sm">Sin permisos asignados</p>}
                        </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => eliminarRol(rol)}
                        disabled={motivo !== null}
                        title={motivo ?? 'Eliminar rol'}
                        className="rounded-lg border border-red-400/30 px-5 py-2.5 text-sm font-medium text-red-400 hover:border-red-400/60 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Eliminar
                    </button>
                    <Link href={`/roles/${rol.id_rol}/editar`} className="bg-verde-5 hover:bg-verde-6 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">
                        Editar Rol
                    </Link>
                </div>
                {motivo && <p className="mt-2 text-right text-xs text-gris-1">{motivo}</p>}
            </div>
        </MainLayout>
    );
}
