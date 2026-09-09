import React from "react";
import { Head, Link, router } from "@inertiajs/react";

interface Trabajador {
    id: number;
    nombre_1: string;
    nombre_2: string;
    apellido_1: string;
    apellido_2: string;
    cargo: string;
    id_tipo_trabajador: string;
    rut: string;
}

interface TrabajadoresProps {
    trabajadores: Trabajador[];
}

const Trabajadores: React.FC<TrabajadoresProps> = ({ trabajadores }) => {
    const eliminar = (id: number) => {
        if (confirm("¿Seguro que deseas eliminar este trabajador?")) {
            router.delete(route("trabajadores.destroy", id));
        }
    };

    return (
        <>
            <Head title="Trabajadores" />

            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2>Trabajadores</h2>
                    <Link href={route("trabajadores.create")}>+ Nuevo trabajador</Link>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Cargo</th>
                            <th>Tipo Trabajador</th>
                            <th>RUT</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {trabajadores.map((trabajador) => (
                            <tr key={trabajador.id}>
                                <td>{trabajador.id}</td>
                                <td>{trabajador.nombre_1} {trabajador.nombre_2}</td>
                                <td>{trabajador.apellido_1} {trabajador.apellido_2}</td>
                                <td>{trabajador.cargo}</td>
                                <td>{trabajador.id_tipo_trabajador}</td>
                                <td>{trabajador.rut}</td>
                                <td>
                                    <Link href={route("trabajadores.show", trabajador.id)}>Ver</Link>{" | "}
                                    <Link href={route("trabajadores.edit", trabajador.id)}>Editar</Link>{" | "}
                                    <button onClick={() => eliminar(trabajador.id)}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default Trabajadores;