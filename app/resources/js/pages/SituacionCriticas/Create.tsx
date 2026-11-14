import { Head, Link, useForm } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import { etiquetaCondicion, useCondicionesPare } from '../../lib/condicionesPare';
import { botonPrimario, inputClass, labelClass, nombreSupervisor, nombreTrabajador, type Supervisor, type Trabajador } from './tipos';

interface TarjetaSinSituacion {
    id_evento: number;
    descripcion: string | null;
    referencia: string | null;
    condicion: number | null;
    id_supervisor: number | null;
    trabajador: Trabajador | null;
}

interface CreateProps {
    tarjetas: TarjetaSinSituacion[];
    supervisores: Supervisor[];
}

/** RF-14.2: registro manual. Solo se elige la Tarjeta PARE; los datos se copian de ella. */
export default function Create({ tarjetas, supervisores }: CreateProps) {
    const condiciones = useCondicionesPare();
    const form = useForm({ id_evento: '' });
    const errores = form.errors as Record<string, string | undefined>;
    const tarjeta = tarjetas.find((t) => String(t.id_evento) === form.data.id_evento);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/situacion-criticas');
    };

    return (
        <MainLayout>
            <Head title="Nueva situación crítica | AVA" />

            <div className="mx-auto max-w-2xl p-6 lg:p-8">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-gris-2">Nueva situación crítica</h1>
                    <p className="text-sm text-gris-1">
                        Para Tarjetas PARE que no tienen Situación Crítica. Los datos se copian de la tarjeta.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6 rounded-xl border border-verde-3 bg-white p-6">
                    {errores.general && (
                        <p className="rounded-lg border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-500">{errores.general}</p>
                    )}

                    <div>
                        <label htmlFor="id_evento" className={labelClass}>Tarjeta PARE</label>
                        <select
                            id="id_evento"
                            required
                            className={inputClass}
                            value={form.data.id_evento}
                            onChange={(e) => form.setData('id_evento', e.target.value)}
                            disabled={tarjetas.length === 0}
                        >
                            <option value="">
                                {tarjetas.length === 0 ? 'Todas las Tarjetas PARE tienen Situación Crítica' : 'Seleccione una Tarjeta PARE'}
                            </option>
                            {tarjetas.map((t) => (
                                <option key={t.id_evento} value={t.id_evento}>
                                    #{t.id_evento} — {nombreTrabajador(t.trabajador)}
                                    {t.descripcion ? ` — ${t.descripcion.slice(0, 60)}` : ''}
                                </option>
                            ))}
                        </select>
                        {form.errors.id_evento && <p className="mt-1 text-sm text-red-400">{form.errors.id_evento}</p>}
                    </div>

                    {tarjeta && (
                        <dl className="grid grid-cols-1 gap-4 rounded-lg border border-verde-3 bg-verde-1 p-4 text-sm sm:grid-cols-2">
                            <div>
                                <dt className="text-gris-1">Trabajador</dt>
                                <dd className="text-gris-2">{nombreTrabajador(tarjeta.trabajador)}</dd>
                            </div>
                            <div>
                                <dt className="text-gris-1">Supervisor</dt>
                                <dd className="text-gris-2">{nombreSupervisor(supervisores, tarjeta.id_supervisor)}</dd>
                            </div>
                            <div>
                                <dt className="text-gris-1">Condición</dt>
                                <dd className="text-gris-2">{etiquetaCondicion(condiciones, tarjeta.condicion)}</dd>
                            </div>
                            <div>
                                <dt className="text-gris-1">Referencia</dt>
                                <dd className="text-gris-2">{tarjeta.referencia || '—'}</dd>
                            </div>
                        </dl>
                    )}

                    <div className="flex items-center justify-between">
                        <Link href="/situacion-criticas" className="text-sm text-gris-1 hover:text-gris-2">Cancelar</Link>
                        <button type="submit" disabled={form.processing || !tarjeta} className={botonPrimario}>
                            Registrar
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
