import { Head } from '@inertiajs/react';
import MainLayout from '../layouts/MainLayout';

export default function Usuarios() {
    return (
        <MainLayout>
            <Head title="Usuarios | AVA" />
            
            <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Gestión de Personal Autorizado</h1>
                        <p className="text-[#7a7f85] text-sm">Listado oficial de cuentas y accesos asignados.</p>
                    </div>
                    <button className="bg-[#a0f700] hover:bg-[#86cf00] text-black px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#a0f700]/10">
                        <span className="text-lg leading-none">+</span> Crear Usuario
                    </button>
                </div>

                <div className="flex flex-col xl:flex-row gap-6">
                </div>
                
            </div>
        </MainLayout>
    );
}