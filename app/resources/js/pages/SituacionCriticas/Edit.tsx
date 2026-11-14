import { Head, Link, useForm } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import SituacionCriticaForm from './SituacionCriticaForm';
import type { SituacionCritica, Supervisor, Trabajador } from './tipos';

interface EditProps {
    situacionCritica: SituacionCritica;
    trabajadores: Trabajador[];
    supervisores: Supervisor[];
}

/** RF-15.2: edición manual. Los cambios se aplican también a la Tarjeta PARE y quedan en el historial. */
export default function Edit({ situacionCritica, trabajadores, supervisores }: EditProps) {
    const form = useForm({
        id_trabajador: String(situacionCritica.id_trabajador ?? ''),
        id_supervisor: situacionCritica.id_supervisor ? String(situacionCritica.id_supervisor) : '',
        referencia: situacionCritica.referencia ?? '',
        condicion: String(situacionCritica.condicion ?? ''),
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
                    <h1 className="mb-1 text-2xl font-bold text-gris-2">Editar situación crítica</h1>
                    <p className="text-sm text-gris-1">
                        Los cambios se aplican también a la Tarjeta PARE{' '}
                        <Link href={`/eventos/${situacionCritica.id_evento}`} className="text-verde-6 hover:underline">
                            #{situacionCritica.id_evento}
                        </Link>{' '}
                        y quedan registrados en el historial.
                    </p>
                </div>

                <div className="rounded-xl border border-verde-3 bg-white p-6">
                    <SituacionCriticaForm
                        trabajadores={trabajadores}
                        supervisores={supervisores}
                        idEvento={situacionCritica.id_evento}
                        form={form}
                        onSubmit={submit}
                        cancelarHref="/situacion-criticas"
                    />
                </div>
            </div>
        </MainLayout>
    );
}
