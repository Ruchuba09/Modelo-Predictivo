import { Link } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { NIVELES, type Nivel } from './nivel';

export interface RolDelPermiso {
    id_rol: number;
    nombre: string;
    estado: 'activo' | 'inactivo';
}

export interface Permiso {
    id_permiso: number;
    nombre: string;
    descripcion: string | null;
    nivel: number | null;
    /** CA-3: el sistema depende de su nombre; no se renombra ni se elimina. */
    es_sistema: boolean;
    roles_count?: number;
    roles?: RolDelPermiso[];
}

// Alias de tipo (no interface): useForm exige un tipo indexable.
export type PermisoFormData = {
    nombre: string;
    descripcion: string;
    nivel: '' | `${Nivel}`;
};

/** RF-23 E-1: el mismo formato que valida el servidor. */
const FORMATO_NOMBRE = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

export const MENSAJE_FORMATO =
    'El nombre solo puede contener letras minúsculas, números, puntos, guiones y guiones bajos, sin espacios.';

/** RF-23.2.1: error de formato del nombre mientras se escribe, o null si es válido o está vacío. */
export function errorFormatoNombre(nombre: string): string | null {
    const valor = nombre.trim();
    return valor === '' || FORMATO_NOMBRE.test(valor) ? null : MENSAJE_FORMATO;
}

interface PermisoFormProps {
    data: PermisoFormData;
    setData: <K extends keyof PermisoFormData>(campo: K, valor: PermisoFormData[K]) => void;
    errors: Partial<Record<keyof PermisoFormData | 'general', string>>;
    processing: boolean;
    /** RF-24.2.1: en un permiso del sistema el nombre no se edita. */
    esSistema?: boolean;
    textoBoton: string;
    textoProcesando: string;
    onSubmit: FormEventHandler;
}

const inputClass =
    'w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 text-gris-2 text-sm focus:outline-none focus:border-verde-5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
const labelClass = 'block text-sm font-medium text-gris-2 mb-2';
const errorClass = 'text-red-400 text-xs mt-1';

/** Formulario común de RF-23 (registrar) y RF-24 (modificar) Permiso. */
export default function PermisoForm({
    data, setData, errors, processing, esSistema = false, textoBoton, textoProcesando, onSubmit,
}: PermisoFormProps) {
    const errorFormato = esSistema ? null : errorFormatoNombre(data.nombre);
    const errorNombre = errorFormato ?? errors.nombre;

    return (
        <form onSubmit={onSubmit} className="bg-white border border-verde-3 rounded-xl p-6 lg:p-8 space-y-6">
            {errors.general && (
                <p className="rounded-lg border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-500">{errors.general}</p>
            )}

            {esSistema && (
                <p className="rounded-lg border border-verde-5/30 bg-verde-2 px-4 py-3 text-sm text-gris-2">
                    Este permiso es parte del sistema: su nombre no se puede cambiar. Sí puede modificar su descripción y su nivel.
                </p>
            )}

            <div>
                <label htmlFor="nombre" className={labelClass}>Nombre del permiso</label>
                <input
                    id="nombre"
                    type="text"
                    required
                    maxLength={100}
                    disabled={esSistema}
                    value={data.nombre}
                    onChange={(e) => setData('nombre', e.target.value)}
                    className={`${inputClass} font-mono`}
                    placeholder="Ej. reportes.exportar"
                    autoComplete="off"
                    spellCheck={false}
                />
                {errorNombre ? (
                    <p className={errorClass}>{errorNombre}</p>
                ) : (
                    <p className="mt-1 text-xs text-gris-1">Minúsculas, números y los separadores . - _ (por ejemplo, eventos.ver).</p>
                )}
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
                    placeholder="Qué permite hacer este permiso"
                />
                <p className="mt-1 text-right text-xs text-gris-1">{data.descripcion.length}/500</p>
                {errors.descripcion && <p className={errorClass}>{errors.descripcion}</p>}
            </div>

            <div>
                <label htmlFor="nivel" className={labelClass}>
                    Nivel <span className="font-normal text-gris-1">(opcional)</span>
                </label>
                <select
                    id="nivel"
                    value={data.nivel}
                    onChange={(e) => setData('nivel', e.target.value as PermisoFormData['nivel'])}
                    className={inputClass}
                >
                    <option value="">Sin nivel definido</option>
                    {(Object.keys(NIVELES) as `${Nivel}`[]).map((valor) => (
                        <option key={valor} value={valor}>
                            {valor} · {NIVELES[Number(valor) as Nivel]}
                        </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gris-1">Indica qué tan sensible es lo que otorga, como guía al asignarlo a un rol.</p>
                {errors.nivel && <p className={errorClass}>{errors.nivel}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-verde-3">
                <Link href="/permisos" className="px-5 py-2.5 rounded-lg text-sm font-medium text-gris-1 hover:text-gris-2 transition-colors">
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={processing || errorFormato !== null}
                    className="bg-verde-5 hover:bg-verde-6 disabled:opacity-50 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-verde-5/10"
                >
                    {processing ? textoProcesando : textoBoton}
                </button>
            </div>
        </form>
    );
}
