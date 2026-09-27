import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SituacionCriticaForm from './SituacionCriticaForm';

export default function Create({ trabajadores, supervisores, eventos }) {
    const form = useForm({
        id_trabajador: '',
        id_supervisor: '',
        id_evento: '',
        referencia: '',
        condicion: '1',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('situacion-criticas.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Nueva situación crítica
                </h2>
            }
        >
            <Head title="Nueva situación crítica" />

            <div className="py-8">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="rounded-lg bg-white p-6 shadow">
                        <SituacionCriticaForm
                            trabajadores={trabajadores}
                            supervisores={supervisores}
                            eventos={eventos}
                            form={form}
                            onSubmit={submit}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
