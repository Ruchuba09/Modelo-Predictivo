import { Link } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { NivelPermiso } from '../Permisos/nivel';

export interface Permiso {
    id_permiso: number;
    nombre: string;
    descripcion?: string | null;
    nivel?: number | null;
}

export interface Rol {
    id_rol: number;
    nombre: string;
    descripcion: string | null;
    estado: 'activo' | 'inactivo';
    es_sistema: boolean;
    /** CA-2: el Administrador tiene todos los permisos; los suyos no se editan. */
    todos_los_permisos: boolean;
    permisos?: Permiso[];
    permisos_count?: number;
    usuarios_count?: number;
}

// Alias de tipo (no interface): useForm exige un tipo indexable.
export type RolFormData = {
    nombre: string;
    descripcion: string;
    estado: 'activo' | 'inactivo';
    permisos: number[];
};

interface RolFormProps {
    data: RolFormData;
    setData: <K extends keyof RolFormData>(campo: K, valor: RolFormData[K]) => void;
    errors: Partial<Record<keyof RolFormData | 'general', string>> & Record<string, string | undefined>;
    processing: boolean;
    permisos: Permiso[];
    /** RF-20.2.1: en un rol del sistema el nombre y el estado no se editan. */
    esSistema?: boolean;
    /** RF-20.2.1: el Administrador tiene todos los permisos (CA-2). */
    todosLosPermisos?: boolean;
    textoBoton: string;
    textoProcesando: string;
    onSubmit: FormEventHandler;
}

const inputClass =
    'w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 text-gris-2 text-sm focus:outline-none focus:border-verde-5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
const labelClass = 'block text-sm font-medium text-gris-2 mb-2';
const errorClass = 'text-red-400 text-xs mt-1';

/** Formulario común de RF-19 (registrar) y RF-20 (modificar) Rol. */
export default function RolForm({
    data, setData, errors, processing, permisos, esSistema = false, todosLosPermisos = false, textoBoton, textoProcesando, onSubmit,
}: RolFormProps) {
    const togglePermiso = (id: number) => {
        setData('permisos', data.permisos.includes(id) ? data.permisos.filter((p) => p !== id) : [...data.permisos, id]);
    };

    // Errores de un permiso concreto llegan como "permisos.N".
    const errorPermisos = errors.permisos
        ?? Object.entries(errors).find(([campo]) => campo.startsWith('permisos.'))?.[1];

    return (
        <form onSubmit={onSubmit} className="bg-white border border-verde-3 rounded-xl p-6 lg:p-8 space-y-6">
            {errors.general && (
                <p className="rounded-lg border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-500">{errors.general}</p>
            )}

            {esSistema && (
                <p className="rounded-lg border border-verde-5/30 bg-verde-2 px-4 py-3 text-sm text-gris-2">
                    Este rol es parte del sistema: su nombre y su estado no se pueden cambiar. Sí puede modificar su descripción{todosLosPermisos ? '' : ' y sus permisos'}.
                </p>
            )}

            <div>
                <label htmlFor="nombre" className={labelClass}>Nombre del rol</label>
                <input
                    id="nombre"
                    type="text"
                    required
                    maxLength={100}
                    disabled={esSistema}
                    value={data.nombre}
                    onChange={(e) => setData('nombre', e.target.value)}
                    className={inputClass}
                    placeholder="Ej. Jefe de turno"
                />
                {errors.nombre && <p className={errorClass}>{errors.nombre}</p>}
            </div>

            <div>
                <label htmlFor="descripcion" className={labelClass}>
                    Descripción <span className="font-normal text-gris-1">(opcional)</span>
                </label>
                <textarea
                    id="descripcion"
                    rows={3}
                    maxLength={500}
                    value={data.descripcion}
                    onChange={(e) => setData('descripcion', e.target.value)}
                    className={inputClass}
                />
                <p className="mt-1 text-right text-xs text-gris-1">{data.descripcion.length}/500</p>
                {errors.descripcion && <p className={errorClass}>{errors.descripcion}</p>}
            </div>

            <div>
                <span className={labelClass}>Estado</span>
                <div className="flex gap-3">
                    {(['activo', 'inactivo'] as const).map((estado) => (
                        <label
                            key={estado}
                            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
                                data.estado === estado ? 'border-verde-5 bg-verde-2' : 'border-verde-3 bg-verde-1'
                            } ${esSistema ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        >
                            <input
                                type="radio"
                                name="estado"
                                value={estado}
                                disabled={esSistema}
                                checked={data.estado === estado}
                                onChange={() => setData('estado', estado)}
                                className="accent-[#a0f700]"
                            />
                            {estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </label>
                    ))}
                </div>
                <p className="mt-1 text-xs text-gris-1">Un rol inactivo no otorga acceso ni permisos a sus usuarios.</p>
                {errors.estado && <p className={errorClass}>{errors.estado}</p>}
            </div>

            <div>
                <span className={labelClass}>Permisos</span>
                {todosLosPermisos ? (
                    <p className="rounded-lg border border-verde-3 bg-verde-1 px-4 py-3 text-sm text-gris-2">
                        Tiene todos los permisos del sistema, incluidos los que se creen en el futuro.
                    </p>
                ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {permisos.map((p) => (
                        <label
                            key={p.id_permiso}
                            title={p.descripcion ?? undefined}
                            className="flex items-center gap-2.5 bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 cursor-pointer hover:border-verde-4 transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={data.permisos.includes(p.id_permiso)}
                                onChange={() => togglePermiso(p.id_permiso)}
                                className="accent-[#a0f700]"
                            />
                            <span className="flex-1 text-gris-2 text-sm">{p.nombre}</span>
                            <NivelPermiso nivel={p.nivel} />
                        </label>
                    ))}
                    {permisos.length === 0 && (
                        <p className="text-gris-1 text-sm sm:col-span-2">No hay permisos creados todavía.</p>
                    )}
                </div>
                )}
                {errorPermisos && <p className={errorClass}>{errorPermisos}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-verde-3">
                <Link href="/roles" className="px-5 py-2.5 rounded-lg text-sm font-medium text-gris-1 hover:text-gris-2 transition-colors">
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={processing}
                    className="bg-verde-5 hover:bg-verde-6 disabled:opacity-50 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-verde-5/10"
                >
                    {processing ? textoProcesando : textoBoton}
                </button>
            </div>
        </form>
    );
}
