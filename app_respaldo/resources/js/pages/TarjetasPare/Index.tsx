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
                        <h1 className="text-2xl font-bold text-gris-2 mb-2">Gestión de Tarjetas PARE</h1>
                        <p className="text-gris-1 text-sm">Supervisión y resolución de detenciones operativas en terreno.</p>
                    </div>
                        <Link 
                            href="/tarjetas-pare/crear" 
                            className="bg-verde-5 hover:bg-verde-6 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-verde-5/10">
                            + Nueva Tarjeta PARE
                        </Link>
                </div>

                <div className="bg-white border border-verde-3 rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-verde-3 flex justify-between items-center bg-white">
                        <h2 className="text-sm font-bold text-gris-2 uppercase tracking-wider">Detenciones Activas</h2>
                        <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                            1 Alerta Crítica
                        </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-verde-3 text-[10px] uppercase tracking-widest text-gris-1 bg-verde-2">
                                    <th className="px-6 py-4 font-medium">ID / Fecha</th>
                                    <th className="px-6 py-4 font-medium">Faena / Zona</th>
                                    <th className="px-6 py-4 font-medium">Condición de Uso</th>
                                    <th className="px-6 py-4 font-medium text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                <tr className="border-b border-verde-3/50 hover:bg-verde-2 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-gris-2 font-bold">#PARE-084</div>
                                        <div className="text-xs text-gris-1">15 Sep 2026</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-300">Antofagasta Fase 2</div>
                                        <div className="text-xs text-gris-1">Chancado Nivel 4</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-red-400 font-medium text-xs border border-red-500/30 bg-red-500/10 px-2 py-1 rounded inline-block">
                                            3. Si NO tiene los EPP adecuados.
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => setModalAbierto(true)}
                                            className="bg-verde-5 hover:bg-verde-6 text-black px-4 py-2 rounded-md text-xs font-bold transition-colors shadow-lg shadow-verde-5/10"
                                        >
                                            Resolver
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
                    <div className="bg-white border border-verde-3 rounded-2xl w-full max-w-[600px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        
                        <div className="p-6 border-b border-verde-3 bg-white flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gris-2">Autorizar Reinicio de Operaciones</h3>
                                <p className="text-xs text-gris-1 mt-1">Cierre de Tarjeta PARE #084</p>
                            </div>
                            <button onClick={() => setModalAbierto(false)} className="text-gris-1 hover:text-gris-2 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCerrarReporte} className="p-6 space-y-5">
                            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                                <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">Motivo de Detención Original</p>
                                <p className="text-sm text-gray-200">Personal detectado sin arnés de seguridad realizando maniobras a 3 metros de altura. Condición #3 (Sin EPP adecuados).</p>
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-gris-1 mb-2">
                                    Acción Correctiva Tomada (Evidencia de Resolución) <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={justificacion}
                                    onChange={(e) => setJustificacion(e.target.value)}
                                    placeholder="Ej: Se hace entrega de arnés certificado al trabajador, se realiza charla de 5 minutos..."
                                    className="w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-3 text-sm text-gris-2 focus:outline-none focus:border-verde-5 resize-none transition-colors"
                                ></textarea>
                                <p className="text-[10px] text-gris-1 mt-2 italic">
                                    * Esta acción quedará registrada en la bitácora del SGI para auditorías.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-verde-3">
                                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gris-1 hover:text-gris-2 border border-verde-3 hover:border-gris-1 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-bold bg-verde-5 hover:bg-verde-6 text-black transition-colors shadow-lg shadow-verde-5/20">
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