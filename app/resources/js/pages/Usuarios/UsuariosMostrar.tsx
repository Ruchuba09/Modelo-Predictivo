import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { EstadoRol } from '../Roles/Index';
import type { Usuario } from './UsuarioForm';
import { eliminarUsuario, motivoNoEliminable } from './eliminarUsuario';

/** RF-29.3: detalle del Usuario con sus Roles. */
export default function UsuariosMostrar() {
    const { usuario } = usePage().props as unknown as { usuario: Usuario };
    const motivo = motivoNoEliminable(usuario);

    return (
        <MainLayout>
            <Head title={`Usuario ${usuario.email} | AVA`} />

            <div className="max-w-[700px] mx-auto p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/usuarios" className="text-gris-1 hover:text-gris-2 transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Detalles del Usuario</h1>
                    <p className="text-gris-1 text-sm">Información de la cuenta y sus roles.</p>
                </div>

                <div className="bg-white border border-verde-3 rounded-xl p-6 lg:p-8 space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-gris-1 mb-1">RUT</p>
                            <p className="text-gris-2 text-sm font-medium">{usuario.rut ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gris-1 mb-1">Nombre</p>
                            <p className="text-gris-2 text-sm">{usuario.nombre ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gris-1 mb-1">Correo electrónico</p>
                            <p className="text-gris-2 text-sm break-all">{usuario.email}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gris-1 mb-1">Eventos registrados</p>
                            <p className="text-gris-2 text-sm">{usuario.eventos_registrados_count ?? 0}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gris-1 mb-1">Roles asignados ({usuario.roles.length})</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {usuario.roles.map((rol) => (
                                <Link
                                    key={rol.id_rol}
                                    href={`/roles/${rol.id_rol}`}
                                    className="inline-flex items-center gap-2 rounded-md border border-verde-3 px-2 py-1 text-xs text-gris-2 hover:border-verde-5"
                                >
                                    {rol.nombre}
                                    <EstadoRol estado={rol.estado} />
                                </Link>
                            ))}
                        </div>
                        {usuario.roles.length > 0 && usuario.roles.every((r) => r.estado === 'inactivo') && (
                            <p className="mt-2 text-xs text-red-400">Todos sus roles están inactivos: no tiene acceso a ninguna función protegida.</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => eliminarUsuario(usuario)}
                        disabled={motivo !== null}
                        title={motivo ?? 'Eliminar usuario'}
                        className="rounded-lg border border-red-400/30 px-5 py-2.5 text-sm font-medium text-red-400 hover:border-red-400/60 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Eliminar
                    </button>
                    <Link href={`/usuarios/${usuario.id_user}/editar`} className="bg-verde-5 hover:bg-verde-6 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">
                        Editar Usuario
                    </Link>
                </div>
                {motivo && <p className="mt-2 text-right text-xs text-gris-1">{motivo}</p>}
            </div>
        </MainLayout>
    );
}
