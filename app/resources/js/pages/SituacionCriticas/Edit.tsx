import { Head, useForm } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import SituacionCriticaForm from './SituacionCriticaForm';

interface Trabajador {
    id_trabajador: number;
    nombre_1: string;
    apellido_1: string;
}

interface Supervisor {
    id_trabajador: number;
    trabajador?: Trabajador;
}

interface Evento {
    id_evento: number;
    descripcion: string;
}

interface SituacionCritica {
    id: number;
    id_trabajador: number;
    id_supervisor: number | null;
    id_evento: number;
    referencia: string;
    condicion: string;
}

interface EditProps {
    situacionCritica: SituacionCritica;
    trabajadores: Trabajador[];
    supervisores: Supervisor[];
    eventos: Evento[];
}

export default function Edit({ situacionCritica, trabajadores, supervisores, eventos }: EditProps) {
    const form = useForm({
        id_trabajador: String(situacionCritica.id_trabajador ?? ''),
        id_supervisor: situacionCritica.id_supervisor ? String(situacionCritica.id_supervisor) : '',
        id_evento: String(situacionCritica.id_evento ?? ''),
        referencia: situacionCritica.referencia ?? '',
        condicion: String(situacionCritica.condicion ?? '1'),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(`/situacion-criticas/${situacionCritica.id}`);
    };

    return (
        <MainLayout>
            <Head title="Editar situación crítica | AVA" />

            <div className="mx-auto max-w-2xl p-6 lg:p-8">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-white">Editar situación crítica</h1>
                    <p className="text-sm text-[#7a7f85]">Actualiza los datos del evento crítico.</p>
                </div>

                <div className="rounded-xl border border-white/5 bg-[#15181c] p-6">
                    <SituacionCriticaForm
                        trabajadores={trabajadores}
                        supervisores={supervisores}
                        eventos={eventos}
                        form={form}
                        onSubmit={submit}
                    />
                </div>
            </div>
        </MainLayout>
    );
}
