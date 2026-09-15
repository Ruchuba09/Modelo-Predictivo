import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import MainLayout from '../../layouts/MainLayout';

export default function Index() {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [justificacion, setJustificacion] = useState('');

    const handleCerrarReporte = (e: React.FormEvent) => {
        e.preventDefault();
        if (justificacion.trim() === '') {
            alert('Debes ingresar la acción correctiva para autorizar el reinicio.');
            return;
        }
        alert('Reporte cerrado. Operaciones reiniciadas con éxito.');
        setModalAbierto(false);
        setJustificacion('');
    };

    return (
        <MainLayout>
            <Head title="Gestión PARE | AVA" />

            <div className="max-w-[1200px] mx-auto p-6 lg:p-8 mt-4">
                
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Gestión de Tarjetas PARE</h1>
                        <p className="text-[#7a7f85] text-sm">Supervisión y resolución de detenciones operativas en terreno.</p>
                    </div>
                        <Link 
                            href="/tarjetas-pare/crear" 
                            className="bg-[#a0f700] hover:bg-[#86cf00] text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#a0f700]/10">
                            + Nueva Tarjeta PARE
                        </Link>
                </div>

                <div className="bg-[#141414] border border-[#2d3238] rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-[#2d3238] flex justify-between items-center bg-[#111111]">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Detenciones Activas (Requieren Acción)</h2>
                        <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                            1 Alerta Crítica
                        </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#2d3238] text-[10px] uppercase tracking-widest text-[#7a7f85] bg-[#1a1a1a]">
                                    <th className="px-6 py-4 font-medium">ID / Fecha</th>
                                    <th className="px-6 py-4 font-medium">Faena / Zona</th>
                                    <th className="px-6 py-4 font-medium">Condición de Uso (Causal)</th>
                                    <th className="px-6 py-4 font-medium text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                <tr className="border-b border-[#2d3238]/50 hover:bg-[#1a1a1a] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-white font-bold">#PARE-084</div>
                                        <div className="text-xs text-[#7a7f85]">15 Sep 2026</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-300">Antofagasta Fase 2</div>
                                        <div className="text-xs text-[#7a7f85]">Chancado Nivel 4</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-red-400 font-medium text-xs border border-red-500/30 bg-red-500/10 px-2 py-1 rounded inline-block">
                                            3. Si NO tiene los EPP adecuados.
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => setModalAbierto(true)}
                                            className="bg-[#a0f700] hover:bg-[#86cf00] text-black px-4 py-2 rounded-md text-xs font-bold transition-colors shadow-lg shadow-[#a0f700]/10"
                                        >
                                            Resolver y Habilitar
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#141414] border border-[#2d3238] rounded-2xl w-full max-w-[600px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        
                        <div className="p-6 border-b border-[#2d3238] bg-[#111111] flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-white">Autorizar Reinicio de Operaciones</h3>
                                <p className="text-xs text-[#7a7f85] mt-1">Cierre de Tarjeta PARE #084</p>
                            </div>
                            <button onClick={() => setModalAbierto(false)} className="text-[#7a7f85] hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCerrarReporte} className="p-6 space-y-5">
                            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                                <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">Motivo de Detención Original</p>
                                <p className="text-sm text-gray-200">Personal detectado sin arnés de seguridad realizando maniobras a 3 metros de altura. Condición #3 (Sin EPP adecuados).</p>
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-[#7a7f85] mb-2">
                                    Acción Correctiva Tomada (Evidencia de Resolución) <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={justificacion}
                                    onChange={(e) => setJustificacion(e.target.value)}
                                    placeholder="Ej: Se hace entrega de arnés certificado al trabajador, se realiza charla de 5 minutos..."
                                    className="w-full bg-[#0a0a0a] border border-[#2d3238] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#a0f700] resize-none transition-colors"
                                ></textarea>
                                <p className="text-[10px] text-[#7a7f85] mt-2 italic">
                                    * Esta acción quedará registrada en la bitácora del SGI para auditorías.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-[#2d3238]">
                                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#7a7f85] hover:text-white border border-[#2d3238] hover:border-[#7a7f85] transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-bold bg-[#a0f700] hover:bg-[#86cf00] text-black transition-colors shadow-lg shadow-[#a0f700]/20">
                                    Confirmar y Habilitar Área
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}