import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// SETS DE DATOS SIMULADOS
const datosDias = [
    { periodo: 'Lun', riesgoSeguridad: 12, riesgoCalidad: 5, riesgoAmbiental: 2 },
    { periodo: 'Mar', riesgoSeguridad: 15, riesgoCalidad: 8, riesgoAmbiental: 3 },
    { periodo: 'Mié', riesgoSeguridad: 10, riesgoCalidad: 6, riesgoAmbiental: 2 },
    { periodo: 'Jue', riesgoSeguridad: 22, riesgoCalidad: 12, riesgoAmbiental: 5 },
    { periodo: 'Vie', riesgoSeguridad: 18, riesgoCalidad: 10, riesgoAmbiental: 4 },
    { periodo: 'Sáb', riesgoSeguridad: 8, riesgoCalidad: 4, riesgoAmbiental: 1 },
    { periodo: 'Dom', riesgoSeguridad: 5, riesgoCalidad: 2, riesgoAmbiental: 0 },
];

const datosSemanas = [
    { periodo: 'Semana 1', riesgoSeguridad: 15, riesgoCalidad: 10, riesgoAmbiental: 5 },
    { periodo: 'Semana 2', riesgoSeguridad: 25, riesgoCalidad: 12, riesgoAmbiental: 8 },
    { periodo: 'Semana 3', riesgoSeguridad: 20, riesgoCalidad: 15, riesgoAmbiental: 10 },
    { periodo: 'Semana 4', riesgoSeguridad: 35, riesgoCalidad: 18, riesgoAmbiental: 12 },
    { periodo: 'Semana 5', riesgoSeguridad: 30, riesgoCalidad: 25, riesgoAmbiental: 15 },
    { periodo: 'Semana 6', riesgoSeguridad: 45, riesgoCalidad: 22, riesgoAmbiental: 18 },
];

const datosMeses = [
    { periodo: 'Enero', riesgoSeguridad: 85, riesgoCalidad: 40, riesgoAmbiental: 20 },
    { periodo: 'Febrero', riesgoSeguridad: 92, riesgoCalidad: 45, riesgoAmbiental: 25 },
    { periodo: 'Marzo', riesgoSeguridad: 78, riesgoCalidad: 35, riesgoAmbiental: 15 },
    { periodo: 'Abril', riesgoSeguridad: 105, riesgoCalidad: 60, riesgoAmbiental: 30 },
    { periodo: 'Mayo', riesgoSeguridad: 110, riesgoCalidad: 55, riesgoAmbiental: 28 },
    { periodo: 'Junio', riesgoSeguridad: 95, riesgoCalidad: 50, riesgoAmbiental: 22 },
];

export default function GraficoPredictivo() {
    const [tipoTiempo, setTipoTiempo] = useState('semanas'); 
    const [cantidadVista, setCantidadVista] = useState(6);
    const [metricaY, setMetricaY] = useState('hallazgos');
    
    // Estado de Drag & Drop
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const [verSeguridad, setVerSeguridad] = useState(true);
    const [verCalidad, setVerCalidad] = useState(true);
    const [verAmbiental, setVerAmbiental] = useState(true);

    let datosBase = datosSemanas;
    if (tipoTiempo === 'dias') datosBase = datosDias;
    if (tipoTiempo === 'meses') datosBase = datosMeses;

    const datosTransformados = useMemo(() => {
        const datosRecortados = datosBase.slice(0, cantidadVista);
        return datosRecortados.map(d => {
            if (metricaY === 'cumplimiento') {
                return {
                    ...d,
                    riesgoSeguridad: Math.max(0, 100 - (d.riesgoSeguridad * 0.8)),
                    riesgoCalidad: Math.max(0, 100 - (d.riesgoCalidad * 1.2)),
                    riesgoAmbiental: Math.max(0, 100 - (d.riesgoAmbiental * 1.5)),
                };
            } else if (metricaY === 'gravedad') {
                return {
                    ...d,
                    riesgoSeguridad: Number((d.riesgoSeguridad / 15).toFixed(1)),
                    riesgoCalidad: Number((d.riesgoCalidad / 15).toFixed(1)),
                    riesgoAmbiental: Number((d.riesgoAmbiental / 15).toFixed(1)),
                };
            }
            return d;
        });
    }, [datosBase, cantidadVista, metricaY]);

    const cambiarTiempo = (nuevoTiempo: string, maximo: number) => {
        setTipoTiempo(nuevoTiempo);
        setCantidadVista(maximo);
    };

    // FUNCIONES DE DRAG & DROP
    const handleDragStart = (e: React.DragEvent, metrica: string) => {
        e.dataTransfer.setData('metrica', metrica);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const metricaSoltada = e.dataTransfer.getData('metrica');
        if (metricaSoltada) {
            setMetricaY(metricaSoltada);
        }
    };

    return (
        <div className="bg-[#1e2329] border border-[#2D3238] p-6 rounded-xl text-white w-full shadow-lg">
            
            <div className="mb-6 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-6">
                <div>
                    <h3 className="text-xl font-bold">Monitoreo de Riesgos SGI</h3>
                    <p className="text-sm text-[#7A7F85]">Análisis de rendimiento por área</p>
                </div>
                
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
                    <div className="flex bg-[#0a0a0a] rounded-lg border border-[#2D3238] p-1">
                        <button onClick={() => cambiarTiempo('dias', datosDias.length)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${tipoTiempo === 'dias' ? 'bg-[#3a3f45] text-white' : 'text-[#7A7F85] hover:text-white'}`}>Días</button>
                        <button onClick={() => cambiarTiempo('semanas', datosSemanas.length)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${tipoTiempo === 'semanas' ? 'bg-[#3a3f45] text-white' : 'text-[#7A7F85] hover:text-white'}`}>Semanas</button>
                        <button onClick={() => cambiarTiempo('meses', datosMeses.length)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${tipoTiempo === 'meses' ? 'bg-[#3a3f45] text-white' : 'text-[#7A7F85] hover:text-white'}`}>Meses</button>
                    </div>

                    <div className="flex items-center gap-3 bg-[#0a0a0a] px-4 py-1.5 rounded-lg border border-[#2D3238]">
                        <label className="text-[#7A7F85] text-sm font-medium whitespace-nowrap">
                            Rango temporal: <span className="text-[#A0F700] text-base ml-1">{cantidadVista}</span>
                        </label>
                        <input 
                            type="range" min="2" max={datosBase.length} value={cantidadVista}
                            onChange={(e) => setCantidadVista(Number(e.target.value))}
                            className="w-20 sm:w-24 accent-[#A0F700] cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
                <button onClick={() => setVerSeguridad(!verSeguridad)} className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${verSeguridad ? 'bg-[#A0F700]/10 border-[#A0F700] text-[#A0F700]' : 'bg-[#0a0a0a] border-[#2D3238] text-[#7A7F85]'}`}>
                    <span className="inline-block w-2 h-2 rounded-full bg-[#A0F700] mr-2"></span>SSO
                </button>
                <button onClick={() => setVerCalidad(!verCalidad)} className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${verCalidad ? 'bg-[#FFCB00]/10 border-[#FFCB00] text-[#FFCB00]' : 'bg-[#0a0a0a] border-[#2D3238] text-[#7A7F85]'}`}>
                    <span className="inline-block w-2 h-2 rounded-full bg-[#FFCB00] mr-2"></span>Calidad
                </button>
                <button onClick={() => setVerAmbiental(!verAmbiental)} className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${verAmbiental ? 'bg-[#00D1FF]/10 border-[#00D1FF] text-[#00D1FF]' : 'bg-[#0a0a0a] border-[#2D3238] text-[#7A7F85]'}`}>
                    <span className="inline-block w-2 h-2 rounded-full bg-[#00D1FF] mr-2"></span>Ambiental
                </button>
            </div>

            {/* CONTENEDOR PRINCIPAL: GRÁFICO + CUADRADOS DE MÉTRICAS */}
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* ZONA DE CAÍDA (DROP ZONE) YA CORREGIDA */}
                <div 
                    className={`flex-1 h-[320px] rounded-xl border-2 transition-all duration-300 relative ${
                        isDraggingOver ? 'border-[#A0F700] bg-[#A0F700]/5 scale-[1.01]' : 'border-transparent'
                    }`}
                    onDragEnter={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                    onDragOver={(e) => e.preventDefault()} 
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={handleDrop}
                >
                    {/* Indicador visual al arrastrar */}
                    {isDraggingOver && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                            <span className="bg-[#A0F700] text-black px-6 py-2 rounded-full font-bold shadow-lg">
                                Soltar aquí para aplicar métrica
                            </span>
                        </div>
                    )}

                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={datosTransformados} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2D3238" vertical={false} />
                            <XAxis dataKey="periodo" stroke="#7A7F85" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#7A7F85" fontSize={11} tickLine={false} axisLine={false} dx={-10} 
                                tickFormatter={(value) => metricaY === 'cumplimiento' ? `${value}%` : value} 
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#2D3238', borderRadius: '8px' }} 
                                itemStyle={{ color: '#fff', fontSize: '13px' }}
                                formatter={(value: number) => metricaY === 'cumplimiento' ? `${value.toFixed(1)}%` : value}
                            />
                            
                            {verSeguridad && <Line type="monotone" name="Seguridad (SSO)" dataKey="riesgoSeguridad" stroke="#A0F700" strokeWidth={3} dot={{ r: 4, fill: '#0a0a0a', stroke: '#A0F700', strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={400} />}
                            {verCalidad && <Line type="monotone" name="Calidad" dataKey="riesgoCalidad" stroke="#FFCB00" strokeWidth={3} dot={{ r: 4, fill: '#0a0a0a', stroke: '#FFCB00', strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={400} />}
                            {verAmbiental && <Line type="monotone" name="Medio Ambiente" dataKey="riesgoAmbiental" stroke="#00D1FF" strokeWidth={3} dot={{ r: 4, fill: '#0a0a0a', stroke: '#00D1FF', strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={400} />}
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* CAJA LATERAL: CUADRADOS ARRASTRABLES */}
                <div className="w-full lg:w-56 flex flex-col gap-3">
                    <p className="text-[#7A7F85] text-xs font-bold uppercase tracking-wider mb-1 text-center lg:text-left">
                        Métrica (Arrastrar al gráfico)
                    </p>

                    <DraggableCard 
                        id="hallazgos" 
                        titulo="Cant. Hallazgos" 
                        descripcion="Nº bruto de desvíos" 
                        icono="📊"
                        activo={metricaY === 'hallazgos'} 
                        onDragStart={handleDragStart} 
                    />
                    <DraggableCard 
                        id="cumplimiento" 
                        titulo="% Cumplimiento" 
                        descripcion="Adherencia a la norma" 
                        icono="✅"
                        activo={metricaY === 'cumplimiento'} 
                        onDragStart={handleDragStart} 
                    />
                    <DraggableCard 
                        id="gravedad" 
                        titulo="Índice Gravedad" 
                        descripcion="Escala de severidad (0-5)" 
                        icono="⚠️"
                        activo={metricaY === 'gravedad'} 
                        onDragStart={handleDragStart} 
                    />
                </div>
            </div>
        </div>
    );
}

// COMPONENTE SECUNDARIO: La Tarjetita Arrastrable
function DraggableCard({ id, titulo, descripcion, icono, activo, onDragStart }: any) {
    return (
        <div 
            draggable
            onDragStart={(e) => onDragStart(e, id)}
            className={`p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all duration-200 transform hover:-translate-y-1 ${
                activo 
                ? 'bg-[#A0F700]/10 border-[#A0F700]' 
                : 'bg-[#0a0a0a] border-[#2D3238] hover:border-[#7A7F85]'
            }`}
        >
            <div className="flex items-center gap-3">
                <div className="text-xl">{icono}</div>
                <div>
                    <h4 className={`text-sm font-bold ${activo ? 'text-[#A0F700]' : 'text-white'}`}>{titulo}</h4>
                    <p className="text-[#7A7F85] text-xs mt-0.5">{descripcion}</p>
                </div>
            </div>
            
            {/* Pequeño indicador de "arrastrable" */}
            <div className="mt-2 flex justify-center">
                <div className="w-8 h-1 rounded-full bg-[#2D3238]"></div>
            </div>
        </div>
    );
}