import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import MainLayout from '../../layouts/MainLayout';

const CONDICIONES = [
    'Si las condiciones de trabajo NO son seguras.',
    'Si NO tiene las herramientas adecuadas o están en mal estado.',
    'Si NO tiene los EPP adecuados.',
    'Si NO sabe o no está capacitado / autorizado para realizar la actividad.',
    'Si NO hay un procedimiento / instructivo asociado a la actividad o si este existe pero no ha sido difundido.',
    'NO contar con el apoyo de recursos humanos y/o materiales necesarios para realizar la actividad.',
    'NO contar con AST, VATS, ERT.',
    'NO contar con el o los permisos exigidos para realizar la actividad.',
    'NO encontrarse en condiciones físicas o emocionales para realizar la actividad.',
    'Otras condiciones no consideradas que impliquen un riesgo no controlado.'
];

export default function Create() {
    const { data, setData, post, processing, errors, progress } = useForm<{
        tipo: 'incidente' | 'fatalidad' | '';
        condicion: string;
        descripcion: string;
        referencia: string;
        evidencia: File | null;
        gravedad: string;
        requiere_investigacion: boolean;
        causa_muerte: string;
        id_victima: string;
    }>({
        tipo: '',
        condicion: '',
        descripcion: '',
        referencia: '',
        evidencia: null,
        gravedad: '',
        requiere_investigacion: false,
        causa_muerte: '',
        id_victima: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/eventos', {
            forceFormData: true,
        });
    };

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto p-6 lg:p-8">
                <h1 className="text-2xl font-bold text-white mb-6">Registrar Evento</h1>

                <form onSubmit={submit} className="space-y-5 bg-[#15181c] border border-white/5 rounded-xl p-6">

                    <div>
                        <label className="block text-sm text-[#7a7f85] mb-1.5">Tipo de evento</label>
                        <select
                            value={data.tipo}
                            onChange={(e) => setData('tipo', e.target.value as 'incidente' | 'fatalidad')}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                        >
                            <option value="">Seleccione...</option>
                            <option value="incidente">Incidente</option>
                            <option value="fatalidad">Fatalidad</option>
                        </select>
                        {errors.tipo && <p className="text-red-400 text-xs mt-1">{errors.tipo}</p>}
                    </div>

                    <div>
                        <label className="block text-sm text-[#7a7f85] mb-1.5">Condición del evento</label>
                        <select
                            value={data.condicion}
                            onChange={(e) => setData('condicion', e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="">Seleccione...</option>
                        {CONDICIONES.map((c, index) => (
                                <option key={index} value={(index + 1).toString()}>
                                    {index + 1}. {c}
                                </option>
                            ))}
                        </select>
                        {errors.condicion && <p className="text-red-400 text-xs mt-1">{errors.condicion}</p>}
                    </div>

                    <div>
                        <label className="block text-sm text-[#7a7f85] mb-1.5">Descripción</label>
                        <textarea
                            value={data.descripcion}
                            onChange={(e) => setData('descripcion', e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                            rows={3}
                        />
                        {errors.descripcion && <p className="text-red-400 text-xs mt-1">{errors.descripcion}</p>}
                    </div>

                    <div>
                        <label className="block text-sm text-[#7a7f85] mb-1.5">Referencia</label>
                        <input
                            type="text"
                            value={data.referencia}
                            onChange={(e) => setData('referencia', e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                        />
                        {errors.referencia && <p className="text-red-400 text-xs mt-1">{errors.referencia}</p>}
                    </div>

                    {data.tipo === 'incidente' && (
                        <>
                            <div>
                                <label className="block text-sm text-[#7a7f85] mb-1.5">Gravedad</label>
                                <input
                                    type="text"
                                    value={data.gravedad}
                                    onChange={(e) => setData('gravedad', e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                                {errors.gravedad && <p className="text-red-400 text-xs mt-1">{errors.gravedad}</p>}
                            </div>
                            <label className="flex items-center gap-2 text-sm text-[#7a7f85]">
                                <input
                                    type="checkbox"
                                    checked={data.requiere_investigacion}
                                    onChange={(e) => setData('requiere_investigacion', e.target.checked)}
                                />
                                Requiere investigación
                            </label>
                        </>
                    )}

                    {data.tipo === 'fatalidad' && (
                        <>
                            <div>
                                <label className="block text-sm text-[#7a7f85] mb-1.5">Causa de muerte</label>
                                <input
                                    type="text"
                                    value={data.causa_muerte}
                                    onChange={(e) => setData('causa_muerte', e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                                {errors.causa_muerte && <p className="text-red-400 text-xs mt-1">{errors.causa_muerte}</p>}
                            </div>
                            <div>
                                <label className="block text-sm text-[#7a7f85] mb-1.5">ID víctima</label>
                                <input
                                    type="number"
                                    value={data.id_victima}
                                    onChange={(e) => setData('id_victima', e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                                {errors.id_victima && <p className="text-red-400 text-xs mt-1">{errors.id_victima}</p>}
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm text-[#7a7f85] mb-1.5">Evidencia (foto o video)</label>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => setData('evidencia', e.target.files ? e.target.files[0] : null)}
                            className="w-full text-white text-sm"
                        />
                        {errors.evidencia && <p className="text-red-400 text-xs mt-1">{errors.evidencia}</p>}
                        {progress && (
                            <div className="w-full bg-white/5 rounded-full h-1.5 mt-2">
                                <div
                                    className="bg-[#a0f700] h-1.5 rounded-full"
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-[#a0f700] hover:bg-[#86cf00] text-black px-5 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50"
                    >
                        {processing ? 'Guardando...' : 'Registrar evento'}
                    </button>
                </form>
            </div>
        </MainLayout>
    );
}