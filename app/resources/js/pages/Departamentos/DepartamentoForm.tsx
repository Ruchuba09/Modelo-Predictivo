import { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';

export interface DatosDepartamento {
    id_departamento?: number;
    nombre: string;
    descripcion?: string | null;
    estado?: string;
}

const CAMPO =
    'w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2 text-[15px] text-gris-2 focus:outline-none focus:border-verde-5';
const ETIQUETA = 'block text-[13px] font-bold uppercase tracking-wider text-gris-1 mb-1';

export default function DepartamentoForm({ departamento }: { departamento?: DatosDepartamento }) {
    const { data, setData, post, put, processing, errors } = useForm({
        nombre: departamento?.nombre ?? '',
        descripcion: departamento?.descripcion ?? '',
        estado: departamento?.estado ?? 'activo',
    });

    const guardar = (e: FormEvent) => {
        e.preventDefault();
        if (departamento?.id_departamento) {
            put(`/departamentos/${departamento.id_departamento}`);
        } else {
            post('/departamentos');
        }
    };

    return (
        <form onSubmit={guardar} className="bg-white border border-verde-3 rounded-xl p-6 shadow-lg space-y-4">
            <div>
                <label htmlFor="nombre" className={ETIQUETA}>Nombre</label>
                <input
                    id="nombre"
                    required
                    maxLength={150}
                    value={data.nombre}
                    onChange={(e) => setData('nombre', e.target.value)}
                    className={CAMPO}
                />
                {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
            </div>

            <div>
                <label htmlFor="descripcion" className={ETIQUETA}>Descripción</label>
                <textarea
                    id="descripcion"
                    rows={3}
                    maxLength={500}
                    value={data.descripcion}
                    onChange={(e) => setData('descripcion', e.target.value)}
                    className={`${CAMPO} resize-none`}
                />
                {errors.descripcion && <p className="text-red-400 text-xs mt-1">{errors.descripcion}</p>}
            </div>

            <div>
                <label htmlFor="estado" className={ETIQUETA}>Estado</label>
                <select id="estado" value={data.estado} onChange={(e) => setData('estado', e.target.value)} className={CAMPO}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                </select>
                {errors.estado && <p className="text-red-400 text-xs mt-1">{errors.estado}</p>}
            </div>

            <div className="pt-4 border-t border-verde-3 flex justify-end gap-3">
                <Link href="/departamentos" className="px-5 py-2.5 rounded-lg text-sm font-bold text-gris-1 hover:text-gris-2">
                    Cancelar
                </Link>
                <button type="submit" disabled={processing} className="px-6 py-2.5 rounded-lg text-sm font-bold bg-verde-5 hover:bg-verde-6 text-black disabled:opacity-50">
                    {processing ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
    );
}
