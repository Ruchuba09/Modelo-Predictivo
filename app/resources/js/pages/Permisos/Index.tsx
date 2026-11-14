import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import type { Permiso } from './PermisoForm';
import { eliminarPermiso, motivoNoEliminable } from './eliminarPermiso';
import { NivelPermiso } from './nivel';

/** RF-25: listado de Permisos con búsqueda por nombre o descripción. */
export default function Index() {
    const { permisos, buscar } = usePage().props as unknown as { permisos: Permiso[]; buscar: string };
    const [texto, setTexto] = useState(buscar ?? '');

    const buscarPermisos = (e: FormEvent) => {
        e.preventDefault();
        const valor = texto.trim();
        router.get('/permisos', valor ? { buscar: valor } : {}, { preserveState: true, replace: true });
    };

    return (
        <MainLayout>
            <Head title="Permisos | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gris-2 mb-1">Gestión de Permisos</h1>
                        <p className="text-gris-1 text-sm">
                            Cada permiso habilita una función del sistema para los roles que lo tienen. El Administrador los tiene todos.
                        </p>
                    </div>
                    <Link
                        href="/permisos/crear"
                        className="bg-verde-5 hover:bg-verde-6 text-black px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-verde-5/10"
                    >
                        <span className="text-lg leading-none">+</span> Crear Permiso
                    </Link>
                </div>

                <form onSubmit={buscarPermisos} className="mb-6 flex flex-col gap-3 sm:flex-row">
                    <input
                        type="search"
                        value={texto}
                        maxLength={100}
                        onChange={(e) => setTexto(e.target.value)}
                        placeholder="Buscar por nombre o descripción"
                        className="w-full sm:max-w-sm bg-white border border-verde-3 rounded-lg px-4 py-2.5 text-gris-2 text-sm focus:outline-none focus:border-verde-5"
                    />
                    <button type="submit" className="rounded-lg border border-verde-3 bg-white px-4 py-2.5 text-sm text-gris-2 hover:border-verde-5">
                        Buscar
                    </button>
                    {buscar && (
                        <button
                            type="button"
                            onClick={() => { setTexto(''); router.get('/permisos', {}, { replace: true }); }}
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
                                <th className="px-6 py-4 font-medium">Descripción</th>
                                <th className="px-6 py-4 font-medium">Nivel</th>
                                <th className="px-6 py-4 font-medium">Roles</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {permisos.map((permiso) => {
                                const motivo = motivoNoEliminable(permiso);
                                return (
                                    <tr key={permiso.id_permiso} className="border-b border-verde-3 last:border-0 hover:bg-verde-1 transition-colors">
                                        <td className="px-6 py-4 text-gris-2 whitespace-nowrap">
                                            <span className="font-mono font-medium">{permiso.nombre}</span>
                                            {permiso.es_sistema && (
                                                <span className="ml-2 rounded-md border border-verde-5/30 bg-verde-2 px-2 py-0.5 text-[11px] text-verde-6">
                                                    Sistema
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gris-1 min-w-[16rem]">{permiso.descripcion || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><NivelPermiso nivel={permiso.nivel} /></td>
                                        <td className="px-6 py-4 text-gris-2">{permiso.roles_count ?? 0}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/permisos/${permiso.id_permiso}`} className="text-gris-1 hover:text-gris-2 text-xs font-medium px-3 py-1.5 rounded-md border border-verde-3 hover:border-verde-4 transition-colors">
                                                    Detalles
                                                </Link>
                                                <Link href={`/permisos/${permiso.id_permiso}/editar`} className="text-verde-6 text-xs font-medium px-3 py-1.5 rounded-md border border-verde-5/20 hover:border-verde-5/40 transition-colors">
                                                    Editar
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarPermiso(permiso)}
                                                    disabled={motivo !== null}
                                                    title={motivo ?? 'Eliminar permiso'}
                                                    className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-md border border-red-400/20 hover:border-red-400/40 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    Borrar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {permisos.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gris-1">No se encontraron permisos</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    );
}
