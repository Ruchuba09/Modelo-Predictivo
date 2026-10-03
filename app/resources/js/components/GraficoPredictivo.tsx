import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';

const CONDICIONES_COLORS: Record<string, string> = {
    'c1': '#86CF00', 
    'c2': '#86CF00',   
    'c3': '#86CF00',       
    'c4': '#86CF00',   
    'c5': '#86CF00', 
    'c6': '#86CF00',        
    'c7': '#86CF00',    
    'c8': '#86CF00',        
    'c9': '#86CF00', 
    'c10': '#86CF00',         
};


export default function GraficoPredictivo({ datosReales }: { datosReales?: Array<any> }) {
    
    const datos = datosReales || [];

    const chartRef = useRef<HTMLDivElement>(null); 
    
    const exportarGraficoPNG = async () => {
        if (chartRef.current) {
            const canvas = await html2canvas(chartRef.current, { 
                backgroundColor: '#1e2329', 
                scale: 2 
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `Grafico_Tarjeta_Pare_${new Date().toLocaleDateString()}.png`;
            link.click();
        }
    };

    const totalHallazgos = datos.reduce((acc, curr) => acc + curr.hallazgos, 0);
    const maxHallazgos = datos.length > 0 ? Math.max(...datos.map((d: any) => d.hallazgos)) : 0;
    const condicionesPrincipales = maxHallazgos > 0 ? datos.filter((d: any) => d.hallazgos === maxHallazgos) : [];

    return (
        <div className="bg-white border border-verde-3 p-6 rounded-xl text-gris-2 w-full shadow-sm"> 
            
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold">Frecuencia por Condición (Tarjeta PARE)</h3>
                    <p className="text-sm text-gris-1">Cantidad de reportes ingresados por cada tipo de condición.</p>
                </div>
                
                <button 
                    onClick={exportarGraficoPNG}
                    className="flex items-center justify-center gap-2 bg-white border border-gris-2 text-gris-2 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gris-2 hover:text-white transition-all shadow-sm cursor-pointer"
                >
                    📸 Exportar PNG
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                <div className="lg:col-span-3 flex flex-col">
                    <div ref={chartRef} className="flex-1 w-full p-4 bg-verde-1 border border-verde-3 rounded-xl min-h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={datos}
                                margin={{ top: 20, right: 30, left: 0, bottom: 70 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#DBE0D5" vertical={false} />
                                <XAxis 
                                    dataKey="condicion" 
                                    stroke="#7A7F85" 
                                    fontSize={11} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    interval={0}
                                    angle={-35}
                                    textAnchor="end"
                                    dx={25}
                                    dy={10}
                                />
                                <YAxis 
                                    stroke="#7A7F85" 
                                    fontSize={11} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    allowDecimals={false} 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', borderColor: '#DBE0D5', borderRadius: '8px' }} 
                                    itemStyle={{ color: '#2D3238', fontSize: '14px', fontWeight: 'bold' }} 
                                    cursor={{fill: '#F3FAEC', opacity: 0.8}}
                                />
                                <Bar dataKey="hallazgos" name="Reportes" radius={[4, 4, 0, 0]}>
                                    {datos.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CONDICIONES_COLORS[entry.id] || '#A0F700'} />
                                    ))}
                                    <LabelList dataKey="hallazgos" position="top" fill="#2D3238" fontSize={12} fontWeight="bold" formatter={(val: number) => val > 0 ? val : ''} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="bg-verde-1 p-5 rounded-xl border border-verde-3 flex flex-col justify-center items-center text-center">
                        <p className="text-gris-1 text-xs font-bold uppercase tracking-wider mb-2">Total Reportes</p>
                        <p className="text-5xl font-black text-gris-2">{totalHallazgos}</p>
                    </div>
                    
                    <div className="bg-verde-1 p-5 rounded-xl border border-verde-3 flex flex-col justify-center items-center text-center flex-1">
                        <p className="text-gris-1 text-xs font-bold uppercase tracking-wider mb-2">Condición más Crítica</p>
                        {condicionesPrincipales.length > 0 ? (
                            <>
                                <p className="text-4xl font-black text-rojo-1">
                                    {maxHallazgos}
                                </p>
                                <div className="mt-2 flex flex-col gap-1 w-full max-h-[100px] overflow-y-auto custom-scrollbar px-2">
                                    {condicionesPrincipales.map((c: any) => (
                                        <p key={c.id} className="text-[12px] font-bold text-gris-2 leading-tight border-b border-verde-3/30 pb-1 last:border-0 last:pb-0">
                                            {c.condicion}
                                        </p>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gris-1 mt-2">Sin datos suficientes</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

