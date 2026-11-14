import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import MainLayout from '../../layouts/MainLayout';
import RolForm, { type Permiso, type Rol, type RolFormData } from './RolForm';

/** RF-20: modificar Rol. */
export default function RolesEditar() {
    const { rol, permisos } = usePage().props as unknown as { rol: Rol; permisos: Permiso[] };

    const form = useForm<RolFormData>({
        nombre: rol.nombre,
        descripcion: rol.descripcion ?? '',
        estado: rol.estado ?? 'activo',
        permisos: (rol.permisos ?? []).map((p) => p.id_permiso),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.put(`/roles/${rol.id_rol}`);
    };

    return (
        <MainLayout>
            <Head title={`Editar Rol ${rol.nombre} | AVA`} />

            <div className="max-w-[800px] mx-auto p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/roles" className="text-gris-1 hover:text-gris-2 transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Editar Rol</h1>
                    <p className="text-gris-1 text-sm">
                        Los cambios se aplican de inmediato a {rol.usuarios_count ?? 0}{' '}
                        {rol.usuarios_count === 1 ? 'usuario' : 'usuarios'} con este rol.
                    </p>
                </div>

                <RolForm
                    data={form.data}
                    setData={form.setData}
                    errors={form.errors}
                    processing={form.processing}
                    permisos={permisos ?? []}
                    esSistema={rol.es_sistema}
                    todosLosPermisos={rol.todos_los_permisos}
                    textoBoton="Guardar Cambios"
                    textoProcesando="Guardando..."
                    onSubmit={submit}
                />
            </div>
        </MainLayout>
    );
}
