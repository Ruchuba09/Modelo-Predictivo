import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import MainLayout from '../../layouts/MainLayout';
import RolForm, { type Permiso, type RolFormData } from './RolForm';

/** RF-19: registrar Rol. */
export default function RolesCrear() {
    const { permisos } = usePage().props as unknown as { permisos: Permiso[] };

    const form = useForm<RolFormData>({
        nombre: '',
        descripcion: '',
        estado: 'activo',
        permisos: [],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post('/roles');
    };

    return (
        <MainLayout>
            <Head title="Crear Rol | AVA" />

            <div className="max-w-[800px] mx-auto p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/roles" className="text-gris-1 hover:text-gris-2 transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Crear Rol</h1>
                    <p className="text-gris-1 text-sm">Define un nuevo rol y los permisos que otorga.</p>
                </div>

                <RolForm
                    data={form.data}
                    setData={form.setData}
                    errors={form.errors}
                    processing={form.processing}
                    permisos={permisos ?? []}
                    textoBoton="Crear Rol"
                    textoProcesando="Creando..."
                    onSubmit={submit}
                />
            </div>
        </MainLayout>
    );
}
