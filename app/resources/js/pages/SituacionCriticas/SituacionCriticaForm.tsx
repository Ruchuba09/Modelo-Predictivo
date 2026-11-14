import { Link } from '@inertiajs/react';
import { etiquetaCondicion, useCondicionesPare } from '../../lib/condicionesPare';
import { botonPrimario, inputClass, labelClass, nombreTrabajador, type Supervisor, type Trabajador } from './tipos';

interface SituacionCriticaFormData {
    id_trabajador: string;
    id_supervisor: string;
    referencia: string;
    condicion: string;
}

interface SituacionCriticaFormState {
    data: SituacionCriticaFormData;
    setData: (key: keyof SituacionCriticaFormData, value: string) => void;
    errors: Partial<Record<keyof SituacionCriticaFormData | 'general', string>>;
    processing: boolean;
}

interface SituacionCriticaFormProps {
    trabajadores: Trabajador[];
    supervisores: Supervisor[];
    idEvento: number;
    form: SituacionCriticaFormState;
    onSubmit: (e: React.FormEvent) => void;
    cancelarHref: string;
}

/** Campos editables de RF-15.2. El evento asociado se muestra pero no se puede cambiar. */
export default function SituacionCriticaForm({ trabajadores, supervisores, idEvento, form, onSubmit, cancelarHref }: SituacionCriticaFormProps) {
    const { data, setData, errors, processing } = form;
    const condiciones = useCondicionesPare();

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {errors.general && (
                <p className="rounded-lg border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-500">{errors.general}</p>
            )}

            <div>
                <label htmlFor="evento" className={labelClass}>Tarjeta PARE</label>
                <input id="evento" type="text" className={`${inputClass} bg-verde-1`} value={`Evento #${idEvento}`} readOnly disabled />
            </div>

            <div>
                <label htmlFor="id_trabajador" className={labelClass}>Trabajador</label>
                <select
                    id="id_trabajador"
                    required
                    className={inputClass}
                    value={data.id_trabajador}
                    onChange={(e) => setData('id_trabajador', e.target.value)}
                >
                    <option value="">Selecciona un trabajador</option>
                    {trabajadores.map((trabajador) => (
                        <option key={trabajador.id_trabajador} value={trabajador.id_trabajador}>
                            {nombreTrabajador(trabajador)}
                        </option>
                    ))}
                </select>
                {errors.id_trabajador && <p className="mt-1 text-sm text-red-400">{errors.id_trabajador}</p>}
            </div>

            <div>
                <label htmlFor="id_supervisor" className={labelClass}>
                    Supervisor <span className="text-gris-1/70">(opcional)</span>
                </label>
                <select
                    id="id_supervisor"
                    className={inputClass}
                    value={data.id_supervisor}
                    onChange={(e) => setData('id_supervisor', e.target.value)}
                >
                    <option value="">Sin supervisor</option>
                    {supervisores.map((supervisor) => (
                        <option key={supervisor.id_trabajador} value={supervisor.id_trabajador}>
                            {nombreTrabajador(supervisor.trabajador)}
                        </option>
                    ))}
                </select>
                {errors.id_supervisor && <p className="mt-1 text-sm text-red-400">{errors.id_supervisor}</p>}
            </div>

            <div>
                <label htmlFor="referencia" className={labelClass}>Referencia</label>
                <input
                    id="referencia"
                    type="text"
                    required
                    className={inputClass}
                    value={data.referencia}
                    onChange={(e) => setData('referencia', e.target.value)}
                    maxLength={255}
                />
                {errors.referencia && <p className="mt-1 text-sm text-red-400">{errors.referencia}</p>}
            </div>

            <div>
                <label htmlFor="condicion" className={labelClass}>Condición PARE</label>
                <select
                    id="condicion"
                    required
                    value={data.condicion}
                    onChange={(e) => setData('condicion', e.target.value)}
                    className={inputClass}
                >
                    <option value="">Seleccione la condición</option>
                    {Object.keys(condiciones).map((num) => (
                        <option key={num} value={num}>
                            {etiquetaCondicion(condiciones, num)}
                        </option>
                    ))}
                </select>
                {errors.condicion && <p className="mt-1 text-sm text-red-400">{errors.condicion}</p>}
            </div>

            <div className="flex items-center justify-between">
                <Link href={cancelarHref} className="text-sm text-gris-1 hover:text-gris-2">Cancelar</Link>
                <button type="submit" disabled={processing} className={botonPrimario}>
                    Guardar
                </button>
            </div>
        </form>
    );
}
