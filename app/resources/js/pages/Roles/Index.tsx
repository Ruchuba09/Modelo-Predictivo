import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import type { Rol } from './RolForm';
import { eliminarRol, motivoNoEliminable } from './eliminarRol';

/** RF-21: listado de Roles con búsqueda por nombre. */
export default function Index() {
    const { roles, buscar } = usePage().props as unknown as { roles: Rol[]; buscar: string };
    const [texto, setTexto] = useState(buscar ?? '');

    const buscarRoles = (e: FormEvent) => {
        e.preventDefault();
        const valor = texto.trim();
        router.get('/roles', valor ? { buscar: valor } : {}, { preserveState: true, replace: true });
    };

    return (
        <MainLayout>
            <Head title="Roles | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gris-2 mb-1">Gestión de Roles</h1>
                        <p className="text-gris-1 text-sm">Roles del sistema y los permisos que otorgan.</p>
                    </div>
                    <Link
                        href="/roles/crear"
                        className="bg-verde-5 hover:bg-verde-6 text-black px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-verde-5/10"
                    >
                        <span className="text-lg leading-none">+</span> Crear Rol
                    </Link>
                </div>

                <form onSubmit={buscarRoles} className="mb-6 flex flex-col gap-3 sm:flex-row">
                    <input
                        type="search"
                        value={texto}
                        maxLength={100}
                        onChange={(e) => setTexto(e.target.value)}
                        placeholder="Buscar por nombre"
                        className="w-full sm:max-w-sm bg-white border border-verde-3 rounded-lg px-4 py-2.5 text-gris-2 text-sm focus:outline-none focus:border-verde-5"
                    />
                    <button type="submit" className="rounded-lg border border-verde-3 bg-white px-4 py-2.5 text-sm text-gris-2 hover:border-verde-5">
                        Buscar
                    </button>
                    {buscar && (
                        <button
                            type="button"
                            onClick={() => { setTexto(''); router.get('/roles', {}, { replace: true }); }}
                            className="px-2 text-sm text-gris-1 hover:text-gris-2"
                        >
                            Limpiar
                        </button>
                    )}
                </form>

                <div className="bg-white border border-verde-3 rounded-xl overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-verde-3 text-left text-gris-1">
                                <th className="px-6 py-4 font-medium">Nombre</th>
                                <th className="px-6 py-4 font-medium">Estado</th>
                                <th className="px-6 py-4 font-medium">Permisos</th>
                                <th className="px-6 py-4 font-medium">Usuarios</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((rol) => {
                                const motivo = motivoNoEliminable(rol);
                                return (
                                    <tr key={rol.id_rol} className="border-b border-verde-3 last:border-0 hover:bg-verde-1 transition-colors">
                                        <td className="px-6 py-4 text-gris-2">
                                            <span className="font-medium">{rol.nombre}</span>
                                            {rol.es_sistema && (
                                                <span className="ml-2 rounded-md border border-verde-5/30 bg-verde-2 px-2 py-0.5 text-[11px] text-verde-6">
                                                    Sistema
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <EstadoRol estado={rol.estado} />
                                        </td>
                                        <td className="px-6 py-4 text-gris-2">{rol.todos_los_permisos ? 'Todos' : rol.permisos_count ?? 0}</td>
                                        <td className="px-6 py-4 text-gris-2">{rol.usuarios_count ?? 0}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/roles/${rol.id_rol}`} className="text-gris-1 hover:text-gris-2 text-xs font-medium px-3 py-1.5 rounded-md border border-verde-3 hover:border-verde-4 transition-colors">
                                                    Detalles
                                                </Link>
                                                <Link href={`/roles/${rol.id_rol}/editar`} className="text-verde-6 text-xs font-medium px-3 py-1.5 rounded-md border border-verde-5/20 hover:border-verde-5/40 transition-colors">
                                                    Editar
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarRol(rol)}
                                                    disabled={motivo !== null}
                                                    title={motivo ?? 'Eliminar rol'}
                                                    className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-md border border-red-400/20 hover:border-red-400/40 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    Borrar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {roles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gris-1">No se encontraron roles</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    );
}

export function EstadoRol({ estado }: { estado: Rol['estado'] }) {
    return estado === 'activo' ? (
        <span className="rounded-md border border-verde-5/30 bg-verde-2 px-2 py-1 text-xs text-verde-6">Activo</span>
    ) : (
        <span className="rounded-md border border-gris-1/30 bg-gris-1/10 px-2 py-1 text-xs text-gris-1">Inactivo</span>
    );
}
