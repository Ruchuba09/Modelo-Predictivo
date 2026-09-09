import React from "react";
import { Head, Link } from "@inertiajs/react";

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

interface ShowProps {
    trabajador: Trabajador;
}

const Show: React.FC<ShowProps> = ({ trabajador }) => {
    return (
        <>
            <Head title="Detalle trabajador" />

            <div>
                <h2>Detalle del trabajador</h2>

                <ul>
                    <li><strong>ID:</strong> {trabajador.id}</li>
                    <li><strong>Nombre:</strong> {trabajador.nombre_1} {trabajador.nombre_2}</li>
                    <li><strong>Apellido:</strong> {trabajador.apellido_1} {trabajador.apellido_2}</li>
                    <li><strong>Cargo:</strong> {trabajador.cargo}</li>
                    <li><strong>Tipo trabajador:</strong> {trabajador.id_tipo_trabajador}</li>
                    <li><strong>RUT:</strong> {trabajador.rut}</li>
                    <li><strong>Email:</strong> {trabajador.email}</li>
                </ul>

                <Link href={route("trabajadores.edit", trabajador.id)}>Editar</Link>{" | "}
                <Link href={route("trabajadores.index")}>Volver al listado</Link>
            </div>
        </>
    );
};

export default Show;