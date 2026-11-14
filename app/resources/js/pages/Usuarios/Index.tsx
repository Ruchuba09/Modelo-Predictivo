import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import type { Usuario } from './UsuarioForm';
import { eliminarUsuario, motivoNoEliminable } from './eliminarUsuario';

/** RF-29: listado de Usuarios con búsqueda por RUT, nombre o correo. */
export default function Index() {
    const { usuarios = [], buscar } = usePage().props as unknown as { usuarios: Usuario[]; buscar: string };
    const [texto, setTexto] = useState(buscar ?? '');

    const buscarUsuarios = (e: FormEvent) => {
        e.preventDefault();
        const valor = texto.trim();
        router.get('/usuarios', valor ? { buscar: valor } : {}, { preserveState: true, replace: true });
    };

    return (
        <MainLayout title="Usuarios del Sistema" subtitle="Administración de cuentas y accesos">
            <Head title="Usuarios | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gris-2 mb-1">Gestión de Usuarios</h1>
                        <p className="text-gris-1 text-sm">Cuentas con acceso al sistema y los roles que tienen asignados.</p>
                    </div>
                    <Link
                        href="/usuarios/crear"
                        className="bg-verde-5 hover:bg-verde-6 text-black px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-verde-5/10"
                    >
                        <span className="text-lg leading-none">+</span> Crear Usuario
                    </Link>
                </div>

                <form onSubmit={buscarUsuarios} className="mb-6 flex flex-col gap-3 sm:flex-row">
                    <input
                        type="search"
                        value={texto}
                        maxLength={100}
                        onChange={(e) => setTexto(e.target.value)}
                        placeholder="Buscar por RUT, nombre o correo"
                        className="w-full sm:max-w-sm bg-white border border-verde-3 rounded-lg px-4 py-2.5 text-gris-2 text-sm focus:outline-none focus:border-verde-5"
                    />
                    <button type="submit" className="rounded-lg border border-verde-3 bg-white px-4 py-2.5 text-sm text-gris-2 hover:border-verde-5">
                        Buscar
                    </button>
                    {buscar && (
                        <button
                            type="button"
                            onClick={() => { setTexto(''); router.get('/usuarios', {}, { replace: true }); }}
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
                                <th className="px-6 py-4 font-medium">RUT</th>
                                <th className="px-6 py-4 font-medium">Nombre</th>
                                <th className="px-6 py-4 font-medium">Correo electrónico</th>
                                <th className="px-6 py-4 font-medium">Roles</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map((usuario) => {
                                const motivo = motivoNoEliminable(usuario);
                                return (
                                    <tr key={usuario.id_user} className="border-b border-verde-3 last:border-0 hover:bg-verde-1 transition-colors">
                                        <td className="px-6 py-4 text-gris-2 font-medium whitespace-nowrap">{usuario.rut ?? '—'}</td>
                                        <td className="px-6 py-4 text-gris-2">
                                            {usuario.nombre ?? '—'}
                                            {usuario.es_propio && <span className="ml-2 text-xs text-gris-1">(tú)</span>}
                                        </td>
                                        <td className="px-6 py-4 text-gris-2">{usuario.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {usuario.roles.map((rol) => (
                                                    <span
                                                        key={rol.id_rol}
                                                        title={rol.estado === 'inactivo' ? 'Rol inactivo: no otorga acceso' : undefined}
                                                        className={`text-xs px-2 py-1 rounded-md border ${
                                                            rol.estado === 'activo'
                                                                ? 'bg-verde-2 text-verde-6 border-verde-5/20'
                                                                : 'bg-gris-1/10 text-gris-1 border-gris-1/30 line-through'
                                                        }`}
                                                    >
                                                        {rol.nombre}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/usuarios/${usuario.id_user}`} className="text-gris-1 hover:text-gris-2 text-xs font-medium px-3 py-1.5 rounded-md border border-verde-3 hover:border-verde-4 transition-colors">
                                                    Detalles
                                                </Link>
                                                <Link href={`/usuarios/${usuario.id_user}/editar`} className="text-verde-6 text-xs font-medium px-3 py-1.5 rounded-md border border-verde-5/20 hover:border-verde-5/40 transition-colors">
                                                    Editar
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarUsuario(usuario)}
                                                    disabled={motivo !== null}
                                                    title={motivo ?? 'Eliminar usuario'}
                                                    className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-md border border-red-400/20 hover:border-red-400/40 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    Borrar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {usuarios.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gris-1">No se encontraron usuarios</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    );
}
