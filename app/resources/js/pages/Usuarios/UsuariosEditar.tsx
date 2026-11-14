import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import MainLayout from '../../layouts/MainLayout';
import UsuarioForm, { type RolDelUsuario, type Usuario, type UsuarioFormData } from './UsuarioForm';

/** RF-28: modificar Usuario. */
export default function UsuariosEditar() {
    const { usuario, roles } = usePage().props as unknown as { usuario: Usuario; roles: RolDelUsuario[] };

    const form = useForm<UsuarioFormData>({
        rut: usuario.rut ?? '',
        email: usuario.email,
        password: '',
        password_confirmation: '',
        roles: usuario.roles.map((r) => r.id_rol),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.put(`/usuarios/${usuario.id_user}`, { onError: () => form.reset('password', 'password_confirmation') });
    };

    return (
        <MainLayout>
            <Head title={`Editar Usuario ${usuario.email} | AVA`} />

            <div className="max-w-[800px] mx-auto p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/usuarios" className="text-gris-1 hover:text-gris-2 transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Editar Usuario</h1>
                    <p className="text-gris-1 text-sm">{usuario.nombre ?? usuario.email}</p>
                </div>

                <UsuarioForm
                    data={form.data}
                    setData={form.setData}
                    errors={form.errors}
                    processing={form.processing}
                    roles={roles ?? []}
                    edicion
                    textoBoton="Guardar Cambios"
                    textoProcesando="Guardando..."
                    onSubmit={submit}
                />
            </div>
        </MainLayout>
    );
}
