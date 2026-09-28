import { Head, Link, useNavigate } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';

interface Faena {
    id_faena: number;
    nombre: string;
}

interface Cliente {
    id_cliente: number;
    nombre: string;
}

interface ProyectoForm {
    id_faena: string;
    id_cliente: string;
    nombre: string;
    descripcion: string;
    ubicacion: string;
    fecha_inicio: string;
    fecha_termino: string;
    estado: string;
}

export default function Create() {
    const navigate = useNavigate();

    const [faenas, setFaenas] = useState<Faena[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);

    const [form, setForm] = useState<ProyectoForm>({
        id_faena: '',
        id_cliente: '',
        nombre: '',
        descripcion: '',
        ubicacion: '',
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
            const [faenasResponse, clientesResponse] =
                await Promise.all([
                    fetch('/api/faenas', {
                        headers: {
                            Accept: 'application/json',
                        },
                    }),
                    fetch('/api/clientes', {
                        headers: {
                            Accept: 'application/json',
                        },
                    }),
                ]);

            if (!faenasResponse.ok || !clientesResponse.ok) {
                throw new Error();
            }

            const faenasData = await faenasResponse.json();
            const clientesData = await clientesResponse.json();

            setFaenas(faenasData);
            setClientes(clientesData);
        } catch {
            setError(
                'No fue posible cargar las faenas y clientes.'
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
            const response = await fetch('/api/proyectos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    id_faena: Number(form.id_faena),
                    id_cliente: Number(form.id_cliente),
                    nombre: form.nombre,
                    descripcion: form.descripcion || null,
                    ubicacion: form.ubicacion || null,
                    fecha_inicio: form.fecha_inicio || null,
                    fecha_termino: form.fecha_termino || null,
                    estado: form.estado,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    const mensajes = Object.values(data.errors)
                        .flat()
                        .join(' ');

                    throw new Error(mensajes);
                }

                throw new Error(
                    data.message ||
                        'No fue posible crear el proyecto.'
                );
            }

            navigate(
                `/proyectos/${data.data.id_proyecto}`
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Ocurrió un error.'
            );
        } finally {
            setGuardando(false);
        }
    };

    return (
        <MainLayout>
            <Head title="Nuevo proyecto | AVA" />

            <div className="max-w-[1200px] mx-auto p-6 lg:p-8 lg:mt-2">

                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/proyectos"
                        className="text-[#a0f700] text-xs font-bold uppercase hover:underline"
                    >
                        ← Volver a proyectos
                    </Link>

                    <h1 className="text-3xl font-bold text-white mt-4 mb-2">
                        Nuevo proyecto
                    </h1>

                    <p className="text-[#7a7f85] text-sm">
                        Registra un nuevo proyecto en el sistema.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="bg-[#141414] border border-[#2d3238] rounded-2xl shadow-2xl overflow-hidden">

                        {/* Datos generales */}
                        <div className="p-6 lg:p-8 border-b border-[#2d3238]">

                            <h2 className="text-white font-bold text-lg mb-6">
                                Datos del proyecto
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Nombre */}
                                <div className="md:col-span-2">
                                    <label className="block text-[#7a7f85] text-xs font-bold uppercase mb-2">
                                        Nombre del proyecto
                                    </label>

                                    <input
                                        type="text"
                                        name="nombre"
                                        value={form.nombre}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-[#101010] border border-[#2d3238] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#a0f700] transition-colors"
                                        placeholder="Nombre del proyecto"
                                    />
                                </div>

                                {/* Cliente */}
                                <div>
                                    <label className="block text-[#7a7f85] text-xs font-bold uppercase mb-2">
                                        Cliente
                                    </label>

                                    <select
                                        name="id_cliente"
                                        value={form.id_cliente}
                                        onChange={handleChange}
                                        required
                                        disabled={cargando}
                                        className="w-full bg-[#101010] border border-[#2d3238] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#a0f700] transition-colors"
                                    >
                                        <option value="">
                                            Seleccionar cliente
                                        </option>

                                        {clientes.map((cliente) => (
                                            <option
                                                key={cliente.id_cliente}
                                                value={cliente.id_cliente}
                                            >
                                                {cliente.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Faena */}
                                <div>
                                    <label className="block text-[#7a7f85] text-xs font-bold uppercase mb-2">
                                        Faena
                                    </label>

                                    <select
                                        name="id_faena"
                                        value={form.id_faena}
                                        onChange={handleChange}
                                        required
                                        disabled={cargando}
                                        className="w-full bg-[#101010] border border-[#2d3238] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#a0f700] transition-colors"
                                    >
                                        <option value="">
                                            Seleccionar faena
                                        </option>

                                        {faenas.map((faena) => (
                                            <option
                                                key={faena.id_faena}
                                                value={faena.id_faena}
                                            >
                                                {faena.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Ubicación */}
                                <div>
                                    <label className="block text-[#7a7f85] text-xs font-bold uppercase mb-2">
                                        Ubicación
                                    </label>

                                    <input
                                        type="text"
                                        name="ubicacion"
                                        value={form.ubicacion}
                                        onChange={handleChange}
                                        className="w-full bg-[#101010] border border-[#2d3238] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#a0f700] transition-colors"
                                        placeholder="Ubicación"
                                    />
                                </div>

                                {/* Estado */}
                                <div>
                                    <label className="block text-[#7a7f85] text-xs font-bold uppercase mb-2">
                                        Estado
                                    </label>

                                    <select
                                        name="estado"
                                        value={form.estado}
                                        onChange={handleChange}
                                        className="w-full bg-[#101010] border border-[#2d3238] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#a0f700] transition-colors"
                                    >
                                        <option value="activo">
                                            Activo
                                        </option>

                                        <option value="en_proceso">
                                            En proceso
                                        </option>

                                        <option value="pausado">
                                            Pausado
                                        </option>

                                        <option value="finalizado">
                                            Finalizado
                                        </option>

                                        <option value="cerrado">
                                            Cerrado
                                        </option>
                                    </select>
                                </div>

                                {/* Fecha inicio */}
                                <div>
                                    <label className="block text-[#7a7f85] text-xs font-bold uppercase mb-2">
                                        Fecha de inicio
                                    </label>

                                    <input
                                        type="date"
                                        name="fecha_inicio"
                                        value={form.fecha_inicio}
                                        onChange={handleChange}
                                        className="w-full bg-[#101010] border border-[#2d3238] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#a0f700] transition-colors"
                                    />
                                </div>

                                {/* Fecha término */}
                                <div>
                                    <label className="block text-[#7a7f85] text-xs font-bold uppercase mb-2">
                                        Fecha de término
                                    </label>

                                    <input
                                        type="date"
                                        name="fecha_termino"
                                        value={form.fecha_termino}
                                        onChange={handleChange}
                                        className="w-full bg-[#101010] border border-[#2d3238] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#a0f700] transition-colors"
                                    />
                                </div>

                                {/* Descripción */}
                                <div className="md:col-span-2">
                                    <label className="block text-[#7a7f85] text-xs font-bold uppercase mb-2">
                                        Descripción
                                    </label>

                                    <textarea
                                        name="descripcion"
                                        value={form.descripcion}
                                        onChange={handleChange}
                                        rows={5}
                                        className="w-full bg-[#101010] border border-[#2d3238] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#a0f700] transition-colors resize-none"
                                        placeholder="Descripción del proyecto..."
                                    />
                                </div>

                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 lg:p-8 flex justify-end gap-3">

                            <Link
                                href="/proyectos"
                                className="px-5 py-3 rounded-lg bg-[#101010] border border-[#2d3238] text-[#7a7f85] text-xs font-bold uppercase hover:border-[#7a7f85] transition-colors"
                            >
                                Cancelar
                            </Link>

                            <button
                                type="submit"
                                disabled={guardando}
                                className="px-5 py-3 rounded-lg bg-[#a0f700] text-black text-xs font-bold uppercase hover:bg-[#b4ff33] disabled:opacity-50 transition-colors"
                            >
                                {guardando
                                    ? 'Guardando...'
                                    : 'Crear proyecto'}
                            </button>

                        </div>

                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
