import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';
import MainLayout from '../../layouts/MainLayout';

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <MainLayout>
            <Head title="Cambiar Contraseña | AVA" />

            <div className="max-w-2xl mx-auto p-6 lg:p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Cambiar Contraseña</h1>
                    <p className="text-[#7a7f85] text-sm">Usa una contraseña larga y única para mantener tu cuenta segura.</p>
                </div>

                <div className="bg-[#15181c] border border-white/5 rounded-xl p-6 lg:p-8">
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label htmlFor="current_password" className="block text-sm font-medium text-[#7a7f85] mb-2">
                                Contraseña actual
                            </label>
                            <input
                                id="current_password"
                                ref={currentPasswordInput}
                                type="password"
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                autoComplete="current-password"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700]/50 transition-colors"
                            />
                            {errors.current_password && <p className="mt-2 text-sm text-red-400">{errors.current_password}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-[#7a7f85] mb-2">
                                Nueva contraseña
                            </label>
                            <input
                                id="password"
                                ref={passwordInput}
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="new-password"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700]/50 transition-colors"
                            />
                            {errors.password && <p className="mt-2 text-sm text-red-400">{errors.password}</p>}
                        </div>

                        <div>
                            <label htmlFor="password_confirmation" className="block text-sm font-medium text-[#7a7f85] mb-2">
                                Confirmar contraseña
                            </label>
                            <input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a0f700]/50 transition-colors"
                            />
                            {errors.password_confirmation && <p className="mt-2 text-sm text-red-400">{errors.password_confirmation}</p>}
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-[#a0f700] hover:bg-[#86cf00] disabled:opacity-50 text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
                            >
                                Guardar contraseña
                            </button>
                            {recentlySuccessful && (
                                <span className="text-sm text-[#a0f700]">Guardado correctamente</span>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}