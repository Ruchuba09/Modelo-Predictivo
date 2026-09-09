import React, { FormEvent } from "react";
import { Head, useForm, Link } from "@inertiajs/react";

const Create: React.FC = () => {
    const { data, setData, post, processing, errors } = useForm({
        nombre_1: "",
        nombre_2: "",
        apellido_1: "",
        apellido_2: "",
        cargo: "",
        id_tipo_trabajador: "",
        rut: "",
        email: "",
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route("trabajadores.store"));
    };

    return (
        <>
            <Head title="Nuevo trabajador" />

            <div>
                <h2>Nuevo trabajador</h2>

                <form onSubmit={submit}>
                    <div>
                        <label>Nombre 1</label>
                        <input
                            value={data.nombre_1}
                            onChange={(e) => setData("nombre_1", e.target.value)}
                        />
                        {errors.nombre_1 && <div>{errors.nombre_1}</div>}
                    </div>

                    <div>
                        <label>Nombre 2</label>
                        <input
                            value={data.nombre_2}
                            onChange={(e) => setData("nombre_2", e.target.value)}
                        />
                    </div>

                    <div>
                        <label>Apellido 1</label>
                        <input
                            value={data.apellido_1}
                            onChange={(e) => setData("apellido_1", e.target.value)}
                        />
                        {errors.apellido_1 && <div>{errors.apellido_1}</div>}
                    </div>

                    <div>
                        <label>Apellido 2</label>
                        <input
                            value={data.apellido_2}
                            onChange={(e) => setData("apellido_2", e.target.value)}
                        />
                    </div>

                    <div>
                        <label>Cargo</label>
                        <input
                            value={data.cargo}
                            onChange={(e) => setData("cargo", e.target.value)}
                        />
                        {errors.cargo && <div>{errors.cargo}</div>}
                    </div>

                    <div>
                        <label>Tipo trabajador</label>
                        <input
                            value={data.id_tipo_trabajador}
                            onChange={(e) => setData("id_tipo_trabajador", e.target.value)}
                        />
                    </div>

                    <div>
                        <label>RUT</label>
                        <input
                            value={data.rut}
                            onChange={(e) => setData("rut", e.target.value)}
                        />
                        {errors.rut && <div>{errors.rut}</div>}
                    </div>

                    <div>
                        <label>Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                        />
                        {errors.email && <div>{errors.email}</div>}
                    </div>

                    <button type="submit" disabled={processing}>
                        Guardar
                    </button>
                    <Link href={route("trabajadores.index")}>Cancelar</Link>
                </form>
            </div>
        </>
    );
};

export default Create;