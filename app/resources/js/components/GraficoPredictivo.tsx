import { useState, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar,
    AreaChart, Area
} from 'recharts';

const CONDICIONES = [
    { id: 'c1', nombre: '1. Cond. Inseguras', color: '#FF4B4B' }, 
    { id: 'c2', nombre: '2. Herramientas', color: '#FF9100' },   
    { id: 'c3', nombre: '3. Falta EPP', color: '#FFCB00' },       
    { id: 'c4', nombre: '4. Capacitación', color: '#A0F700' },   
    { id: 'c5', nombre: '5. Procedimientos', color: '#00E676' }, 
    { id: 'c6', nombre: '6. Recursos', color: '#00D1FF' },        
    { id: 'c7', nombre: '7. AST/VATS/ERT', color: '#29B6F6' },    
    { id: 'c8', nombre: '8. Permisos', color: '#9D4EDD' },        
    { id: 'c9', nombre: '9. Est. Físico/Mental', color: '#F48FB1' }, 
    { id: 'c10', nombre: '10. Otros', color: '#E0E0E0' },         
];

// DATOS SIMULADOS
const datosSemanas = [
    { periodo: 'Semana 1', c1: 15, c2: 4, c3: 2, c4: 0, c5: 5, c6: 1, c7: 3, c8: 0, c9: 1, c10: 2 },
    { periodo: 'Semana 2', c1: 12, c2: 6, c3: 1, c4: 1, c5: 4, c6: 2, c7: 2, c8: 1, c9: 0, c10: 1 },
    { periodo: 'Semana 3', c1: 18, c2: 3, c3: 4, c4: 0, c5: 2, c6: 0, c7: 5, c8: 0, c9: 2, c10: 0 },
    { periodo: 'Semana 4', c1: 10, c2: 5, c3: 3, c4: 2, c5: 3, c6: 1, c7: 1, c8: 2, c9: 0, c10: 3 },
];

export default function GraficoPredictivo() {
    const chartRef = useRef<HTMLDivElement>(null); 
    const [tipoGrafico, setTipoGrafico] = useState('linea'); 
    const [metricaY, setMetricaY] = useState('hallazgos');
    
    const [menuExportarAbierto, setMenuExportarAbierto] = useState(false);
    
    const [visibilidad, setVisibilidad] = useState<Record<string, boolean>>(
        CONDICIONES.reduce((acc, cond) => ({ ...acc, [cond.id]: true }), {})
    );

    const toggleVisibilidad = (id: string) => {
        setVisibilidad(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const datosTransformados = useMemo(() => {
        return datosSemanas.map(d => {
            if (metricaY === 'gravedad') {
                const nuevoDato: any = { periodo: d.periodo };
                CONDICIONES.forEach(c => {
                    nuevoDato[c.id] = Number(((d as any)[c.id] * 0.8).toFixed(1)); 
                });
                return nuevoDato;
            }
            return d;
        });
    }, [metricaY]);

    const exportarGraficoPNG = async () => {
        setMenuExportarAbierto(false); 
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

    const solicitarReportePDF = () => {
        setMenuExportarAbierto(false);
        // Aquí tu compañero conectará Laravel DomPDF / Spatie PDF
        alert('Aviso para Backend: Aquí se debe llamar a la ruta de Laravel que genera el PDF formal.');
    };

    const solicitarDatosExcel = () => {
        setMenuExportarAbierto(false);
        // Aquí tu compañero conectará Laravel Excel
        alert('Aviso para Backend: Aquí se debe llamar a la ruta de Laravel que descarga el Excel (.xlsx).');
    };

    const handleDragStart = (e: React.DragEvent, metrica: string) => e.dataTransfer.setData('metrica', metrica);
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); 
        const metricaSoltada = e.dataTransfer.getData('metrica');
        if (metricaSoltada) setMetricaY(metricaSoltada);
    };

    const renderizarGrafico = () => {
        const comunesProps = { data: datosTransformados, margin: { top: 10, right: 10, left: -20, bottom: 0 } };
        const ejesYTooltip = (
            <>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3238" vertical={false} />
                <XAxis dataKey="periodo" stroke="#7A7F85" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#7A7F85" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#2D3238', borderRadius: '8px' }} itemStyle={{ color: '#fff', fontSize: '13px' }} />
            </>
        );

        if (tipoGrafico === 'barras') {
            return (
                <BarChart {...comunesProps}>
                    {ejesYTooltip}
                    {CONDICIONES.map(c => visibilidad[c.id] && <Bar key={c.id} name={c.nombre} dataKey={c.id} fill={c.color} radius={[2, 2, 0, 0]} />)}
                </BarChart>
            );
        } else if (tipoGrafico === 'area') {
            return (
                <AreaChart {...comunesProps}>
                    {ejesYTooltip}
                    {CONDICIONES.map(c => visibilidad[c.id] && <Area key={c.id} type="monotone" name={c.nombre} dataKey={c.id} stroke={c.color} fill={c.color} fillOpacity={0.2} />)}
                </AreaChart>
            );
        }
        
        return (
            <LineChart {...comunesProps}>
                {ejesYTooltip}
                {CONDICIONES.map(c => visibilidad[c.id] && <Line key={c.id} type="monotone" name={c.nombre} dataKey={c.id} stroke={c.color} strokeWidth={2} dot={{ r: 3, fill: '#0a0a0a', stroke: c.color }} activeDot={{ r: 5 }} />)}
            </LineChart>
        );
    };

    return (
        <div className="bg-[#1e2329] border border-[#2D3238] p-6 rounded-xl text-white w-full shadow-lg">
            
            <div className="mb-6 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-6">
                <div>
                    <h3 className="text-xl font-bold">Registro Tarjeta Pare</h3>
                    <p className="text-sm text-[#7A7F85]">Análisis de detenciones por condición</p>
                </div>
                
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 relative">
                    
                    {/* BOTÓN DESPLEGABLE DE EXPORTACIÓN */}
                    <div className="relative">
                        <button 
                            onClick={() => setMenuExportarAbierto(!menuExportarAbierto)}
                            className="flex items-center gap-2 bg-[#A0F700]/10 border border-[#A0F700] text-[#A0F700] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#A0F700] hover:text-[#0a0a0a] transition-all cursor-pointer"
                        >
                            ⬇️ Exportar Data
                        </button>

                        {/* SUBMENÚ FLOTANTE */}
                        {menuExportarAbierto && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0a] border border-[#2D3238] rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
                                <button onClick={exportarGraficoPNG} className="text-left px-4 py-2.5 text-sm text-white hover:bg-[#1e2329] transition-colors border-b border-[#2D3238]">
                                    📸 Gráfico (PNG)
                                </button>
                                <button onClick={solicitarReportePDF} className="text-left px-4 py-2.5 text-sm text-[#7A7F85] hover:bg-[#1e2329] hover:text-white transition-colors border-b border-[#2D3238]">
                                    📄 Reporte Formal (PDF)
                                </button>
                                <button onClick={solicitarDatosExcel} className="text-left px-4 py-2.5 text-sm text-[#7A7F85] hover:bg-[#1e2329] hover:text-white transition-colors">
                                    📊 Datos Brutos (Excel)
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex bg-[#0a0a0a] rounded-lg border border-[#2D3238] p-1">
                        <button onClick={() => setTipoGrafico('linea')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${tipoGrafico === 'linea' ? 'bg-[#3a3f45] text-white' : 'text-[#7A7F85] hover:text-white'}`}>📈 Líneas</button>
                        <button onClick={() => setTipoGrafico('barras')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${tipoGrafico === 'barras' ? 'bg-[#3a3f45] text-white' : 'text-[#7A7F85] hover:text-white'}`}>📊 Barras</button>
                        <button onClick={() => setTipoGrafico('area')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${tipoGrafico === 'area' ? 'bg-[#3a3f45] text-white' : 'text-[#7A7F85] hover:text-white'}`}>⛰️ Área</button>
                    </div>
                </div>
            </div>

            {/* BOTONES DE FILTRO: GRID DE 10 CONDICIONES */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {CONDICIONES.map(cond => (
                    <button 
                        key={cond.id}
                        onClick={() => toggleVisibilidad(cond.id)} 
                        className={`px-2 py-1.5 rounded-md text-[10px] font-medium border transition-colors text-left truncate`}
                        style={{
                            backgroundColor: visibilidad[cond.id] ? `${cond.color}15` : '#0a0a0a',
                            borderColor: visibilidad[cond.id] ? cond.color : '#2D3238',
                            color: visibilidad[cond.id] ? cond.color : '#7A7F85'
                        }}
                        title={cond.nombre}
                    >
                        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: cond.color }}></span>
                        {cond.nombre}
                    </button>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div 
                    ref={chartRef}
                    className="flex-1 h-[360px] rounded-xl relative p-2 bg-[#1e2329]"
                    onDragOver={(e) => e.preventDefault()} 
                    onDrop={handleDrop}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        {renderizarGrafico()}
                    </ResponsiveContainer>
                </div>

                <div className="w-full lg:w-56 flex flex-col gap-3">
                    <p className="text-[#7A7F85] text-xs font-bold uppercase tracking-wider mb-1 text-center lg:text-left">
                        Métrica (Arrastrar)
                    </p>
                    <DraggableCard id="hallazgos" titulo="Cant. Eventos" descripcion="Nº de Tarjetas Pare" icono="🛑" activo={metricaY === 'hallazgos'} onDragStart={handleDragStart} />
                    <DraggableCard id="gravedad" titulo="Gravedad" descripcion="Escala de impacto" icono="⚠️" activo={metricaY === 'gravedad'} onDragStart={handleDragStart} />
                </div>
            </div>
        </div>
    );
}

function DraggableCard({ id, titulo, descripcion, icono, activo, onDragStart }: any) {
    return (
        <div draggable onDragStart={(e) => onDragStart(e, id)} className={`p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all duration-200 ${activo ? 'bg-[#A0F700]/10 border-[#A0F700]' : 'bg-[#0a0a0a] border-[#2D3238] hover:border-[#7A7F85]'}`}>
            <div className="flex items-center gap-3 pointer-events-none">
                <div className="text-xl">{icono}</div>
                <div>
                    <h4 className={`text-sm font-bold ${activo ? 'text-[#A0F700]' : 'text-white'}`}>{titulo}</h4>
                    <p className="text-[#7A7F85] text-xs mt-0.5">{descripcion}</p>
                </div>
            </div>
            <div className="mt-2 flex justify-center pointer-events-none">
                <div className="w-8 h-1 rounded-full bg-[#2D3238]"></div>
            </div>
        </div>
    );
}