import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { format, validate } from 'rut.js';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

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

        if (/^[0-9kK]+$/.test(value) || value === '') {
            value = format(value);
        }

        setData('rut', value);
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
        <AuthLayout title="Acceso a su cuenta AVA" description='Ingrese sus credenciales para iniciar sesión' >
            <Head title="Log in" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="rut">RUT o EMAIL</Label>
                        <Input
                            id="rut"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.rut}
                            onChange={handleRutChange}
                            placeholder="12.345.678-9 o usuario@avamontajes.cl"
                        />
                        <InputError message={validacionLocal || errors.rut} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Contraseña</Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="ml-auto text-sm" tabIndex={5}>
                                    ¿Olvidaste tu contraseña?
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="********"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox id="remember" 
                        name="remember" 
                        tabIndex={3}
                        checked={data.remember}
                        onCheckedChange={(checked) => setData('remember', checked as boolean)}
                        />
                        <Label htmlFor="remember">Recordar mi sesión</Label>
                    </div>

                    <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Iniciar sesión
                    </Button>
                </div>
            </form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
