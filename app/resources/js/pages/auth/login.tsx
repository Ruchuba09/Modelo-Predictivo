import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, ArrowRight } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { format, validate } from 'rut.js';

import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';

interface LoginForm {
    rut: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<LoginForm>({
        rut: '',
        password: '',
        remember: false,
    });

    const [validacionLocal, setValidacionLocal] = useState('');

    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        const esIntentoDeCorreo = /[a-jA-Jl-zL-Z@]/.test(value);

        if (esIntentoDeCorreo) {
            setData('rut', value);
        } else {
            const valorLimpio = value.replace(/[^0-9kK]/gi, '');
            const valorRecortado = valorLimpio.slice(0, 9);

            if (valorRecortado.length > 1) {
                setData('rut', format(valorRecortado));
            } else {
                setData('rut', valorRecortado);
            }
        }
        setValidacionLocal('');
        clearErrors('rut');
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setValidacionLocal('');

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.rut);
        const isRut = validate(data.rut);

        if (!isEmail && !isRut) {
            setValidacionLocal('Ingrese un correo corporativo válido o RUT correcto.');
            return;
        }

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen w-full flex bg-black text-white font-sans">
            <Head title="Acceso Plataforma - AVA Montajes" />

            <div className="hidden lg:flex lg:w-1/2 relative bg-[#2D3238] flex-col justify-center p-12 overflow-hidden">
                <div 
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-40" 
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2000&auto=format&fit=crop')" }}
                ></div>
                
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 to-transparent"></div>

                <div className="relative z-20 max-w-lg">
                    <img 
                        src="https://cdn.intrava.cl/v2/logos/Logotipo-isotipo-02.svg" 
                        alt="AVA Montajes" 
                        className="h-30 mb-10"
                    />
                    
                    <h1 className="text-5xl font-bold mb-4 tracking-tight">
                        Modelo Predictivo Integral
                    </h1>
                    <p className="text-[#7A7F85] text-lg leading-relaxed">
                        Inteligencia predictiva y control operacional SGI para la gestión activa de riesgos en faenas mineras e industriales.
                    </p>
                </div>
                
                <div className="absolute bottom-8 left-12 z-20">
                    <p className="text-xs text-[#7A7F85]">© 2026 AVA Montajes S.A. Todos los derechos reservados.</p>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#0a0a0a]">
                <div className="w-full max-w-md space-y-8">
                    
                    <div className="mb-10">
                        <h2 className="text-3xl font-semibold mb-2">Acceso Plataforma</h2>
                        <p className="text-[#7A7F85] text-sm">Ingresa las credenciales autorizadas por SGI.</p>
                    </div>

                    {status && <div className="mb-4 text-sm font-medium text-[#A0F700]">{status}</div>}

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="rut" className="text-xs font-semibold tracking-wider text-[#7A7F85] uppercase">
                                Rut Empresa / Correo Corporativo
                            </label>
                            <div className="relative">
                                <svg className="absolute left-3 top-3 h-5 w-5 text-[#7A7F85]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <input
                                    id="rut"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    value={data.rut}
                                    onChange={handleRutChange}
                                    placeholder="12.345.678-9"
                                    className="w-full bg-transparent border border-[#2D3238] rounded-md py-2.5 pl-10 pr-4 text-white placeholder:text-[#2D3238] focus:border-[#A0F700] focus:ring-1 focus:ring-[#A0F700] transition-colors"
                                />
                            </div>
                            <InputError message={validacionLocal || errors.rut} />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-xs font-semibold tracking-wider text-[#7A7F85] uppercase">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                tabIndex={2}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-transparent border border-[#2D3238] rounded-md py-2.5 px-4 text-white placeholder:text-[#2D3238] focus:border-[#A0F700] focus:ring-1 focus:ring-[#A0F700] transition-colors"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="remember" 
                                    checked={data.remember}
                                    onCheckedChange={(checked) => setData('remember', checked as boolean)}
                                    className="border-[#7A7F85] data-[state=checked]:bg-[#A0F700] data-[state=checked]:text-black"
                                />
                                <label htmlFor="remember" className="text-sm text-[#7A7F85] cursor-pointer hover:text-white transition-colors">
                                    Recordar sesión
                                </label>
                            </div>

                            {canResetPassword && (
                                <a href={route('password.request')} className="text-sm text-[#A0F700] hover:text-[#C1F75E] transition-colors">
                                    Recuperar Clave
                                </a>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={processing}
                            className="w-full mt-6 bg-[#A0F700] hover:bg-[#86CF00] text-black font-semibold py-3 px-4 rounded-md flex items-center justify-center transition-all disabled:opacity-50"
                        >
                            {processing ? (
                                <LoaderCircle className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <ArrowRight className="h-5 w-5 mr-2" />
                                    Ingresar SGI
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}