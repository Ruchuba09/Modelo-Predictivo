import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import MainLayout from '../../layouts/MainLayout';

export default function TarjetasPareCrear() {
    const hoy = new Date();
    const fechaActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    const { data, setData, post, processing } = useForm({
        referencia: '',
        condicion: 0,
        fecha_evento: fechaActual,
        descripcion: ''
    });

    const condicionesPare: {[key: number]: string} = {
        1: "Si las condiciones de trabajo NO son seguras.",
        2: "Si NO tiene las herramientas adecuadas o están en mal estado.",
        3: "Si NO tiene los EPP adecuados.",
        4: "Si NO sabe o no está capacitado / autorizado para realizar la actividad.",
        5: "Si NO hay un procedimiento / instructivo asociado a la actividad o si este existe pero no ha sido difundido.",
        6: "NO contar con el apoyo de recursos humanos y/o materiales necesarios para realizar la actividad.",
        7: "NO contar con AST, VATS, ERT.",
        8: "NO contar con el o los permisos exigidos para realizar la actividad.",
        9: "NO encontrarse en condiciones físicas o emocionales para realizar la actividad.",
        10: "Otras condiciones no consideradas que impliquen un riesgo no controlado."
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (data.condicion === 0) {
            alert("Por favor, seleccione una condición de uso (1 a 10).");
            return;
        }

        post('/eventos');
    };

    return (
        <MainLayout>
            <Head title="Ingreso de Reporte | AVA" />
            
            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 lg:mt-2 ">
                <div className="mb-8 pl-146">
                    <h1 className="text-2xl font-bold text-3xl text-gris-2 mb-2 pl-24">Ingreso de Reporte</h1>
                    <p className="text-gris-1 text-sm">Registra una Tarjeta PARE detallando la condición y el lugar del evento.</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mt">
                    <div className="xl:col-span-1">
                        {/* Lado izquierdo */}
                        <div className="bg-white border border-verde-3 rounded-2xl p-6 shadow-xl sticky top-24 h-full flex flex-col">
                            <h3 className="text-sm font-bold text-gris-2 uppercase tracking-wider mb-5">Guía de Condiciones</h3>
                            <div className="space-y-2.5">
                                {[1, 2, 3, 4, 5,].map(num => (
                                    <div 
                                        key={num} 
                                        className={`p-3 rounded-lg border text-lg leading-relaxed transition-colors duration-300 flex gap-3 ${
                                            data.condicion === num 
                                                ? 'bg-verde-5/10 border-verde-5/50 text-gris-2 shadow-inner' 
                                                : 'bg-verde-1 border-verde-3/50 text-gris-1'
                                        }`}
                                    >
                                        <div className={`font-black shrink-0 ${data.condicion === num ? 'text-verde-6' : 'text-gray-600'}`}>
                                            {num.toString().padStart(2, '0')}.
                                        </div>
                                        <div>{condicionesPare[num]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Centro */}
                    <div className="xl:col-span-2 bg-white border border-verde-3 rounded-2xl p-8 shadow-2xl h-full flex flex-col">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[14px] uppercase tracking-wider text-gris-1 mb-2">
                                        Referencia (Lugar del evento)
                                    </label>
                                    <input 
                                        type="text"
                                        required
                                        value={data.referencia}
                                        onChange={e => setData('referencia', e.target.value)}
                                        placeholder="Ej: Chancador primario, Nivel 4..."
                                        className="w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-3.5 text-sm text-gris-2 focus:outline-none focus:border-verde-5 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[14px] uppercase tracking-wider text-gris-1 mb-2">
                                        Fecha del Evento
                                    </label>
                                    <input 
                                        type="date" 
                                        value={data.fecha_evento}
                                        disabled
                                        className="w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-3.5 text-sm text-gris-1 opacity-60 cursor-not-allowed" 
                                         
                                    />
                                </div>
                            </div>

                            <div className="bg-verde-1 p-5 rounded-xl border border-verde-3">
                                <div className="flex justify-between items-end mb-4">
                                    <label className="block text-[14px] uppercase tracking-wider text-gris-1">Condición del Evento</label>
                                    {data.condicion > 0 && (
                                        <span className="text-sm font-bold tracking-wide text-verde-6">
                                            Condición #{data.condicion}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setData('condicion', num)}
                                            className={`flex-1 min-w-[40px] py-2.5 rounded-md text-sm font-bold transition-all ${
                                                data.condicion === 0
                                                    ? 'bg-verde-5 text-black shadow-[0_0_15px_-3px_rgba(160,247,0,0.4)]'
                                                    : 'bg-white border border-verde-3 text-gris-2 hover:border-gris-1'
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[14px] uppercase tracking-wider text-gris-1 mb-2">
                                    Descripción Detallada
                                </label>
                                <textarea
                                    rows={5}
                                    required
                                    value={data.descripcion}
                                    onChange={e => setData('descripcion', e.target.value)}
                                    placeholder="Describe el contexto del hallazgo..."
                                    className="w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-3.5 text-sm text-gris-2 focus:outline-none focus:border-verde-5 resize-none transition-colors"
                                ></textarea>
                            </div>

                            <div className="flex justify-center gap-4 pt-6 border-t border-verde-3 mt-8">
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className="px-6 py-3 rounded-lg text-lg font-bold bg-verde-5 hover:bg-verde-6 text-black transition-colors shadow-lg shadow-verde-5/20 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {processing ? 'Guardando...' : 'Registrar evento'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Lado derecho */}
                    <div className="bg-white border border-verde-3 rounded-2xl p-6 shadow-xl sticky top-24 h-full flex flex-col">
                            <h3 className="text-sm font-bold text-gris-2 uppercase tracking-wider mb-5">Guía de Condiciones</h3>
                            <div className="flex flex-col gap-3">
                                {[6, 7, 8, 9, 10].map(num => (
                                    <div 
                                        key={num} 
                                        className={`p-3 rounded-lg border text-lg leading-relaxed transition-colors duration-300 flex gap-3 ${
                                            data.condicion === num 
                                                ? 'bg-verde-5/10 border-verde-5/50 text-gris-2 shadow-inner' 
                                                : 'bg-verde-1 border-verde-3/50 text-gris-1'
                                        }`}
                                    >
                                        <div className={`font-black shrink-0 ${data.condicion === num ? 'text-verde-6' : 'text-gray-600'}`}>
                                            {num.toString().padStart(2, '0')}.
                                        </div>
                                        <div>{condicionesPare[num]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                </div>
            </div>
        </MainLayout>
    );
}