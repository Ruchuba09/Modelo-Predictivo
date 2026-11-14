import { Link } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import CampoContrasena from '@/components/CampoContrasena';

export interface RolDelUsuario {
    id_rol: number;
    nombre: string;
    estado: 'activo' | 'inactivo';
    descripcion?: string | null;
}

export interface Usuario {
    id_user: number;
    id_trabajador: number;
    rut: string | null;
    nombre: string | null;
    email: string;
    roles: RolDelUsuario[];
    eventos_registrados_count?: number;
    es_propio: boolean;
}

// Alias de tipo (no interface): useForm exige un tipo indexable.
export type UsuarioFormData = {
    rut: string;
    email: string;
    password: string;
    password_confirmation: string;
    roles: number[];
};

/** RF-27 E-3: las mismas reglas que valida el servidor, para avisar mientras se escribe (RF-27.2.1). */
export function erroresContrasena(password: string): string | null {
    if (password === '') return null;
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (password.length > 64) return 'La contraseña no puede superar los 64 caracteres.';
    if (!/\p{Lu}/u.test(password) || !/\p{Ll}/u.test(password) || !/\d/.test(password)) {
        return 'La contraseña debe tener al menos una mayúscula, una minúscula y un dígito.';
    }
    return null;
}

interface UsuarioFormProps {
    data: UsuarioFormData;
    setData: <K extends keyof UsuarioFormData>(campo: K, valor: UsuarioFormData[K]) => void;
    errors: Partial<Record<keyof UsuarioFormData | 'general', string>> & Record<string, string | undefined>;
    processing: boolean;
    roles: RolDelUsuario[];
    /** RF-28: en la edición el RUT no se modifica y la contraseña es opcional. */
    edicion?: boolean;
    textoBoton: string;
    textoProcesando: string;
    onSubmit: FormEventHandler;
}

const inputClass =
    'w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 text-gris-2 text-sm focus:outline-none focus:border-verde-5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
const labelClass = 'block text-sm font-medium text-gris-2 mb-2';
const errorClass = 'text-red-400 text-xs mt-1';

/** Formulario común de RF-27 (registrar) y RF-28 (modificar) Usuario. */
export default function UsuarioForm({
    data, setData, errors, processing, roles, edicion = false, textoBoton, textoProcesando, onSubmit,
}: UsuarioFormProps) {
    const toggleRol = (id: number) => {
        setData('roles', data.roles.includes(id) ? data.roles.filter((r) => r !== id) : [...data.roles, id]);
    };

    const errorLocalContrasena = erroresContrasena(data.password);
    const noCoincide = data.password_confirmation !== '' && data.password !== data.password_confirmation;
    const errorRoles = errors.roles
        ?? Object.entries(errors).find(([campo]) => campo.startsWith('roles.'))?.[1];

    return (
        <form onSubmit={onSubmit} className="bg-white border border-verde-3 rounded-xl p-6 lg:p-8 space-y-6">
            {errors.general && (
                <p className="rounded-lg border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-500">{errors.general}</p>
            )}

            <div>
                <label htmlFor="rut" className={labelClass}>RUT</label>
                <input
                    id="rut"
                    type="text"
                    required={!edicion}
                    disabled={edicion}
                    maxLength={20}
                    value={data.rut}
                    onChange={(e) => setData('rut', e.target.value)}
                    className={inputClass}
                    placeholder="12.345.678-9"
                    autoComplete="off"
                />
                {errors.rut ? (
                    <p className={errorClass}>{errors.rut}</p>
                ) : (
                    <p className="mt-1 text-xs text-gris-1">
                        {edicion ? 'La cuenta pertenece a esta persona; el RUT no se puede cambiar.' : 'Debe ser el RUT de un trabajador registrado que aún no tenga cuenta.'}
                    </p>
                )}
            </div>

            <div>
                <label htmlFor="email" className={labelClass}>Correo electrónico</label>
                <input
                    id="email"
                    type="email"
                    required
                    maxLength={255}
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className={inputClass}
                    placeholder="usuario@empresa.cl"
                    autoComplete="off"
                />
                {errors.email && <p className={errorClass}>{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="password" className={labelClass}>
                        {edicion ? 'Nueva contraseña' : 'Contraseña'}
                        {edicion && <span className="font-normal text-gris-1"> (opcional)</span>}
                    </label>
                    <CampoContrasena
                        id="password"
                        required={!edicion}
                        maxLength={64}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        className={inputClass}
                        placeholder="••••••••"
                        autoComplete="new-password"
                    />
                    {(errorLocalContrasena ?? errors.password) ? (
                        <p className={errorClass}>{errorLocalContrasena ?? errors.password}</p>
                    ) : (
                        <p className="mt-1 text-xs text-gris-1">8 a 64 caracteres, con mayúscula, minúscula y dígito.</p>
                    )}
                </div>
                <div>
                    <label htmlFor="password_confirmation" className={labelClass}>Confirmar contraseña</label>
                    <CampoContrasena
                        id="password_confirmation"
                        required={!edicion || data.password !== ''}
                        maxLength={64}
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        className={inputClass}
                        placeholder="••••••••"
                        autoComplete="new-password"
                    />
                    {noCoincide && <p className={errorClass}>La confirmación de la contraseña no coincide.</p>}
                </div>
            </div>
            {edicion && (
                <p className="-mt-3 text-xs text-gris-1">
                    Si la cambia, se cerrarán las sesiones abiertas del usuario en otros equipos y en la aplicación móvil.
                </p>
            )}

            <div>
                <span className={labelClass}>Roles</span>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {roles.map((rol) => (
                        <label
                            key={rol.id_rol}
                            title={rol.descripcion ?? undefined}
                            className="flex items-center gap-2.5 bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 cursor-pointer hover:border-verde-4 transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={data.roles.includes(rol.id_rol)}
                                onChange={() => toggleRol(rol.id_rol)}
                                className="accent-[#a0f700]"
                            />
                            <span className="flex-1 text-gris-2 text-sm">{rol.nombre}</span>
                            {rol.estado === 'inactivo' && <span className="text-xs text-gris-1">Inactivo</span>}
                        </label>
                    ))}
                    {roles.length === 0 && <p className="text-gris-1 text-sm sm:col-span-2">No hay roles activos.</p>}
                </div>
                {errorRoles ? (
                    <p className={errorClass}>{errorRoles}</p>
                ) : (
                    data.roles.length === 0 && (
                        <p className="mt-1 text-xs text-gris-1">
                            {edicion ? 'El usuario debe mantener al menos un rol asignado.' : 'Debe asignar al menos un rol.'}
                        </p>
                    )
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-verde-3">
                <Link href="/usuarios" className="px-5 py-2.5 rounded-lg text-sm font-medium text-gris-1 hover:text-gris-2 transition-colors">
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={processing || errorLocalContrasena !== null || noCoincide || data.roles.length === 0}
                    className="bg-verde-5 hover:bg-verde-6 disabled:opacity-50 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-verde-5/10"
                >
                    {processing ? textoProcesando : textoBoton}
                </button>
            </div>
        </form>
    );
}
