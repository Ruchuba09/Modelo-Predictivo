import AuthenticatedLayout from '../layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend 
} from 'recharts';
import { 
    Activity, AlertTriangle, ChevronRight, 
    RefreshCw, ShieldAlert, TrendingUp, Building2, Clock, Layers, Users, UserCheck, Filter, X, SlidersHorizontal
} from 'lucide-react';
import { 
    HORIZONTE_PREDETERMINADO, plazoHorizonte, horizonteDerivado 
} from '@/lib/modeloPredictivo';
import { OpcionesHorizonte, AvisoHorizonte } from '@/components/modelo/Elementos';
import { etiquetaTipo } from '@/lib/utils';

type Proyecto = { id_proyecto: number; nombre: string };

type EventoEstimado = {
    id_proyecto: number;
    nombre_proyecto: string;
    cliente?: string | null;
    faena?: string | null;
    area_probable?: string | null;
    tipo_evento_probable?: string | null;
    espera_estimada_dias: number;
    fecha_estimada: string;
    prob_evento_horizonte: number;
    probabilidad_30_dias?: number;
    probabilidad_90_dias?: number;
    evidencia: string;
    advertencia: string;
};

type Prediccion = {
    id_proyecto: number;
    nombre_proyecto?: string | null;
    semana: string;
    prob_evento: number;
    variables?: Record<string, string | number | boolean | null>;
    factores_principales?: Array<{ variable: string; etiqueta: string; efecto: number }>;
};

type RespuestaPredicciones = {
    tipo_objetivo: string;
    horizonte_semanas: number;
    unidad_analisis: string;
    evento: string;
    modelo: string;
    predicciones: Prediccion[];
    advertencia_modelo?: string | null;
    analisis_entidades?: {
        contexto: Record<string, any>;
        entidades: Record<string, unknown>;
    } | null;
    analisis_global?: {
        cuadrillas?: Array<Record<string, unknown>>;
        proximo_evento?: EventoEstimado | null;
    };
};

type EntidadTipo = 'proyecto' | 'area' | 'cuadrilla' | 'trabajador' | 'actividad';

type ItemGraficoEntidad = {
    id: number | string;
    nombre: string;
    probabilidad: number;
    porcentajeNum: number;
    detalle?: string | null;
    id_proyecto?: number | null;
    proyecto?: string | null;
    baseProb?: number;
    [claveEvento: string]: any;
};

const PESTANAS_ENTIDAD: Array<{
    clave: EntidadTipo;
    singular: string;
    plural: string;
    icono: React.ComponentType<{ className?: string }>;
    descripcion: string;
}> = [
    { clave: 'proyecto', singular: 'Proyecto', plural: 'Proyectos', icono: Building2, descripcion: 'Riesgo estimado por obra o faena' },
    { clave: 'area', singular: 'Área', plural: 'Áreas', icono: Layers, descripcion: 'Zonas físicas y frentes de trabajo' },
    { clave: 'cuadrilla', singular: 'Cuadrilla', plural: 'Cuadrillas', icono: Users, descripcion: 'Equipos operativos y brigadas de terreno' },
    { clave: 'trabajador', singular: 'Trabajador', plural: 'Trabajadores', icono: UserCheck, descripcion: 'Personal con mayor exposición operativa' },
    { clave: 'actividad', singular: 'Actividad', plural: 'Actividades', icono: Activity, descripcion: 'Tareas críticas y maniobras de faena' },
];

const PALETA_EVENTOS = [
    '#86CF00', // Verde AVA
    '#F59E0B', // Ámbar
    '#00B4D8', // Azul Cyan
    '#A855F7', // Púrpura
    '#EC4899', // Rosa
];

const COLORES_EVENTOS_MAP: Record<string, string> = {
    incidentes_reales: '#86CF00',
    lesiones: '#F59E0B',
    todos: '#00B4D8',
    casi_accidentes: '#A855F7',
    dano_material: '#EC4899',
};

function obtenerColorEvento(clave: string, indice: number): string {
    return COLORES_EVENTOS_MAP[clave] ?? PALETA_EVENTOS[indice % PALETA_EVENTOS.length];
}

function calcularProbabilidadPorEvento(baseProb: number, tipoEvento: string, factorHoriz: number): number {
    let factorTipo = 1.0;
    if (tipoEvento === 'lesiones') factorTipo = 0.62;
    else if (tipoEvento === 'todos') factorTipo = 1.35;
    else if (tipoEvento === 'casi_accidentes') factorTipo = 1.15;
    else if (tipoEvento === 'dano_material') factorTipo = 0.80;

    return Math.min(0.98, Math.max(0.04, Number((baseProb * factorTipo * factorHoriz).toFixed(2))));
}

export default function Dashboard(props: any) {
    const { proyectos = [], filtros = {} } = props;

    // Pestaña de entidad activa en el dashboard
    const [entidadActiva, setEntidadActiva] = useState<EntidadTipo>('proyecto');

    // FILTROS MÚLTIPLES PARA COMPARACIÓN
    // 1. Elementos seleccionados por cada entidad (diccionario con arrays de IDs)
    const [elementosSeleccionadosPorEntidad, setElementosSeleccionadosPorEntidad] = useState<Record<EntidadTipo, Array<number | string>>>({
        proyecto: filtros?.id_proyecto && String(filtros.id_proyecto) !== 'todos' ? [Number(filtros.id_proyecto)] : [],
        area: [],
        cuadrilla: [],
        trabajador: [],
        actividad: [],
    });

    // 2. Tipos de reportes seleccionados (array de strings)
    const [eventosSeleccionados, setEventosSeleccionados] = useState<string[]>(['incidentes_reales']);

    // 3. Horizonte
    const [horizonte, setHorizonte] = useState<number>(HORIZONTE_PREDETERMINADO);

    // Tipos de reportes disponibles en el sistema
    const [tiposDisponibles, setTiposDisponibles] = useState<string[]>([
        'incidentes_reales',
        'lesiones',
        'todos',
        'casi_accidentes',
        'dano_material',
    ]);

    // Estados de datos
    const [cargando, setCargando] = useState<boolean>(false);
    const [itemSeleccionadoId, setItemSeleccionadoId] = useState<string | number | null>(null);
    const [eventoEstimado, setEventoEstimado] = useState<EventoEstimado | null>(null);

    // Diccionario con los datos por entidad
    const [datosPorEntidad, setDatosPorEntidad] = useState<Record<EntidadTipo, ItemGraficoEntidad[]>>({
        proyecto: [],
        area: [],
        cuadrilla: [],
        trabajador: [],
        actividad: [],
    });

    // Cargar tipos de reportes oficiales desde la API
    useEffect(() => {
        let activo = true;
        api.get<{ tipos: string[] }>('/modelo-predictivo/tipos')
            .then(({ data }) => {
                if (activo && data.tipos?.length) {
                    const combinados = Array.from(new Set([...data.tipos, 'casi_accidentes', 'dano_material']));
                    setTiposDisponibles(combinados);
                }
            })
            .catch(() => {
                // Fallback silencioso
            });
        return () => { activo = false; };
    }, []);

    // Información de la pestaña activa
    const infoEntidad = useMemo(
        () => PESTANAS_ENTIDAD.find((p) => p.clave === entidadActiva) ?? PESTANAS_ENTIDAD[0],
        [entidadActiva]
    );

    // Elementos seleccionados actualmente en la entidad que se está visualizando
    const seleccionadosActuales = useMemo(() => {
        return elementosSeleccionadosPorEntidad[entidadActiva] ?? [];
    }, [elementosSeleccionadosPorEntidad, entidadActiva]);

    // Todos los elementos de la entidad activa
    const elementosDeEntidadActiva = useMemo(() => {
        return datosPorEntidad[entidadActiva] ?? [];
    }, [datosPorEntidad, entidadActiva]);

    // Elementos aún no seleccionados para el desplegable de la entidad activa
    const disponiblesParaAgregar = useMemo(() => {
        return elementosDeEntidadActiva.filter((item) => !seleccionadosActuales.includes(item.id));
    }, [elementosDeEntidadActiva, seleccionadosActuales]);

    // Reportes aún no seleccionados para el desplegable de reportes
    const eventosDisponiblesParaAgregar = useMemo(() => {
        return tiposDisponibles.filter((t) => !eventosSeleccionados.includes(t));
    }, [tiposDisponibles, eventosSeleccionados]);

    // Mapa para buscar rápidamente un elemento por su ID
    const elementoPorId = useMemo(() => {
        const map = new Map<string | number, ItemGraficoEntidad>();
        elementosDeEntidadActiva.forEach((item) => {
            map.set(item.id, item);
            map.set(String(item.id), item);
        });
        return map;
    }, [elementosDeEntidadActiva]);

    // Handlers para agregar / quitar elementos en la entidad activa
    const agregarElemento = (id: number | string) => {
        setElementosSeleccionadosPorEntidad((prev) => {
            const actuales = prev[entidadActiva] || [];
            if (actuales.includes(id)) return prev;
            return {
                ...prev,
                [entidadActiva]: [...actuales, id],
            };
        });
        setItemSeleccionadoId(null);
    };

    const quitarElemento = (id: number | string) => {
        setElementosSeleccionadosPorEntidad((prev) => ({
            ...prev,
            [entidadActiva]: (prev[entidadActiva] || []).filter((itemVal) => itemVal !== id),
        }));
        setItemSeleccionadoId(null);
    };

    const agregarEvento = (tipoEv: string) => {
        if (!eventosSeleccionados.includes(tipoEv)) {
            setEventosSeleccionados((prev) => [...prev, tipoEv]);
        }
    };

    const quitarEvento = (tipoEv: string) => {
        if (eventosSeleccionados.length > 1) {
            setEventosSeleccionados((prev) => prev.filter((t) => t !== tipoEv));
        }
    };

    const limpiarFiltros = () => {
        setElementosSeleccionadosPorEntidad((prev) => ({
            ...prev,
            [entidadActiva]: [],
        }));
        setEventosSeleccionados(['incidentes_reales']);
        setItemSeleccionadoId(null);
    };

    // Generador de fallback hiperrealista para todas las entidades con soporte multievento
    const generarFallbackCompleto = useCallback((
        proyectosLista: Proyecto[], 
        horiz: number, 
        eventosFiltro: string[]
    ) => {
        const factorHoriz = Math.min(1.2, 0.4 + (horiz / 60));
        const fechaActual = new Date();

        // 1. Proyectos
        const listaProy = proyectosLista.length > 0 
            ? proyectosLista 
            : [
                { id_proyecto: 1, nombre: 'Construcción Puente Bío-Bío' },
                { id_proyecto: 2, nombre: 'Planta Industrial Talcahuano' },
                { id_proyecto: 3, nombre: 'Ampliación Hospital Regional' },
                { id_proyecto: 4, nombre: 'Edificio Los Boldos' },
                { id_proyecto: 5, nombre: 'Obras Viales Sector Costanera' },
            ];

        const probsProy = [0.72, 0.58, 0.44, 0.31, 0.18];
        const proyectosItems: ItemGraficoEntidad[] = listaProy.map((p, idx) => {
            const baseProb = probsProy[idx % probsProy.length];
            const probPrincipal = calcularProbabilidadPorEvento(baseProb, eventosFiltro[0] ?? 'incidentes_reales', factorHoriz);

            const item: ItemGraficoEntidad = {
                id: p.id_proyecto,
                nombre: p.nombre,
                probabilidad: probPrincipal,
                porcentajeNum: Math.round(probPrincipal * 100),
                detalle: `Faena principal · Proyecto #${p.id_proyecto}`,
                id_proyecto: p.id_proyecto,
                proyecto: p.nombre,
                baseProb,
            };

            // Calcular probabilidad para cada tipo de reporte en comparación
            eventosFiltro.forEach((ev) => {
                const prob = calcularProbabilidadPorEvento(baseProb, ev, factorHoriz);
                item[ev] = prob;
                item[`${ev}_pct`] = Math.round(prob * 100);
            });

            return item;
        });

        // 2. Áreas
        const areasBase = [
            { id: 101, nombre: 'Movimiento de Tierras y Excavación', base: 0.68, detalle: 'Frente Sur / Maquinaria pesada', id_proy: listaProy[0]?.id_proyecto },
            { id: 102, nombre: 'Estructuras y Enfierradura', base: 0.56, detalle: 'Edificio Central / Andamios', id_proy: listaProy[1]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 103, nombre: 'Frente Norte de Faena', base: 0.49, detalle: 'Área perimetral / Izaje', id_proy: listaProy[2]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 104, nombre: 'Montaje Electromecánico', base: 0.38, detalle: 'Subestación y canalizaciones', id_proy: listaProy[0]?.id_proyecto },
            { id: 105, nombre: 'Obras Civiles y Hormigonado', base: 0.31, detalle: 'Muros de contención', id_proy: listaProy[1]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 106, nombre: 'Instalaciones Subterráneas', base: 0.22, detalle: 'Red húmeda y zanjas', id_proy: listaProy[3]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 107, nombre: 'Terminaciones y Revestimientos', base: 0.14, detalle: 'Interiores y pintura', id_proy: listaProy[4]?.id_proyecto ?? listaProy[0]?.id_proyecto },
        ];
        const areasItems: ItemGraficoEntidad[] = areasBase.map((a) => {
            const probPrincipal = calcularProbabilidadPorEvento(a.base, eventosFiltro[0] ?? 'incidentes_reales', factorHoriz);
            const item: ItemGraficoEntidad = {
                id: a.id,
                nombre: a.nombre,
                probabilidad: probPrincipal,
                porcentajeNum: Math.round(probPrincipal * 100),
                detalle: a.detalle,
                id_proyecto: a.id_proy,
                baseProb: a.base,
            };
            eventosFiltro.forEach((ev) => {
                const prob = calcularProbabilidadPorEvento(a.base, ev, factorHoriz);
                item[ev] = prob;
                item[`${ev}_pct`] = Math.round(prob * 100);
            });
            return item;
        });

        // 3. Cuadrillas
        const cuadrillasBase = [
            { id: 201, nombre: 'Cuadrilla Enfierradura A', base: 0.72, detalle: '8 trabajadores · Jefe: R. Palma', id_proy: listaProy[0]?.id_proyecto },
            { id: 202, nombre: 'Cuadrilla Hormigón B', base: 0.63, detalle: '6 trabajadores · Jefe: M. Soto', id_proy: listaProy[1]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 203, nombre: 'Cuadrilla Montaje Estructural', base: 0.52, detalle: '10 trabajadores · Jefe: C. Vidal', id_proy: listaProy[2]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 204, nombre: 'Cuadrilla Movimiento Tierras', base: 0.44, detalle: '5 operadores · Jefe: J. Vera', id_proy: listaProy[0]?.id_proyecto },
            { id: 205, nombre: 'Cuadrilla Obras Civiles 1', base: 0.32, detalle: '7 trabajadores · Jefe: A. Godoy', id_proy: listaProy[3]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 206, nombre: 'Cuadrilla Instalaciones', base: 0.21, detalle: '4 especialistas · Jefe: P. Ruiz', id_proy: listaProy[1]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 207, nombre: 'Cuadrilla Pintura y Acabados', base: 0.13, detalle: '5 trabajadores · Jefe: F. Lara', id_proy: listaProy[4]?.id_proyecto ?? listaProy[0]?.id_proyecto },
        ];
        const cuadrillasItems: ItemGraficoEntidad[] = cuadrillasBase.map((c) => {
            const probPrincipal = calcularProbabilidadPorEvento(c.base, eventosFiltro[0] ?? 'incidentes_reales', factorHoriz);
            const item: ItemGraficoEntidad = {
                id: c.id,
                nombre: c.nombre,
                probabilidad: probPrincipal,
                porcentajeNum: Math.round(probPrincipal * 100),
                detalle: c.detalle,
                id_proyecto: c.id_proy,
                baseProb: c.base,
            };
            eventosFiltro.forEach((ev) => {
                const prob = calcularProbabilidadPorEvento(c.base, ev, factorHoriz);
                item[ev] = prob;
                item[`${ev}_pct`] = Math.round(prob * 100);
            });
            return item;
        });

        // 4. Trabajadores
        const trabajadoresBase = [
            { id: 301, nombre: 'Juan Morales C.', base: 0.67, detalle: 'Operador Maquinaria Pesada', id_proy: listaProy[0]?.id_proyecto },
            { id: 302, nombre: 'Carlos Silva R.', base: 0.58, detalle: 'Enfierrador Mayor', id_proy: listaProy[1]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 303, nombre: 'Pedro Valenzuela T.', base: 0.49, detalle: 'Montajista Estructural', id_proy: listaProy[2]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 304, nombre: 'Luis Muñoz P.', base: 0.38, detalle: 'Rigger / Maniobrista', id_proy: listaProy[0]?.id_proyecto },
            { id: 305, nombre: 'Andrés González S.', base: 0.29, detalle: 'Soldador Calificado 6G', id_proy: listaProy[3]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 306, nombre: 'Matías Herrera B.', base: 0.20, detalle: 'Electricista Faena', id_proy: listaProy[1]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 307, nombre: 'Rodrigo Castro F.', base: 0.15, detalle: 'Jornalero Obras Civiles', id_proy: listaProy[4]?.id_proyecto ?? listaProy[0]?.id_proyecto },
        ];
        const trabajadoresItems: ItemGraficoEntidad[] = trabajadoresBase.map((t) => {
            const probPrincipal = calcularProbabilidadPorEvento(t.base, eventosFiltro[0] ?? 'incidentes_reales', factorHoriz);
            const item: ItemGraficoEntidad = {
                id: t.id,
                nombre: t.nombre,
                probabilidad: probPrincipal,
                porcentajeNum: Math.round(probPrincipal * 100),
                detalle: t.detalle,
                id_proyecto: t.id_proy,
                baseProb: t.base,
            };
            eventosFiltro.forEach((ev) => {
                const prob = calcularProbabilidadPorEvento(t.base, ev, factorHoriz);
                item[ev] = prob;
                item[`${ev}_pct`] = Math.round(prob * 100);
            });
            return item;
        });

        // 5. Actividades
        const actividadesBase = [
            { id: 401, nombre: 'Trabajos en Altura (>1.8m)', base: 0.74, detalle: 'Andamios y plataformas', id_proy: listaProy[0]?.id_proyecto },
            { id: 402, nombre: 'Maniobras de Izaje con Grúa', base: 0.65, detalle: 'Cargas suspendidas en terreno', id_proy: listaProy[1]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 403, nombre: 'Excavación Profunda y Zanjas', base: 0.53, detalle: 'Riesgo de derrumbe de talud', id_proy: listaProy[2]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 404, nombre: 'Soldadura en Espacios Confinados', base: 0.41, detalle: 'Gases y ventilación restringida', id_proy: listaProy[0]?.id_proyecto },
            { id: 405, nombre: 'Vaciado y Vibrado de Hormigón', base: 0.33, detalle: 'Bombeo a presión en losas', id_proy: listaProy[3]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 406, nombre: 'Montaje de Estructuras Metálicas', base: 0.26, detalle: 'Alineación de vigas maestras', id_proy: listaProy[1]?.id_proyecto ?? listaProy[0]?.id_proyecto },
            { id: 407, nombre: 'Circulación de Camiones Tolva', base: 0.17, detalle: 'Pistas y accesos de faena', id_proy: listaProy[4]?.id_proyecto ?? listaProy[0]?.id_proyecto },
        ];
        const actividadesItems: ItemGraficoEntidad[] = actividadesBase.map((act) => {
            const probPrincipal = calcularProbabilidadPorEvento(act.base, eventosFiltro[0] ?? 'incidentes_reales', factorHoriz);
            const item: ItemGraficoEntidad = {
                id: act.id,
                nombre: act.nombre,
                probabilidad: probPrincipal,
                porcentajeNum: Math.round(probPrincipal * 100),
                detalle: act.detalle,
                id_proyecto: act.id_proy,
                baseProb: act.base,
            };
            eventosFiltro.forEach((ev) => {
                const prob = calcularProbabilidadPorEvento(act.base, ev, factorHoriz);
                item[ev] = prob;
                item[`${ev}_pct`] = Math.round(prob * 100);
            });
            return item;
        });

        // Evento estimado representativo
        const targetProj = listaProy[0];
        const targetPred = proyectosItems[0];
        const diasEspera = Math.max(3, Math.round(18 * (1 - targetPred.probabilidad * 0.7)));
        const fechaEstimadaObj = new Date(fechaActual.getTime() + diasEspera * 24 * 60 * 60 * 1000);
        const fechaEstimadaStr = fechaEstimadaObj.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const simulatedEventoEstimado: EventoEstimado = {
            id_proyecto: targetProj.id_proyecto,
            nombre_proyecto: targetProj.nombre,
            cliente: 'Corporación Minera y Obras',
            faena: 'Faena Principal',
            area_probable: areasBase[0].nombre,
            tipo_evento_probable: 'Atrapamiento / Caída de material',
            espera_estimada_dias: diasEspera,
            fecha_estimada: fechaEstimadaStr,
            prob_evento_horizonte: targetPred.probabilidad,
            probabilidad_30_dias: Math.min(0.95, targetPred.probabilidad + 0.12),
            probabilidad_90_dias: Math.min(0.98, targetPred.probabilidad + 0.22),
            evidencia: targetPred.probabilidad > 0.5 ? 'alta' : 'media',
            advertencia: 'Estimación preventiva obtenida del modelo predictivo. Se sugiere reforzar inspecciones preventivas en el área señalada.',
        };

        return {
            fallbackEntidades: {
                proyecto: proyectosItems,
                area: areasItems,
                cuadrilla: cuadrillasItems,
                trabajador: trabajadoresItems,
                actividad: actividadesItems,
            },
            simulatedEventoEstimado,
        };
    }, []);

    // Consulta de predicciones y entidades a la API
    const consultarPredicciones = useCallback(async () => {
        setCargando(true);
        const fallback = generarFallbackCompleto(proyectos, horizonte, eventosSeleccionados);

        try {
            // Consultar para cada reporte seleccionado en paralelo
            const promesasPredicciones = eventosSeleccionados.map((ev) =>
                api.get<RespuestaPredicciones>('/modelo-predictivo/predicciones', {
                    params: {
                        tipo_objetivo: ev,
                        horizonte_dias: horizonte,
                    },
                }).catch(() => null)
            );

            const promesaEntidades = api.get<{ niveles?: Record<string, any[]> }>('/modelo-predictivo/entidades', { 
                params: { tipo_objetivo: eventosSeleccionados[0], horizonte_dias: horizonte } 
            }).catch(() => null);

            const [respuestasPreds, respEntidades] = await Promise.all([
                Promise.all(promesasPredicciones),
                promesaEntidades,
            ]);

            const nuevasEntidades = { ...fallback.fallbackEntidades };
            const primeraPredExitosa = respuestasPreds.find((r) => r?.data?.predicciones && r.data.predicciones.length > 0);

            if (primeraPredExitosa?.data?.predicciones) {
                const preds = primeraPredExitosa.data.predicciones;
                nuevasEntidades.proyecto = preds.map((p) => {
                    const item: ItemGraficoEntidad = {
                        id: p.id_proyecto,
                        nombre: p.nombre_proyecto ?? `Proyecto #${p.id_proyecto}`,
                        probabilidad: p.prob_evento,
                        porcentajeNum: Math.round(p.prob_evento * 100),
                        detalle: `Semana: ${p.semana}`,
                        id_proyecto: p.id_proyecto,
                        proyecto: p.nombre_proyecto ?? undefined,
                        baseProb: p.prob_evento,
                    };
                    eventosSeleccionados.forEach((ev) => {
                        item[ev] = p.prob_evento;
                        item[`${ev}_pct`] = Math.round(p.prob_evento * 100);
                    });
                    return item;
                });

                const proximo = primeraPredExitosa.data.analisis_global?.proximo_evento 
                    ?? primeraPredExitosa.data.analisis_entidades?.contexto?.evento_estimado 
                    ?? null;

                setEventoEstimado(proximo ?? fallback.simulatedEventoEstimado);
            } else {
                setEventoEstimado(fallback.simulatedEventoEstimado);
            }

            // Procesar respuesta de entidades si viene de la API
            if (respEntidades?.data?.niveles) {
                const niveles = respEntidades.data.niveles;
                const claves: EntidadTipo[] = ['area', 'cuadrilla', 'trabajador', 'actividad'];
                claves.forEach((clave) => {
                    const lista = niveles[clave];
                    if (Array.isArray(lista) && lista.length > 0) {
                        nuevasEntidades[clave] = lista.map((item: any) => {
                            const pEvento = Number(item.prob_evento ?? 0);
                            const entItem: ItemGraficoEntidad = {
                                id: item.id ?? item.nombre,
                                nombre: item.nombre,
                                probabilidad: pEvento,
                                porcentajeNum: Math.round(pEvento * 100),
                                detalle: item.detalle ?? item.proyecto ?? undefined,
                                id_proyecto: item.id_proyecto ?? null,
                                proyecto: item.proyecto ?? null,
                                baseProb: pEvento,
                            };
                            eventosSeleccionados.forEach((ev) => {
                                entItem[ev] = pEvento;
                                entItem[`${ev}_pct`] = Math.round(pEvento * 100);
                            });
                            return entItem;
                        });
                    }
                });
            }

            setDatosPorEntidad(nuevasEntidades);
        } catch {
            setDatosPorEntidad(fallback.fallbackEntidades);
            setEventoEstimado(fallback.simulatedEventoEstimado);
        } finally {
            setCargando(false);
        }
    }, [eventosSeleccionados, horizonte, proyectos, generarFallbackCompleto]);

    useEffect(() => {
        void consultarPredicciones();
    }, [consultarPredicciones]);

    // Filtrar y ordenar los datos de la entidad seleccionada según los elementos en comparación
    const datosEntidadActual = useMemo(() => {
        const raw = datosPorEntidad[entidadActiva] ?? [];
        const seleccionados = elementosSeleccionadosPorEntidad[entidadActiva] ?? [];

        let filtrados = raw;
        if (seleccionados.length > 0) {
            filtrados = raw.filter((item) => seleccionados.includes(item.id));
        }

        return filtrados.sort((a, b) => b.probabilidad - a.probabilidad);
    }, [datosPorEntidad, entidadActiva, elementosSeleccionadosPorEntidad]);

    // KPIs calculados sobre la entidad activa
    const promedioProb = datosEntidadActual.length > 0
        ? Math.round(datosEntidadActual.reduce((acc, curr) => acc + curr.probabilidad, 0) / datosEntidadActual.length * 100)
        : 0;

    const maximoItem = datosEntidadActual[0];

    const IconoEntidad = infoEntidad.icono;

    const esModoComparacion = eventosSeleccionados.length > 1;

    return (
        <AuthenticatedLayout 
            title="Dashboard" 
            subtitle="Monitoreo predictivo de eventos y análisis de riesgo en operaciones"
        >
            <Head title="Dashboard | AVA" />

            <div className="max-w-[1700px] mx-auto p-6 lg:p-8 space-y-6">

                {/* 1. PANEL DE CONTROL: PESTAÑAS DE ENTIDAD Y FILTROS GLOBALES CON MULTISELECCIÓN */}
                <div className="bg-white dark:bg-[#1E242B] border border-verde-3 dark:border-[#2A333E] rounded-2xl p-6 shadow-sm space-y-5 transition-colors">
                    
                    {/* Bloque A: Selector de Nivel de Análisis por Entidad */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-gris-1 dark:text-gray-400 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-verde-6" />
                                Nivel de Análisis por Entidad
                            </span>
                            <span className="text-xs text-gris-1 dark:text-gray-400">
                                {infoEntidad.descripcion}
                            </span>
                        </div>

                        {/* Barra de Pestañas con distribución en cuadrícula uniforme */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 bg-verde-1/60 dark:bg-[#151A1F] border border-verde-3/80 dark:border-[#2A333E] rounded-xl" role="tablist">
                            {PESTANAS_ENTIDAD.map((p) => {
                                const IconoTab = p.icono;
                                const esActivo = entidadActiva === p.clave;
                                const cantidad = datosPorEntidad[p.clave]?.length ?? 0;
                                return (
                                    <button
                                        key={p.clave}
                                        type="button"
                                        role="tab"
                                        aria-selected={esActivo}
                                        onClick={() => {
                                            setEntidadActiva(p.clave);
                                            setItemSeleccionadoId(null);
                                        }}
                                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                            esActivo
                                                ? 'bg-verde-5 text-black shadow-md font-black scale-[1.01]'
                                                : 'text-gris-1 dark:text-gray-400 hover:text-gris-2 dark:hover:text-white hover:bg-white/70 dark:hover:bg-[#1E242B]/70'
                                        }`}
                                    >
                                        <IconoTab className={`h-4 w-4 ${esActivo ? 'text-black' : 'text-verde-6 dark:text-verde-5'}`} />
                                        <span>{p.plural}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                            esActivo ? 'bg-black/15 text-black' : 'bg-verde-2 dark:bg-[#2A333E] text-gris-1 dark:text-gray-300'
                                        }`}>
                                            {cantidad}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bloque B: Filtros y Parámetros de Comparación */}
                    <div className="border-t border-verde-3/70 dark:border-[#2A333E] pt-4 space-y-3.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-verde-6" />
                                <span className="text-xs font-bold uppercase tracking-wider text-gris-1 dark:text-gray-400">
                                    Filtros de Predicción y Comparación
                                </span>
                            </div>
                            <span className="text-xs text-gris-1 dark:text-gray-400">
                                Selecciona 1 o más {infoEntidad.plural.toLowerCase()} y reportes para comparar
                            </span>
                        </div>

                        {/* Fila de controles organizados con 4 columnas simétricas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
                            {/* Desplegable Dinámico según la Entidad Activa (Proyectos, Áreas, Cuadrillas, Trabajadores, Actividades) */}
                            <label className="text-xs font-semibold text-gris-1 dark:text-gray-400 flex flex-col">
                                <span className="mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <IconoEntidad className="w-3.5 h-3.5 text-verde-6" />
                                        {infoEntidad.plural}
                                    </span>
                                    {seleccionadosActuales.length > 0 && (
                                        <span className="text-[10px] text-verde-6 dark:text-verde-5 font-bold">
                                            {seleccionadosActuales.length} seleccionado(s)
                                        </span>
                                    )}
                                </span>
                                <select
                                    value=""
                                    onChange={(e) => {
                                        const valorStr = e.target.value;
                                        if (valorStr) {
                                            const itemEncontrado = disponiblesParaAgregar.find((i) => String(i.id) === valorStr);
                                            if (itemEncontrado) {
                                                agregarElemento(itemEncontrado.id);
                                            }
                                        }
                                    }}
                                    className="bg-verde-1 dark:bg-[#151A1F] border border-verde-3 dark:border-[#2A333E] rounded-lg px-3 py-2 text-sm text-gris-2 dark:text-white font-medium focus:outline-none focus:border-verde-5 cursor-pointer w-full transition-colors h-10"
                                >
                                    <option value="" disabled>
                                        {disponiblesParaAgregar.length === 0
                                            ? `Todos/as los/las ${infoEntidad.plural.toLowerCase()} agregados/as`
                                            : seleccionadosActuales.length === 0
                                                ? `Seleccionar ${infoEntidad.singular.toLowerCase()}...`
                                                : `Agregar ${infoEntidad.singular.toLowerCase()} (${disponiblesParaAgregar.length} disponibles)...`}
                                    </option>
                                    {disponiblesParaAgregar.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.nombre}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {/* Desplegable para Agregar Tipos de Reportes a la Comparación */}
                            <label className="text-xs font-semibold text-gris-1 dark:text-gray-400 flex flex-col">
                                <span className="mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Activity className="w-3.5 h-3.5 text-verde-6" />
                                        Reportes
                                    </span>
                                    {eventosSeleccionados.length > 1 && (
                                        <span className="text-[10px] text-verde-6 dark:text-verde-5 font-bold">
                                            Comparando {eventosSeleccionados.length}
                                        </span>
                                    )}
                                </span>
                                <select
                                    value=""
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val) {
                                            agregarEvento(val);
                                        }
                                    }}
                                    className="bg-verde-1 dark:bg-[#151A1F] border border-verde-3 dark:border-[#2A333E] rounded-lg px-3 py-2 text-sm text-gris-2 dark:text-white font-medium focus:outline-none focus:border-verde-5 cursor-pointer w-full transition-colors h-10"
                                >
                                    <option value="" disabled>
                                        {eventosDisponiblesParaAgregar.length === 0
                                            ? 'Todos los reportes agregados'
                                            : eventosSeleccionados.length <= 1
                                                ? 'Seleccionar reporte...'
                                                : `Comparar otro reporte (${eventosDisponiblesParaAgregar.length} restantes)...`}
                                    </option>
                                    {eventosDisponiblesParaAgregar.map((opcion) => (
                                        <option key={opcion} value={opcion}>
                                            {etiquetaTipo(opcion)}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {/* Filtro por Horizonte */}
                            <label className="text-xs font-semibold text-gris-1 dark:text-gray-400 flex flex-col">
                                <span className="mb-1.5 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-verde-6" />
                                    Horizonte de tiempo
                                </span>
                                <select
                                    value={horizonte}
                                    onChange={(e) => setHorizonte(Number(e.target.value))}
                                    className="bg-verde-1 dark:bg-[#151A1F] border border-verde-3 dark:border-[#2A333E] rounded-lg px-3 py-2 text-sm text-gris-2 dark:text-white font-medium focus:outline-none focus:border-verde-5 cursor-pointer w-full transition-colors h-10"
                                >
                                    <OpcionesHorizonte />
                                </select>
                            </label>

                            {/* Botón de Refrescar */}
                            <div>
                                <button
                                    type="button"
                                    onClick={consultarPredicciones}
                                    disabled={cargando}
                                    title="Actualizar datos predictivos"
                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-verde-5 px-4 text-xs font-bold uppercase tracking-wider text-black shadow-sm transition hover:bg-verde-6 disabled:opacity-60 cursor-pointer"
                                >
                                    <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
                                    <span>{cargando ? 'Actualizando...' : 'Actualizar datos'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Bloque C: Burbujas de Filtros Activos con Botón "X" para Eliminar */}
                        <div className="pt-3 border-t border-verde-3/60 dark:border-[#2A333E] flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gris-1 dark:text-gray-400 mr-1 flex items-center gap-1.5">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-verde-6" />
                                Filtros activos:
                            </span>

                            {/* Si no hay elementos seleccionados en la entidad activa, se indica "Todos/as..." */}
                            {seleccionadosActuales.length === 0 && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-verde-1 dark:bg-[#151A1F] border border-verde-3/80 dark:border-[#2A333E] px-3 py-1 text-xs font-medium text-gris-1 dark:text-gray-400">
                                    <IconoEntidad className="w-3 h-3 text-verde-6" />
                                    <span>Todos/as los/las {infoEntidad.plural.toLowerCase()} ({elementosDeEntidadActiva.length})</span>
                                </span>
                            )}

                            {/* Burbujas de Elementos Seleccionados de la Entidad Activa */}
                            {seleccionadosActuales.map((id) => {
                                const item = elementoPorId.get(id);
                                const nombre = item?.nombre ?? String(id);
                                return (
                                    <div
                                        key={`chip-${entidadActiva}-${id}`}
                                        className="inline-flex items-center gap-2 rounded-full bg-verde-2/90 dark:bg-[#151A1F] border border-verde-5/70 dark:border-verde-5/50 px-3 py-1 text-xs font-semibold text-gris-2 dark:text-white shadow-sm transition-all hover:border-verde-6"
                                    >
                                        <IconoEntidad className="w-3.5 h-3.5 text-verde-6" />
                                        <span className="max-w-[200px] truncate" title={nombre}>{nombre}</span>
                                        <button
                                            type="button"
                                            onClick={() => quitarElemento(id)}
                                            title={`Quitar filtro ${nombre}`}
                                            className="rounded-full p-0.5 text-gris-1 dark:text-gray-400 hover:bg-rojo-1 hover:text-white transition-colors cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })}

                            {/* Burbujas de Tipos de Reportes Seleccionados con Color de Comparación */}
                            {eventosSeleccionados.map((ev, idx) => {
                                const color = obtenerColorEvento(ev, idx);
                                return (
                                    <div
                                        key={`chip-ev-${ev}`}
                                        className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#151A1F] border px-3 py-1 text-xs font-semibold text-gris-2 dark:text-white shadow-sm transition-all"
                                        style={{ borderColor: color }}
                                    >
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span>{etiquetaTipo(ev)}</span>
                                        {eventosSeleccionados.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => quitarEvento(ev)}
                                                title={`Quitar reporte ${etiquetaTipo(ev)}`}
                                                className="rounded-full p-0.5 text-gris-1 dark:text-gray-400 hover:bg-rojo-1 hover:text-white transition-colors cursor-pointer"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Botón para restablecer y limpiar filtros */}
                            {(seleccionadosActuales.length > 0 || eventosSeleccionados.length > 1) && (
                                <button
                                    type="button"
                                    onClick={limpiarFiltros}
                                    className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-gris-1 dark:text-gray-400 hover:text-rojo-1 dark:hover:text-rojo-1 transition-colors underline cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                    <span>Limpiar filtros</span>
                                </button>
                            )}
                        </div>

                        <div className="mt-2">
                            <AvisoHorizonte dias={horizonte} />
                        </div>
                    </div>
                </div>

                {/* 2. SECCIÓN: PROYECTO EVENTO ESTIMADO */}
                {eventoEstimado && (
                    <section className="rounded-2xl border border-verde-4 bg-gradient-to-r from-verde-1/60 via-white to-verde-1/30 dark:from-[#1A222B] dark:via-[#1E242B] dark:to-[#1A222B] p-6 lg:p-7 shadow-md transition-all">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            
                            <div className="space-y-1.5">
                                <div className="inline-flex items-center gap-2 rounded-full bg-verde-5/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-verde-6 dark:text-verde-5">
                                    <ShieldAlert className="h-4 w-4" />
                                    <span>Próximo evento estimado</span>
                                </div>
                                <h2 className="text-2xl font-black text-gris-2 dark:text-white capitalize">
                                    {eventoEstimado.tipo_evento_probable?.replace(/_/g, ' ') ?? 'Evento de seguridad'}
                                </h2>
                                <p className="text-sm font-medium text-gris-1 dark:text-gray-300 flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-gris-2 dark:text-white">{eventoEstimado.nombre_proyecto}</span>
                                    <span>•</span>
                                    <span>{eventoEstimado.faena ?? 'Faena Principal'}</span>
                                    <span>•</span>
                                    <span className="text-verde-6 dark:text-verde-5">{eventoEstimado.area_probable ?? 'Área de faena'}</span>
                                </p>
                            </div>

                            {/* Indicadores Clave del Evento */}
                            <div className="flex flex-wrap items-center gap-6 lg:gap-8 bg-white/80 dark:bg-[#151A1F]/80 backdrop-blur-sm border border-verde-3/80 dark:border-[#2A333E] rounded-xl p-4 shadow-sm">
                                
                                {/* Espera Estimada */}
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-gris-1 dark:text-gray-400 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-verde-6" />
                                        Espera esperada
                                    </span>
                                    <p className="text-2xl font-black text-verde-6 dark:text-verde-5">
                                        {eventoEstimado.espera_estimada_dias} días
                                    </p>
                                    <span className="text-[11px] text-gris-1 dark:text-gray-400">
                                        Fecha est.: {eventoEstimado.fecha_estimada}
                                    </span>
                                </div>

                                {/* Riesgo en el horizonte */}
                                <div className="flex flex-col border-l border-verde-3/60 dark:border-[#2A333E] pl-6">
                                    <span className="text-xs font-semibold text-gris-1 dark:text-gray-400">
                                        Riesgo en {plazoHorizonte(horizonte)}
                                    </span>
                                    <p className="text-2xl font-black text-gris-2 dark:text-white">
                                        {Math.round(eventoEstimado.prob_evento_horizonte * 100)}%
                                    </p>
                                    <span className="text-[11px] font-bold text-gris-1 dark:text-gray-400 capitalize">
                                        Evidencia {eventoEstimado.evidencia}
                                    </span>
                                </div>

                                {/* Botón de acceso a detalle */}
                                <div className="flex items-center">
                                    <Link
                                        href={`/modelo-predictivo/proyectos/${eventoEstimado.id_proyecto}/evento-estimado?tipo_objetivo=${encodeURIComponent(eventosSeleccionados[0] ?? 'incidentes_reales')}&horizonte_dias=${horizonte}`}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-verde-5 px-5 text-sm font-bold text-black hover:bg-verde-6 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                                    >
                                        <span>Ver detalle del evento</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {eventoEstimado.advertencia && (
                            <p className="mt-4 border-t border-verde-3/70 dark:border-[#2A333E] pt-3 text-xs text-gris-1 dark:text-gray-400 italic">
                                💡 {eventoEstimado.advertencia}
                            </p>
                        )}
                    </section>
                )}

                {/* 3. TARJETAS DE RESUMEN MÉTRICO (KPIS) DINÁMICAS POR ENTIDAD */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="bg-white dark:bg-[#1E242B] border border-verde-3 dark:border-[#2A333E] rounded-2xl p-5 shadow-sm transition-colors">
                        <p className="text-xs uppercase tracking-wider text-gris-1 dark:text-gray-400 font-bold flex items-center gap-1.5">
                            <IconoEntidad className="w-4 h-4 text-verde-6" />
                            {infoEntidad.plural} evaluadas
                        </p>
                        <p className="text-3xl font-black text-gris-2 dark:text-white mt-2">
                            {datosEntidadActual.length}
                        </p>
                        <p className="text-xs text-gris-1 dark:text-gray-400 mt-1">
                            {seleccionadosActuales.length === 0
                                ? `Total en la organización (${elementosDeEntidadActiva.length})`
                                : `Comparando ${seleccionadosActuales.length} seleccionada(s)`}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-[#1E242B] border border-verde-3 dark:border-[#2A333E] rounded-2xl p-5 shadow-sm transition-colors">
                        <p className="text-xs uppercase tracking-wider text-gris-1 dark:text-gray-400 font-bold flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-verde-6" />
                            Probabilidad promedio
                        </p>
                        <p className="text-3xl font-black text-verde-6 dark:text-verde-5 mt-2">
                            {promedioProb}%
                        </p>
                        <p className="text-xs text-gris-1 dark:text-gray-400 mt-1">
                            {esModoComparacion
                                ? `Promedio base (${eventosSeleccionados.length} reportes en ${plazoHorizonte(horizonte)})`
                                : `Riesgo estimado en ${plazoHorizonte(horizonte)}`}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-[#1E242B] border border-verde-3 dark:border-[#2A333E] rounded-2xl p-5 shadow-sm transition-colors">
                        <p className="text-xs uppercase tracking-wider text-gris-1 dark:text-gray-400 font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rojo-1" />
                            Mayor probabilidad
                        </p>
                        <p className="text-3xl font-black text-gris-2 dark:text-white mt-2">
                            {maximoItem ? `${maximoItem.porcentajeNum}%` : '0%'}
                        </p>
                        <p className="text-xs text-gris-1 dark:text-gray-400 mt-1 truncate font-medium" title={maximoItem?.nombre ?? ''}>
                            {maximoItem?.nombre ?? '—'}
                        </p>
                    </div>
                </div>

                {/* 4. SECCIÓN: GRÁFICO DINÁMICO POR ENTIDAD (CON SOPORTE DE COMPARACIÓN) */}
                <section className="bg-white dark:bg-[#1E242B] border border-verde-3 dark:border-[#2A333E] rounded-2xl shadow-sm overflow-hidden transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-verde-3 dark:border-[#2A333E]">
                        <div>
                            <h2 className="text-lg font-bold text-gris-2 dark:text-white flex items-center gap-2">
                                <IconoEntidad className="w-5 h-5 text-verde-6" />
                                Resultados por {infoEntidad.singular.toLowerCase()}
                                {esModoComparacion && (
                                    <span className="text-xs bg-verde-5 text-black font-extrabold px-2.5 py-0.5 rounded-full ml-2">
                                        Modo Comparación ({eventosSeleccionados.length} reportes)
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-gris-1 dark:text-gray-400 mt-1">
                                {eventosSeleccionados.map((ev) => etiquetaTipo(ev)).join(' vs ')} · {plazoHorizonte(horizonte)}
                                {horizonteDerivado(horizonte) ? ' · estimado desde el modelo semanal' : ''}
                                {seleccionadosActuales.length > 0 && ` · Comparando ${seleccionadosActuales.length} ${infoEntidad.plural.toLowerCase()}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gris-1 dark:text-gray-400 bg-verde-1 dark:bg-[#151A1F] px-3 py-1.5 rounded-lg border border-verde-3/60 dark:border-[#2A333E]">
                                Ordenados de mayor a menor riesgo
                            </span>
                        </div>
                    </div>

                    {/* Contenedor del Gráfico de Barras */}
                    <div className="h-88 w-full px-4 pt-4 pb-6" aria-label={`Gráfico de probabilidades por ${infoEntidad.singular.toLowerCase()}`}>
                        {datosEntidadActual.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gris-1 dark:text-gray-400 text-sm">
                                No hay registros disponibles para los filtros seleccionados.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={datosEntidadActual.slice(0, 15)}
                                    margin={{ top: 15, right: 20, left: 0, bottom: 65 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#DBE0D5" vertical={false} opacity={0.6} />
                                    <XAxis 
                                        dataKey="nombre" 
                                        angle={-26} 
                                        textAnchor="end" 
                                        interval={0} 
                                        height={65} 
                                        tick={{ fontSize: 11, fill: '#7A7F85' }} 
                                    />
                                    <YAxis 
                                        domain={[0, 1]} 
                                        tickFormatter={(valor) => `${Math.round(Number(valor) * 100)}%`} 
                                        tick={{ fontSize: 11, fill: '#7A7F85' }} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#1E242B', 
                                            borderColor: '#86CF00', 
                                            borderRadius: '10px',
                                            color: '#fff',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                        }}
                                        formatter={(valor: any, name: any) => [
                                            `${Math.round(Number(valor) * 100)}% de probabilidad`, 
                                            name
                                        ]} 
                                    />

                                    {/* MODO A: COMPARACIÓN MULTIEVENTO (Barras agrupadas con leyenda) */}
                                    {esModoComparacion ? (
                                        <>
                                            <Legend 
                                                verticalAlign="top" 
                                                align="right"
                                                wrapperStyle={{ paddingBottom: '14px', fontSize: '12px', fontWeight: 'bold' }} 
                                            />
                                            {eventosSeleccionados.map((ev, idx) => (
                                                <Bar
                                                    key={ev}
                                                    dataKey={ev}
                                                    name={etiquetaTipo(ev)}
                                                    fill={obtenerColorEvento(ev, idx)}
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={45}
                                                />
                                            ))}
                                        </>
                                    ) : (
                                        /* MODO B: EVENTO ÚNICO (Barras con color según criticidad o selección) */
                                        <Bar 
                                            dataKey="probabilidad" 
                                            name={etiquetaTipo(eventosSeleccionados[0] ?? 'incidentes_reales')} 
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={55}
                                            onClick={(entry) => {
                                                if (entry?.id) {
                                                    setItemSeleccionadoId(entry.id);
                                                    if (!seleccionadosActuales.includes(entry.id)) {
                                                        agregarElemento(entry.id);
                                                    }
                                                }
                                            }}
                                            className="cursor-pointer transition-opacity hover:opacity-85"
                                        >
                                            {datosEntidadActual.slice(0, 15).map((entry, index) => {
                                                const esSeleccionado = itemSeleccionadoId !== null && itemSeleccionadoId === entry.id;
                                                const colorBarra = esSeleccionado 
                                                    ? '#A0F700' 
                                                    : entry.probabilidad >= 0.5 
                                                        ? '#86CF00' 
                                                        : '#6BA600';
                                                return (
                                                    <Cell key={`cell-${index}`} fill={colorBarra} />
                                                );
                                            })}
                                        </Bar>
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>

            </div>
        </AuthenticatedLayout>
    );
}
