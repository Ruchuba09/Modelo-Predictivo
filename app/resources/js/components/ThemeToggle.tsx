import { useEffect, useState } from 'react';
import { useAppearance } from '@/hooks/use-appearance';

export default function ThemeToggle({ className = '' }: { className?: string }) {
    const { appearance, updateAppearance } = useAppearance();
    const [isDark, setIsDark] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return false;
    });

    useEffect(() => {
        const checkDark = () => {
            const hasDarkClass = document.documentElement.classList.contains('dark');
            setIsDark(hasDarkClass);
        };

        checkDark();

        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, [appearance]);

    const handleToggle = () => {
        const nextMode = isDark ? 'light' : 'dark';
        updateAppearance(nextMode);
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className={`relative p-2 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-center group ${
                isDark
                    ? 'bg-[#181D23] border-[#2A323D] text-[#A0F700] hover:border-[#A0F700]/70 hover:bg-[#20272F] shadow-sm'
                    : 'bg-verde-1 border-verde-3 text-gris-2 hover:border-verde-5 hover:bg-verde-2 hover:text-verde-6'
            } ${className}`}
        >
            {isDark ? (
                // Sol para cambiar a claro
                <svg
                    className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>
            ) : (
                // Luna para cambiar a oscuro
                <svg
                    className="w-5 h-5 transition-transform duration-300 group-hover:-rotate-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                </svg>
            )}
        </button>
    );
}
