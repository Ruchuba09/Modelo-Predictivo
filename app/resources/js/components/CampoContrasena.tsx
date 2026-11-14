import { Eye, EyeOff } from 'lucide-react';
import { InputHTMLAttributes, useState } from 'react';

interface CampoContrasenaProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    className?: string;
}

/** R27.9: campo de contraseña con un botón de ojo para mostrarla u ocultarla. */
export default function CampoContrasena({ className = '', ...props }: CampoContrasenaProps) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <input {...props} type={visible ? 'text' : 'password'} className={`${className} pr-10`} />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gris-1 hover:text-gris-2 focus:outline-none"
            >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
}
