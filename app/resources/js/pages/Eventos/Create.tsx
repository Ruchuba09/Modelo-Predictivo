import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useRef } from 'react';
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
    const { tiposEvento } = usePage().props as unknown as { tiposEvento: any[] };

    const { data, setData, post, processing, errors } = useForm({
        id_tipo_evento: 0,
        condicion: 0,
        descripcion: '',
        referencia: '',
        evidencia: [] as File[]
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // FUNCIÓN PARA AGREGAR ARCHIVOS
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivosNuevos = Array.from(e.target.files || []);
        const archivosActuales = data.evidencia || []; // Validación de seguridad
        
        const totalArchivos = archivosActuales.length + archivosNuevos.length;

        if (totalArchivos > 3) {
            alert("Puedes subir un máximo de 3 archivos.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setData('evidencia', [...archivosActuales, ...archivosNuevos]);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; 
        }
    };

    // FUNCIÓN PARA BORRAR
    const removerArchivo = (index: number) => {
        const nuevosArchivos = [...(data.evidencia || [])]; // Validación de seguridad
        nuevosArchivos.splice(index, 1);
        setData('evidencia', nuevosArchivos);
    };

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

        if (data.id_tipo_evento === 0) {
            alert("Por favor, seleccione un tipo de evento.");
            return;
        }

        post('/eventos');
    };

    // VARIABLE SEGURA PARA RENDERIZAR
    const archivosSubidos = data.evidencia || [];

    return (
        <MainLayout>
            <Head title="Ingreso de Reporte | AVA" />

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8 lg:mt-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Ingreso de Reporte</h1>
                    <p className="text-[#7a7f85] text-sm">Registra un evento detallando la condición y la descripción.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <div className="lg:col-span-2 bg-[#141414] border border-[#2d3238] rounded-2xl p-8 shadow-2xl h-full flex flex-col">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            <div>
                                <label className="block text-[14px] uppercase tracking-wider text-[#7a7f85] mb-2">
                                    Referencia 
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.referencia}
                                    onChange={e => setData('referencia', e.target.value)}
                                    placeholder="Ej: Chancador primario, Nivel 4..."
                                    className="w-full bg-[#0a0a0a] border border-[#2d3238] rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#a0f700] transition-colors"
                                />
                                {errors.referencia && <p className="text-red-400 text-xs mt-1">{errors.referencia}</p>}
                            </div>

                            <div>
                                <label className="block text-[14px] uppercase tracking-wider text-[#7a7f85] mb-2">
                                    Condición del Evento (PARE)
                                </label>
                                <select
                                    required
                                    value={data.condicion}
                                    onChange={e => setData('condicion', Number(e.target.value))}
                                    className="w-full bg-[#0a0a0a] border border-[#2d3238] rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#a0f700] transition-colors cursor-pointer"
                                >
                                    <option value={0}>Seleccione la condición identificada</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                        <option key={num} value={num}>
                                            {num.toString().padStart(2, '0')}. {condicionesPare[num]}
                                        </option>
                                    ))}
                                </select>
                                {(errors as any).condicion && <p className="text-red-400 text-xs mt-1">{(errors as any).condicion}</p>}
                            </div>

                            <div>
                                <label className="block text-[14px] uppercase tracking-wider text-[#7a7f85] mb-2 mt-4">
                                    Descripción Detallada
                                </label>
                                <textarea
                                    rows={5}
                                    required
                                    value={data.descripcion}
                                    onChange={e => setData('descripcion', e.target.value)}
                                    placeholder="Describe el contexto del hallazgo..."
                                    className="w-full bg-[#0a0a0a] border border-[#2d3238] rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#a0f700] resize-none transition-colors"
                                ></textarea>
                                {errors.descripcion && <p className="text-red-400 text-xs mt-1">{errors.descripcion}</p>}
                            </div>

                            {/* SECCIÓN MULTI-ARCHIVO SEGURA */}
                            <div>
                                <label className="block text-[14px] uppercase tracking-wider text-[#7a7f85] mb-2 mt-4">
                                    Evidencia Adjunta (Máx 3. archivos)
                                </label>
                                
                                {archivosSubidos.length < 3 && (
                                    <>
                                        <input
                                            type="file"
                                            multiple
                                            ref={fileInputRef}
                                            accept="image/*,.pdf,.doc,.docx"
                                            onChange={handleFileChange}
                                            className="w-full bg-[#0a0a0a] border border-[#2d3238] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#a0f700] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#a0f700]/10 file:text-[#a0f700] hover:file:bg-[#a0f700]/20 cursor-pointer transition-colors"
                                        />
                                        <p className="text-[#7a7f85] text-xs mt-2">Puedes adjuntar hasta 3 fotos o documentos (JPG, PNG, PDF).</p>
                                    </>
                                )}

                                {archivosSubidos.length > 0 && (
                                    <div className="flex flex-col gap-2 mt-3">
                                        {archivosSubidos.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between gap-3 bg-[#0a0a0a] border border-[#a0f700]/50 p-2 pr-4 rounded-lg w-full">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <span className="text-xl shrink-0">📎</span>
                                                    <span className="text-sm text-[#a0f700] font-medium truncate">
                                                        {file.name}
                                                    </span>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => removerArchivo(index)}
                                                    className="text-[#FF4B4B] text-lg font-black px-2 hover:scale-110 transition-transform shrink-0"
                                                    title="Quitar archivo"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {(errors as any).evidencia && <p className="text-red-400 text-xs mt-1">{(errors as any).evidencia}</p>}
                            </div>

                            {(errors as any).general && (
                                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3">
                                    {(errors as any).general}
                                </p>
                            )}

                            <div className="flex justify-center gap-4 pt-6 border-t border-[#2d3238] mt-8">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-3 rounded-lg text-lg font-bold bg-[#a0f700] hover:bg-[#86cf00] text-black transition-colors shadow-lg shadow-[#a0f700]/20 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {processing ? 'Guardando...' : 'Registrar evento'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-[#111111] border border-[#2d3238] rounded-2xl p-6 shadow-xl sticky top-6 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar flex flex-col">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                                Guía de Condiciones
                            </h3>
                            <div className="space-y-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                    <div
                                        key={num}
                                        className={`p-3 rounded-lg border text-xs leading-relaxed transition-colors duration-300 flex gap-3 cursor-pointer ${
                                            data.condicion === num
                                                ? 'bg-[#a0f700]/10 border-[#a0f700]/50 text-white shadow-inner'
                                                : 'bg-[#0a0a0a] border-[#2d3238]/50 text-[#7a7f85] hover:border-[#7a7f85]/50'
                                        }`}
                                        onClick={() => setData('condicion', num)}
                                    >
                                        <div className={`font-black shrink-0 ${data.condicion === num ? 'text-[#a0f700]' : 'text-gray-600'}`}>
                                            {num.toString().padStart(2, '0')}.
                                        </div>
                                        <div>{condicionesPare[num]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </MainLayout>
    );
}