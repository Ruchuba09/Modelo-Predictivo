import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import MainLayout from '../../layouts/MainLayout';
import { api } from '../../lib/api';
import type { Cliente, Faena } from '../../api/proyectosApi';

interface ProyectoForm {
    id_faena: string;
    id_cliente: string;
    nombre: string;
    descripcion: string;
    ubicacion: string;
    id_proyecto_intrava: string;
    centro_costo: string;
    alias: string;
    num_contrato: string;
    fecha_inicio: string;
    fecha_termino: string;
    estado: string;
}

export default function Create() {
    const [faenas, setFaenas] = useState<Faena[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);

    const [form, setForm] = useState<ProyectoForm>({
        id_faena: '',
        id_cliente: '',
        nombre: '',
        descripcion: '',
        ubicacion: '',
        id_proyecto_intrava: '',
        centro_costo: '',
        alias: '',
        num_contrato: '',
        fecha_inicio: '',
        fecha_termino: '',
        estado: 'activo',
    });

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [faenasResponse, clientesResponse] = await Promise.all([
                api.get<{ data: Faena[] } | Faena[]>('/faenas', { params: { todos: 1 } }),
                api.get<{ data: Cliente[] } | Cliente[]>('/clientes', { params: { todos: 1 } }),
            ]);

            setFaenas(Array.isArray(faenasResponse.data) ? faenasResponse.data : faenasResponse.data.data);
            setClientes(Array.isArray(clientesResponse.data) ? clientesResponse.data : clientesResponse.data.data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'No fue posible cargar las faenas y clientes.'
            );
        } finally {
            setCargando(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;

        setForm((actual) => ({
            ...actual,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setGuardando(true);
        setError('');

        try {
            const response = await api.post<{ data: { id_proyecto: number } }>('/proyectos', {
                id_faena: Number(form.id_faena),
                id_cliente: Number(form.id_cliente),
                nombre: form.nombre,
                descripcion: form.descripcion || null,
                ubicacion: form.ubicacion || null,
                id_proyecto_intrava: form.id_proyecto_intrava ? Number(form.id_proyecto_intrava) : null,
                centro_costo: form.centro_costo || null,
                alias: form.alias || null,
                num_contrato: form.num_contrato || null,
                fecha_inicio: form.fecha_inicio || null,
                fecha_termino: form.fecha_termino || null,
                estado: form.estado,
            });
            router.visit(`/proyectos/${response.data.data.id_proyecto}`);
        } catch (err) {
            const errorResponse = axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(err)
                ? err.response?.data
                : undefined;
            const validationMessage = errorResponse?.errors
                ? Object.values(errorResponse.errors).flat().join(' ')
                : undefined;
            setError(validationMessage ?? errorResponse?.message ?? (err instanceof Error ? err.message : 'Ocurrió un error.'));
        } finally {
            setGuardando(false);
        }
    };

    const inputClass =
        'w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 text-sm text-gris-2 focus:outline-none focus:border-verde-5 transition-colors';
    const labelClass = 'block text-xs uppercase tracking-wider text-gris-1 font-bold mb-2';

    return (
        <MainLayout>
            <Head title="Nuevo proyecto | AVA" />

            <div className="max-w-[1100px] mx-auto p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gris-2 mb-1">Nuevo proyecto</h1>
                        <p className="text-gris-1 text-sm">Registra un nuevo proyecto en el sistema.</p>
                    </div>
                    <Link
                        href="/proyectos"
                        className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-bold bg-white text-verde-6 border border-verde-5 hover:bg-verde-5 hover:text-black transition-all shadow-sm"
                    >
                        ← Volver al listado
                    </Link>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 px-4 py-3 rounded-lg border border-rojo-1/40 bg-rojo-1/10 text-rojo-1 text-sm font-bold">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="bg-white border border-verde-3 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6"
                >
                    <div className="border-b border-verde-3 pb-3">
                        <h2 className="text-lg font-bold text-gris-2">Datos del proyecto</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nombre */}
                        <div className="md:col-span-2">
                            <label className={labelClass}>Nombre del proyecto *</label>
                            <input
                                type="text"
                                name="nombre"
                                value={form.nombre}
                                onChange={handleChange}
                                required
                                className={inputClass}
                                placeholder="Nombre del proyecto"
                            />
                        </div>

                        {/* Cliente */}
                        <div>
                            <label className={labelClass}>Cliente *</label>
                            <select
                                name="id_cliente"
                                value={form.id_cliente}
                                onChange={handleChange}
                                required
                                disabled={cargando}
                                className={inputClass}
                            >
                                <option value="">Seleccionar cliente</option>
                                {clientes.map((cliente) => (
                                    <option key={cliente.id_cliente} value={cliente.id_cliente}>
                                        {cliente.razon_social || cliente.nombre || cliente.rut || `Cliente #${cliente.id_cliente}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Faena */}
                        <div>
                            <label className={labelClass}>Faena *</label>
                            <select
                                name="id_faena"
                                value={form.id_faena}
                                onChange={handleChange}
                                required
                                disabled={cargando}
                                className={inputClass}
                            >
                                <option value="">Seleccionar faena</option>
                                {faenas.map((faena) => (
                                    <option key={faena.id_faena} value={faena.id_faena}>
                                        {faena.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Ubicación */}
                        <div>
                            <label className={labelClass}>Ubicación</label>
                            <input
                                type="text"
                                name="ubicacion"
                                value={form.ubicacion}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Ej: Sector Norte, Planta 2..."
                            />
                        </div>

                        <div>
                            <label className={labelClass}>ID de proyecto INTRAVA</label>
                            <input
                                type="number"
                                min="1"
                                name="id_proyecto_intrava"
                                value={form.id_proyecto_intrava}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Centro de costo</label>
                            <input name="centro_costo" value={form.centro_costo} onChange={handleChange} className={inputClass} maxLength={50} />
                        </div>

                        <div>
                            <label className={labelClass}>Alias INTRAVA</label>
                            <input name="alias" value={form.alias} onChange={handleChange} className={inputClass} maxLength={255} />
                        </div>

                        <div>
                            <label className={labelClass}>Número de contrato</label>
                            <input name="num_contrato" value={form.num_contrato} onChange={handleChange} className={inputClass} maxLength={100} />
                        </div>

                        {/* Estado */}
                        <div>
                            <label className={labelClass}>Estado</label>
                            <select
                                name="estado"
                                value={form.estado}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="activo">Activo</option>
                                <option value="en_proceso">En proceso</option>
                                <option value="pausado">Pausado</option>
                                <option value="finalizado">Finalizado</option>
                                <option value="cerrado">Cerrado</option>
                            </select>
                        </div>

                        {/* Fecha inicio */}
                        <div>
                            <label className={labelClass}>Fecha de inicio</label>
                            <input
                                type="date"
                                name="fecha_inicio"
                                value={form.fecha_inicio}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        {/* Fecha término */}
                        <div>
                            <label className={labelClass}>Fecha de término</label>
                            <input
                                type="date"
                                name="fecha_termino"
                                value={form.fecha_termino}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        {/* Descripción */}
                        <div className="md:col-span-2">
                            <label className={labelClass}>Descripción</label>
                            <textarea
                                name="descripcion"
                                value={form.descripcion}
                                onChange={handleChange}
                                rows={4}
                                className={inputClass}
                                placeholder="Descripción general y alcance del proyecto..."
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-verde-3 flex items-center justify-end gap-4">
                        <Link
                            href="/proyectos"
                            className="px-5 py-3 rounded-lg text-sm font-bold text-gris-1 hover:text-gris-2 transition-colors"
                        >
                            Cancelar
                        </Link>

                        <button
                            type="submit"
                            disabled={guardando}
                            className="bg-verde-5 hover:bg-verde-6 text-black rounded-lg font-bold px-6 py-3 text-sm transition-colors shadow-lg shadow-verde-5/20 disabled:opacity-50"
                        >
                            {guardando ? 'Guardando...' : 'Crear proyecto'}
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
