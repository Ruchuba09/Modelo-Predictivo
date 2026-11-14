<?php

namespace App\Enums;

/**
 * Lo que predice el servicio de modelos (python/modelos_tasa.py):
 * incidentes laborales, incidentes con lesión (incidentes × P(lesión | incidente))
 * y todos los eventos salvo las Tarjetas PARE.
 */
enum ObjetivoPrediccion: string
{
    case IncidentesReales = 'incidentes_reales';
    case Lesiones = 'lesiones';
    case Todos = 'todos';

    public const PREDETERMINADO = self::IncidentesReales;

    public function etiqueta(): string
    {
        return match ($this) {
            self::IncidentesReales => 'Incidentes reales',
            self::Lesiones => 'Incidentes con lesión',
            self::Todos => 'Todos los eventos',
        };
    }

    /** @return array<int, string> */
    public static function valores(): array
    {
        return array_column(self::cases(), 'value');
    }
}
