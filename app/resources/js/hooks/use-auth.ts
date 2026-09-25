// hooks/use-auth.ts
import { usePage } from '@inertiajs/react';

interface AuthProps {
    auth: {
        user: {
            id: number;
            email: string;
            permisos: string[];
        } | null;
    };
}

export function useAuth() {
    const { auth } = usePage<AuthProps>().props;
    return auth.user;
}

export function useTienePermiso(permiso: string) {
    const user = useAuth();
    return user?.permisos?.includes(permiso) ?? false;
}