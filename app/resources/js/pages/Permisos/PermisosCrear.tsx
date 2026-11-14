import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import MainLayout from '../../layouts/MainLayout';
import PermisoForm, { type PermisoFormData } from './PermisoForm';

/** RF-23: registrar Permiso. */
export default function PermisosCrear() {
    const form = useForm<PermisoFormData>({ nombre: '', descripcion: '', nivel: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post('/permisos');
    };

    return (
        <MainLayout>
            <Head title="Crear Permiso | AVA" />

            <div className="max-w-[640px] mx-auto p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/permisos" className="text-gris-1 hover:text-gris-2 transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Crear Permiso</h1>
                    <p className="text-gris-1 text-sm">Después podrá asignarlo a los roles que correspondan.</p>
                </div>

                <PermisoForm
                    data={form.data}
                    setData={form.setData}
                    errors={form.errors}
                    processing={form.processing}
                    textoBoton="Crear Permiso"
                    textoProcesando="Creando..."
                    onSubmit={submit}
                />
            </div>
        </MainLayout>
    );
}
