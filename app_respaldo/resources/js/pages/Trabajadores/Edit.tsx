import React, { FormEvent } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';

interface Trabajador {
    id_trabajador?: number;
    id?: number;
    nombre_1: string;
    nombre_2: string;
    apellido_1: string;
    apellido_2: string;
    cargo: string;
    id_tipo_trabajador: string;
    rut: string;
    email: string;
}

interface EditProps {
    trabajador: Trabajador;
}

const Edit: React.FC<EditProps> = ({ trabajador }) => {
    const idTrabajador = trabajador.id_trabajador ?? trabajador.id ?? 0;

    const { data, setData, put, processing, errors } = useForm({
        nombre_1: trabajador.nombre_1 ?? '',
        nombre_2: trabajador.nombre_2 ?? '',
        apellido_1: trabajador.apellido_1 ?? '',
        apellido_2: trabajador.apellido_2 ?? '',
        cargo: trabajador.cargo ?? '',
        id_tipo_trabajador: trabajador.id_tipo_trabajador ?? '',
        rut: trabajador.rut ?? '',
        email: trabajador.email ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('trabajadores.update', idTrabajador));
    };

    const inputClass =
        'w-full bg-verde-1 border border-verde-3 rounded-lg px-4 py-2.5 text-sm text-gris-2 focus:outline-none focus:border-verde-5 transition-colors';
    const labelClass = 'block text-xs uppercase tracking-wider text-gris-1 font-bold mb-2';
    const errorClass = 'text-xs text-rojo-1 mt-1 font-medium';

    return (
        <MainLayout>
            <Head title="Editar trabajador | AVA" />

            <div className="max-w-[1100px] mx-auto p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gris-2 mb-1">
                            Editar trabajador #{idTrabajador}
                        </h1>
                        <p className="text-gris-1 text-sm">
                            Actualiza la información personal, cargo o tipo del trabajador.
                        </p>
                    </div>
                    <Link
                        href={route('trabajadores.index')}
                        className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-bold bg-white text-verde-6 border border-verde-5 hover:bg-verde-5 hover:text-black transition-all shadow-sm"
                    >
                        ← Volver al listado
                    </Link>
                </div>

                {/* Formulario */}
                <form
                    onSubmit={submit}
                    className="bg-white border border-verde-3 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6"
                >
                    <div className="border-b border-verde-3 pb-3">
                        <h2 className="text-lg font-bold text-gris-2">Datos del trabajador</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Primer nombre *</label>
                            <input
                                className={inputClass}
                                value={data.nombre_1}
                                onChange={(e) => setData('nombre_1', e.target.value)}
                                required
                            />
                            {errors.nombre_1 && <p className={errorClass}>{errors.nombre_1}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Segundo nombre</label>
                            <input
                                className={inputClass}
                                value={data.nombre_2}
                                onChange={(e) => setData('nombre_2', e.target.value)}
                            />
                            {errors.nombre_2 && <p className={errorClass}>{errors.nombre_2}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Primer apellido *</label>
                            <input
                                className={inputClass}
                                value={data.apellido_1}
                                onChange={(e) => setData('apellido_1', e.target.value)}
                                required
                            />
                            {errors.apellido_1 && <p className={errorClass}>{errors.apellido_1}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Segundo apellido</label>
                            <input
                                className={inputClass}
                                value={data.apellido_2}
                                onChange={(e) => setData('apellido_2', e.target.value)}
                            />
                            {errors.apellido_2 && <p className={errorClass}>{errors.apellido_2}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>RUT *</label>
                            <input
                                className={inputClass}
                                value={data.rut}
                                onChange={(e) => setData('rut', e.target.value)}
                                required
                            />
                            {errors.rut && <p className={errorClass}>{errors.rut}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Correo electrónico *</label>
                            <input
                                className={inputClass}
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            {errors.email && <p className={errorClass}>{errors.email}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Cargo *</label>
                            <input
                                className={inputClass}
                                value={data.cargo}
                                onChange={(e) => setData('cargo', e.target.value)}
                                required
                            />
                            {errors.cargo && <p className={errorClass}>{errors.cargo}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Tipo de trabajador *</label>
                            <select
                                className={inputClass}
                                value={data.id_tipo_trabajador}
                                onChange={(e) => setData('id_tipo_trabajador', e.target.value)}
                                required
                            >
                                <option value="" disabled>
                                    Selecciona un tipo
                                </option>
                                <option value="obrero">Obrero</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="administrativo">Administrativo</option>
                            </select>
                            {errors.id_tipo_trabajador && (
                                <p className={errorClass}>{errors.id_tipo_trabajador}</p>
                            )}
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="pt-4 border-t border-verde-3 flex items-center justify-end gap-4">
                        <Link
                            href={route('trabajadores.index')}
                            className="px-5 py-3 rounded-lg text-sm font-bold text-gris-1 hover:text-gris-2 transition-colors"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-verde-5 hover:bg-verde-6 text-black rounded-lg font-bold px-6 py-3 text-sm transition-colors shadow-lg shadow-verde-5/20 disabled:opacity-50"
                        >
                            {processing ? 'Actualizando...' : 'Actualizar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
};

export default Edit;