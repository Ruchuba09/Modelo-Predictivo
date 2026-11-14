import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import MainLayout from '../../layouts/MainLayout';
import PermisoForm, { type Permiso, type PermisoFormData } from './PermisoForm';

/** RF-24: modificar Permiso. */
export default function PermisosEditar() {
    const { permiso } = usePage().props as unknown as { permiso: Permiso };
    const roles = permiso.roles_count ?? 0;

    const form = useForm<PermisoFormData>({
        nombre: permiso.nombre,
        descripcion: permiso.descripcion ?? '',
        nivel: permiso.nivel ? (String(permiso.nivel) as PermisoFormData['nivel']) : '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.put(`/permisos/${permiso.id_permiso}`);
    };

    return (
        <MainLayout>
            <Head title={`Editar Permiso ${permiso.nombre} | AVA`} />

            <div className="max-w-[640px] mx-auto p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/permisos" className="text-gris-1 hover:text-gris-2 transition-colors text-sm">← Volver</Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gris-2 mb-1">Editar Permiso</h1>
                    <p className="text-gris-1 text-sm">
                        Lo {roles === 1 ? 'tiene asignado 1 rol' : `tienen asignado ${roles} roles`}; los cambios se aplican de inmediato.
                    </p>
                </div>

                <PermisoForm
                    data={form.data}
                    setData={form.setData}
                    errors={form.errors}
                    processing={form.processing}
                    esSistema={permiso.es_sistema}
                    textoBoton="Guardar Cambios"
                    textoProcesando="Guardando..."
                    onSubmit={submit}
                />
            </div>
        </MainLayout>
    );
}
