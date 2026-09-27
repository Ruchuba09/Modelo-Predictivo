import { useState } from 'react';
import { router } from '@inertiajs/react';

interface CerrarEventoProps {
  eventoId: number;
  estado: string; // estado actual del evento (solo se puede cerrar si es 'proceso')
  onCerrado?: () => void;
}

export default function CerrarEvento({ eventoId, estado, onCerrado }: CerrarEventoProps) {
  const [cargando, setCargando] = useState(false);

  const puedeCerrar = estado === 'abierto';

  const handleCerrar = () => {
    if (!puedeCerrar) return;

    const confirmado = window.confirm(
      '¿Seguro que deseas cerrar este evento? Esta acción no se puede deshacer.'
    );
    if (!confirmado) return;

    setCargando(true);

    router.patch(
      route('eventos.cerrar', eventoId),
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          onCerrado?.();
        },
        onError: (errors) => {
          console.error(errors);
          alert('No se pudo cerrar el evento. Revisa que esté en proceso.');
        },
        onFinish: () => setCargando(false),
      }
    );
  };

  return (
    <button
      type="button"
      onClick={handleCerrar}
      disabled={!puedeCerrar || cargando}
      title={!puedeCerrar ? 'El evento debe estar en proceso para poder cerrarse' : undefined}
      className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
    >
      {cargando ? 'Cerrando...' : 'Cerrar evento'}
    </button>
  );
}
