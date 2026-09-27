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

interface CreateProps {
    trabajadores: Trabajador[];
    supervisores: Supervisor[];
    eventos: Evento[];
}

export default function Create({ trabajadores, supervisores, eventos }: CreateProps) {
    const form = useForm({
        id_trabajador: '',
        id_supervisor: '',
        id_evento: '',
        referencia: '',
        condicion: '1',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/situacion-criticas');
    };

    return (
        <MainLayout>
            <Head title="Nueva situación crítica | AVA" />

            <div className="mx-auto max-w-2xl p-6 lg:p-8">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-white">Nueva situación crítica</h1>
                    <p className="text-sm text-[#7a7f85]">Registra un nuevo evento crítico.</p>
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
