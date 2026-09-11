import React, { FormEvent } from "react";
import { Head, useForm, Link } from "@inertiajs/react";
import "../../../css/Create.css";

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

            <div className="create-page">
                <h2>Nuevo trabajador</h2>

                <form className="create-form" onSubmit={submit}>
                    <div className="create-form-group">
                        <label>Nombre 1</label>
                        <input
                            className="create-input"
                            value={data.nombre_1}
                            onChange={(e) => setData("nombre_1", e.target.value)}
                        />
                        {errors.nombre_1 && <div className="create-error">{errors.nombre_1}</div>}
                    </div>

                    <div className="create-form-group">
                        <label>Nombre 2</label>
                        <input
                            className="create-input"
                            value={data.nombre_2}
                            onChange={(e) => setData("nombre_2", e.target.value)}
                        />
                    </div>

                    <div className="create-form-group">
                        <label>Apellido 1</label>
                        <input
                            className="create-input"
                            value={data.apellido_1}
                            onChange={(e) => setData("apellido_1", e.target.value)}
                        />
                        {errors.apellido_1 && <div className="create-error">{errors.apellido_1}</div>}
                    </div>

                    <div className="create-form-group">
                        <label>Apellido 2</label>
                        <input
                            className="create-input"
                            value={data.apellido_2}
                            onChange={(e) => setData("apellido_2", e.target.value)}
                        />
                    </div>

                    <div className="create-form-group">
                        <label>Cargo</label>
                        <input
                            className="create-input"
                            value={data.cargo}
                            onChange={(e) => setData("cargo", e.target.value)}
                        />
                        {errors.cargo && <div className="create-error">{errors.cargo}</div>}
                    </div>

                    <div className="create-form-group">
                        <label>Tipo trabajador</label>
                        <input
                            className="create-input"
                            value={data.id_tipo_trabajador}
                            onChange={(e) => setData("id_tipo_trabajador", e.target.value)}
                        />
                    </div>

                    <div className="create-form-group">
                        <label>RUT</label>
                        <input
                            className="create-input"
                            value={data.rut}
                            onChange={(e) => setData("rut", e.target.value)}
                        />
                        {errors.rut && <div className="create-error">{errors.rut}</div>}
                    </div>

                    <div className="create-form-group">
                        <label>Email</label>
                        <input
                            className="create-input"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                        />
                        {errors.email && <div className="create-error">{errors.email}</div>}
                    </div>

                    <div className="create-acciones">
                        <button className="create-btn-guardar" type="submit" disabled={processing}>
                            Guardar
                        </button>
                        <Link className="create-link-cancelar" href={route("trabajadores.index")}>Cancelar</Link>
                    </div>
                </form>
            </div>
        </>
    );
};

export default Create;