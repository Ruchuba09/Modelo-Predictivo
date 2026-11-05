import { FormEvent } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { CONDICIONES_PARE } from '../../lib/condicionesPare';

interface Evento {
    id_evento: number;
    condicion: number | string | null;
    descripcion: string;
    referencia: string;
    proyecto?: { nombre: string } | null;
}

const CAMPO =
    'w-full bg-verde-1 border border-verde-3 rounded-lg px-3 py-2 text-[15px] text-gris-2 focus:outline-none focus:border-verde-5';
const ETIQUETA = 'block text-[13px] font-bold uppercase tracking-wider text-gris-1 mb-1';

export default function Edit() {
    const { evento } = usePage().props as unknown as { evento: Evento };
    const { data, setData, put, processing, errors } = useForm({
        condicion: Number(evento.condicion) || 0,
        descripcion: evento.descripcion,
        referencia: evento.referencia,
    });

    const guardar = (e: FormEvent) => {
        e.preventDefault();
        put(`/eventos/${evento.id_evento}`);
    };

    return (
        <MainLayout title={`Editar reporte #${evento.id_evento}`} subtitle={evento.proyecto?.nombre}>
            <Head title={`Editar reporte #${evento.id_evento} | AVA`} />

            <div className="max-w-[800px] mx-auto p-6 lg:p-8">
                <form onSubmit={guardar} className="bg-white border border-verde-3 rounded-xl p-6 shadow-lg space-y-4">
                    <div>
                        <label htmlFor="condicion" className={ETIQUETA}>Condición</label>
                        <select
                            id="condicion"
                            required
                            value={data.condicion}
                            onChange={(e) => setData('condicion', Number(e.target.value))}
                            className={CAMPO}
                        >
                            {Object.entries(CONDICIONES_PARE).map(([id, texto]) => (
                                <option key={id} value={id}>{id.padStart(2, '0')}. {texto}</option>
                            ))}
                        </select>
                        {errors.condicion && <p className="text-red-400 text-xs mt-1">{errors.condicion}</p>}
                    </div>

                    <div>
                        <label htmlFor="referencia" className={ETIQUETA}>Lugar exacto</label>
                        <input
                            id="referencia"
                            required
                            maxLength={255}
                            value={data.referencia}
                            onChange={(e) => setData('referencia', e.target.value)}
                            className={CAMPO}
                        />
                        {errors.referencia && <p className="text-red-400 text-xs mt-1">{errors.referencia}</p>}
                    </div>

                    <div>
                        <label htmlFor="descripcion" className={ETIQUETA}>Descripción</label>
                        <textarea
                            id="descripcion"
                            required
                            rows={4}
                            maxLength={500}
                            value={data.descripcion}
                            onChange={(e) => setData('descripcion', e.target.value)}
                            className={`${CAMPO} resize-none`}
                        />
                        {errors.descripcion && <p className="text-red-400 text-xs mt-1">{errors.descripcion}</p>}
                    </div>

                    <div className="pt-4 border-t border-verde-3 flex justify-end gap-3">
                        <Link href={`/eventos/${evento.id_evento}`} className="px-5 py-2.5 rounded-lg text-sm font-bold text-gris-1 hover:text-gris-2">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={processing} className="px-6 py-2.5 rounded-lg text-sm font-bold bg-verde-5 hover:bg-verde-6 text-black disabled:opacity-50">
                            {processing ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
