import React, { FormEvent } from "react";
import { Head, useForm, Link } from "@inertiajs/react";
import "../../../css/Edit.css";

interface Trabajador {
    id: number;
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
    const { data, setData, put, processing, errors } = useForm({
        nombre_1: trabajador.nombre_1 ?? "",
        nombre_2: trabajador.nombre_2 ?? "",
        apellido_1: trabajador.apellido_1 ?? "",
        apellido_2: trabajador.apellido_2 ?? "",
        cargo: trabajador.cargo ?? "",
        id_tipo_trabajador: trabajador.id_tipo_trabajador ?? "",
        rut: trabajador.rut ?? "",
        email: trabajador.email ?? "",
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route("trabajadores.update", trabajador.id));
    };

    return (
        <>
            <Head title="Editar trabajador" />

            <div className="edit-page">
                <h2>Editar trabajador</h2>

                <form className="edit-form" onSubmit={submit}>
                    <div className="edit-form-group">
                        <label>Nombre 1</label>
                        <input
                            className="edit-input"
                            value={data.nombre_1}
                            onChange={(e) => setData("nombre_1", e.target.value)}
                        />
                        {errors.nombre_1 && <div className="edit-error">{errors.nombre_1}</div>}
                    </div>

                    <div className="edit-form-group">
                        <label>Nombre 2</label>
                        <input
                            className="edit-input"
                            value={data.nombre_2}
                            onChange={(e) => setData("nombre_2", e.target.value)}
                        />
                    </div>

                    <div className="edit-form-group">
                        <label>Apellido 1</label>
                        <input
                            className="edit-input"
                            value={data.apellido_1}
                            onChange={(e) => setData("apellido_1", e.target.value)}
                        />
                        {errors.apellido_1 && <div className="edit-error">{errors.apellido_1}</div>}
                    </div>

                    <div className="edit-form-group">
                        <label>Apellido 2</label>
                        <input
                            className="edit-input"
                            value={data.apellido_2}
                            onChange={(e) => setData("apellido_2", e.target.value)}
                        />
                    </div>

                    <div className="edit-form-group">
                        <label>Cargo</label>
                        <input
                            className="edit-input"
                            value={data.cargo}
                            onChange={(e) => setData("cargo", e.target.value)}
                        />
                        {errors.cargo && <div className="edit-error">{errors.cargo}</div>}
                    </div>

                    <div className="edit-form-group">
                        <label>Tipo trabajador</label>
                        <input
                            className="edit-input"
                            value={data.id_tipo_trabajador}
                            onChange={(e) => setData("id_tipo_trabajador", e.target.value)}
                        />
                    </div>

                    <div className="edit-form-group">
                        <label>RUT</label>
                        <input
                            className="edit-input"
                            value={data.rut}
                            onChange={(e) => setData("rut", e.target.value)}
                        />
                        {errors.rut && <div className="edit-error">{errors.rut}</div>}
                    </div>

                    <div className="edit-form-group">
                        <label>Email</label>
                        <input
                            className="edit-input"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                        />
                        {errors.email && <div className="edit-error">{errors.email}</div>}
                    </div>

                    <div className="edit-acciones">
                        <button className="edit-btn-actualizar" type="submit" disabled={processing}>
                            Actualizar
                        </button>
                        <Link className="edit-link-cancelar" href={route("trabajadores.index")}>Cancelar</Link>
                    </div>
                </form>
            </div>
        </>
    );
};

export default Edit;