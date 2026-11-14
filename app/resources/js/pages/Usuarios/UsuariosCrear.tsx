import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import MainLayout from '../../layouts/MainLayout';
import UsuarioForm, { type RolDelUsuario, type UsuarioFormData } from './UsuarioForm';

/** RF-27: registrar Usuario. */
export default function UsuariosCrear() {
    const { roles } = usePage().props as unknown as { roles: RolDelUsuario[] };

    const form = useForm<UsuarioFormData>({
        rut: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post('/usuarios', { onError: () => form.reset('password', 'password_confirmation') });
    };

    return (
        <MainLayout>
            <Head title="Crear Usuario | AVA" />

            <div className="max-w-[800px] mx-auto p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/usuarios" className="text-gris-1 hover:text-gris-2 transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Crear Usuario</h1>
                    <p className="text-gris-1 text-sm">Registra la cuenta de acceso de un trabajador.</p>
                </div>

                <UsuarioForm
                    data={form.data}
                    setData={form.setData}
                    errors={form.errors}
                    processing={form.processing}
                    roles={roles ?? []}
                    textoBoton="Crear Usuario"
                    textoProcesando="Creando..."
                    onSubmit={submit}
                />
            </div>
        </MainLayout>
    );
}
