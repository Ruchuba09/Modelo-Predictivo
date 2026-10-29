function nombreTrabajador(trabajador) {
    if (!trabajador) return '';
    return `${trabajador.nombre_1} ${trabajador.apellido_1}`;
}

/**
 * Formulario compartido entre Create.jsx y Edit.jsx.
 *
 * `form` es el objeto devuelto por useForm() en la página que lo usa
 * (expone data, setData, errors, processing).
 */
export default function SituacionCriticaForm({ trabajadores, supervisores, eventos, form, onSubmit }) {
    const { data, setData, errors, processing } = form;

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div>
                <label htmlFor="id_trabajador" className="block text-sm font-medium text-gray-700">
                    Trabajador
                </label>
                <select
                    id="id_trabajador"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
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
                {errors.id_trabajador && (
                    <p className="mt-1 text-sm text-red-600">{errors.id_trabajador}</p>
                )}
            </div>

            <div>
                <label htmlFor="id_supervisor" className="block text-sm font-medium text-gray-700">
                    Supervisor <span className="text-gray-400">(opcional)</span>
                </label>
                <select
                    id="id_supervisor"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
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
                {errors.id_supervisor && (
                    <p className="mt-1 text-sm text-red-600">{errors.id_supervisor}</p>
                )}
            </div>

            <div>
                <label htmlFor="id_evento" className="block text-sm font-medium text-gray-700">
                    Evento
                </label>
                <select
                    id="id_evento"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
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
                {errors.id_evento && <p className="mt-1 text-sm text-red-600">{errors.id_evento}</p>}
            </div>

            <div>
                <label htmlFor="referencia" className="block text-sm font-medium text-gray-700">
                    Referencia
                </label>
                <input
                    id="referencia"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                    value={data.referencia}
                    onChange={(e) => setData('referencia', e.target.value)}
                    maxLength={255}
                />
                {errors.referencia && <p className="mt-1 text-sm text-red-600">{errors.referencia}</p>}
            </div>

            <div>
                <span className="block text-sm font-medium text-gray-700">Condición</span>
                <div className="mt-2 flex gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="radio"
                            name="condicion"
                            value="1"
                            checked={data.condicion === '1'}
                            onChange={(e) => setData('condicion', e.target.value)}
                        />
                        Leve
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="radio"
                            name="condicion"
                            value="2"
                            checked={data.condicion === '2'}
                            onChange={(e) => setData('condicion', e.target.value)}
                        />
                        Grave
                    </label>
                </div>
                {errors.condicion && <p className="mt-1 text-sm text-red-600">{errors.condicion}</p>}
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                    Guardar
                </button>
            </div>
        </form>
    );
}
