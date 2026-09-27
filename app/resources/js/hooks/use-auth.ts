// hooks/use-auth.ts
import { usePage } from '@inertiajs/react';

interface AuthProps {
    auth: {
        user: {
            id: number;
            email: string;
            roles: string[];
            permisos: string[];
        } | null;
    };
}

export function useAuth() {
    const { auth } = usePage<AuthProps>().props;
    return auth.user;
}

export function useTienePermiso(permiso: string) {
    return useAuth()?.permisos?.includes(permiso) ?? false;
}

export function useTieneRol(rol: string) {
    return useAuth()?.roles?.includes(rol) ?? false;
}