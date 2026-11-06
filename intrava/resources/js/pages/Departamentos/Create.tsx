import { Head } from '@inertiajs/react';
import MainLayout from '../../layouts/MainLayout';
import DepartamentoForm from './DepartamentoForm';

export default function Create() {
    return (
        <MainLayout title="Nuevo departamento" subtitle="Estructura organizativa de la empresa">
            <Head title="Nuevo departamento | AVA" />
            <div className="max-w-[800px] mx-auto p-6 lg:p-8">
                <DepartamentoForm />
            </div>
        </MainLayout>
    );
}
