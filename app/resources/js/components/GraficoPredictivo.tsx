import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    
    const [verSeguridad, setVerSeguridad] = useState(true);
    const [verCalidad, setVerCalidad] = useState(true);
    const [verAmbiental, setVerAmbiental] = useState(true);

    let datosActivos = datosSemanas;
    if (tipoTiempo === 'dias') datosActivos = datosDias;
    if (tipoTiempo === 'meses') datosActivos = datosMeses;

    const datosFiltrados = datosActivos.slice(0, cantidadVista);

    const cambiarTiempo = (nuevoTiempo: string, maximo: number) => {
        setTipoTiempo(nuevoTiempo);
        setCantidadVista(maximo);
    };

    return (
        <div className="bg-[#1e2329] border border-[#2D3238] p-6 rounded-xl text-white w-full shadow-lg">
            
            <div className="mb-6 flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                <div>
                    <h3 className="text-xl font-bold">Monitoreo de Riesgos SGI</h3>
                    <p className="text-sm text-[#7A7F85]">Proyección de hallazgos en proyectos de montaje</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex bg-[#0a0a0a] rounded-lg border border-[#2D3238] p-1">
                        <button 
                            onClick={() => cambiarTiempo('dias', datosDias.length)}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${tipoTiempo === 'dias' ? 'bg-[#3a3f45] text-white' : 'text-[#7A7F85] hover:text-white'}`}
                        >
                            Días
                        </button>
                        <button 
                            onClick={() => cambiarTiempo('semanas', datosSemanas.length)}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${tipoTiempo === 'semanas' ? 'bg-[#3a3f45] text-white' : 'text-[#7A7F85] hover:text-white'}`}
                        >
                            Semanas
                        </button>
                        <button 
                            onClick={() => cambiarTiempo('meses', datosMeses.length)}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${tipoTiempo === 'meses' ? 'bg-[#3a3f45] text-white' : 'text-[#7A7F85] hover:text-white'}`}
                        >
                            Meses
                        </button>
                    </div>

                    <div className="flex items-center gap-3 bg-[#0a0a0a] px-4 py-2 rounded-lg border border-[#2D3238]">
                        <label className="text-[#7A7F85] text-sm font-medium whitespace-nowrap">
                            Rango: <span className="text-[#A0F700] text-base ml-1">{cantidadVista}</span>
                        </label>
                        <input 
                            type="range" min="2" max={datosActivos.length} value={cantidadVista}
                            onChange={(e) => setCantidadVista(Number(e.target.value))}
                            className="w-20 sm:w-28 accent-[#A0F700] cursor-pointer"
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

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datosFiltrados} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D3238" vertical={false} />
                        <XAxis dataKey="periodo" stroke="#7A7F85" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#7A7F85" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#2D3238', borderRadius: '8px' }} itemStyle={{ color: '#fff', fontSize: '13px' }} />
                        
                        {verSeguridad && <Line type="monotone" name="Riesgo SSO" dataKey="riesgoSeguridad" stroke="#A0F700" strokeWidth={3} dot={{ r: 4, fill: '#0a0a0a', stroke: '#A0F700', strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={400} />}
                        {verCalidad && <Line type="monotone" name="No Conformidades" dataKey="riesgoCalidad" stroke="#FFCB00" strokeWidth={3} dot={{ r: 4, fill: '#0a0a0a', stroke: '#FFCB00', strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={400} />}
                        {verAmbiental && <Line type="monotone" name="Incidentes" dataKey="riesgoAmbiental" stroke="#00D1FF" strokeWidth={3} dot={{ r: 4, fill: '#0a0a0a', stroke: '#00D1FF', strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={400} />}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}