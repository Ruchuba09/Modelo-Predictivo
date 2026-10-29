import type { PropsWithChildren } from 'react';
import MainLayout from './MainLayout';

interface UsuariosLayoutProps extends PropsWithChildren {
    bgClass?: string;
}

export default function UsuariosLayout({ children, bgClass }: UsuariosLayoutProps) {
    return <MainLayout bgClass={bgClass}>{children}</MainLayout>;
}
