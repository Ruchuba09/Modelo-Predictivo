import { Head, usePage } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import DepartamentoForm, { DatosDepartamento } from './DepartamentoForm';

export default function Edit() {
    const { departamento } = usePage().props as unknown as { departamento: DatosDepartamento };

    return (
        <MainLayout title={`Editar ${departamento.nombre}`} subtitle="Estructura organizativa de la empresa">
            <Head title={`Editar ${departamento.nombre} | AVA`} />
            <div className="max-w-[800px] mx-auto p-6 lg:p-8">
                <DepartamentoForm departamento={departamento} />
            </div>
        </MainLayout>
    );
}
