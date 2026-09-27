// components/session-info.tsx
import { usePage } from '@inertiajs/react';

interface AuthUser {
    id: number;
    email: string;
    permisos?: string[];
}

interface PageProps {
    auth?: {
        user?: AuthUser | null;
    };
}

export default function SessionInfo() {
    const { props } = usePage<PageProps>();
    const user = props?.auth?.user ?? null;

    if (!user) {
        return (
            <div className="text-xs text-[#7A7F85] p-3 border border-[#2D3238] rounded-md">
                Sin sesión activa
            </div>
        );
    }

    const permisos = user.permisos ?? [];

    return (
        <div className="text-xs text-[#7A7F85] p-3 border border-[#2D3238] rounded-md space-y-1">
            <p><span className="text-white font-semibold">Email:</span> {user.email ?? '—'}</p>
            <p><span className="text-white font-semibold">ID:</span> {user.id ?? '—'}</p>
            <p>
                <span className="text-white font-semibold">Permisos:</span>{' '}
                {permisos.length > 0 ? permisos.join(', ') : 'ninguno'}
            </p>
        </div>
    );
}