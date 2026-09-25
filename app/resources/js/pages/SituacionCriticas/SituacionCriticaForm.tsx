interface Trabajador {
    id_trabajador: number;
    nombre_1: string;
    apellido_1: string;
}

interface Supervisor {
    id_trabajador: number;
    trabajador?: Trabajador;
}

interface Evento {
    id_evento: number;
    descripcion: string;
}

interface SituacionCriticaFormData {
    id_trabajador: string;
    id_supervisor: string;
    id_evento: string;
    referencia: string;
    condicion: string;
}

interface SituacionCriticaFormState {
    data: SituacionCriticaFormData;
    setData: (key: keyof SituacionCriticaFormData, value: string) => void;
    errors: Partial<Record<keyof SituacionCriticaFormData, string>>;
    processing: boolean;
}

interface SituacionCriticaFormProps {
    trabajadores: Trabajador[];
    supervisores: Supervisor[];
    eventos: Evento[];
    form: SituacionCriticaFormState;
    onSubmit: (e: React.FormEvent) => void;
}

function nombreTrabajador(trabajador?: Trabajador) {
    if (!trabajador) return '';
    return `${trabajador.nombre_1} ${trabajador.apellido_1}`;
}

const inputClass =
    'mt-1 block w-full rounded-lg border border-white/10 bg-[#0e0f11] px-3 py-2 text-sm text-white placeholder:text-[#7a7f85] focus:border-[#a0f700]/50 focus:outline-none focus:ring-1 focus:ring-[#a0f700]/50';
const labelClass = 'block text-sm font-medium text-[#7a7f85]';

export default function SituacionCriticaForm({ trabajadores, supervisores, eventos, form, onSubmit }: SituacionCriticaFormProps) {
    const { data, setData, errors, processing } = form;

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div>
                <label htmlFor="id_trabajador" className={labelClass}>
                    Trabajador
                </label>
                <select
                    id="id_trabajador"
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
                    Supervisor <span className="text-[#7a7f85]/70">(opcional)</span>
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
                <label htmlFor="id_evento" className={labelClass}>
                    Evento
                </label>
                <select
                    id="id_evento"
                    className={inputClass}
                    value={data.id_evento}
                    onChange={(e) => setData('id_evento', e.target.value)}
                >
                    <option value="">Selecciona un evento</option>
                    {eventos.map((evento) => (
                        <option key={evento.id_evento} value={evento.id_evento}>
                            {evento.descripcion}
                        </option>
                    ))}
                </select>
                {errors.id_evento && <p className="mt-1 text-sm text-red-400">{errors.id_evento}</p>}
            </div>

            <div>
                <label htmlFor="referencia" className={labelClass}>
                    Referencia
                </label>
                <input
                    id="referencia"
                    type="text"
                    className={inputClass}
                    value={data.referencia}
                    onChange={(e) => setData('referencia', e.target.value)}
                    maxLength={255}
                />
                {errors.referencia && <p className="mt-1 text-sm text-red-400">{errors.referencia}</p>}
            </div>

            <div>
                <span className={labelClass}>Condición</span>
                <div className="mt-2 flex gap-6">
                    <label className="flex items-center gap-2 text-sm text-white">
                        <input
                            type="radio"
                            name="condicion"
                            value="1"
                            checked={data.condicion === '1'}
                            onChange={(e) => setData('condicion', e.target.value)}
                            className="accent-[#a0f700]"
                        />
                        Leve
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white">
                        <input
                            type="radio"
                            name="condicion"
                            value="2"
                            checked={data.condicion === '2'}
                            onChange={(e) => setData('condicion', e.target.value)}
                            className="accent-[#a0f700]"
                        />
                        Grave
                    </label>
                </div>
                {errors.condicion && <p className="mt-1 text-sm text-red-400">{errors.condicion}</p>}
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-[#a0f700] px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-[#a0f700]/10 transition-colors hover:bg-[#86cf00] disabled:opacity-50"
                >
                    Guardar
                </button>
            </div>
        </form>
    );
}
