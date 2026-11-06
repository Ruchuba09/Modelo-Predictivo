<?php

namespace App\Enums;

/**
 * Estados de un evento (reporte / tarjeta PARE).
 *
 * Flujo: abierto -> en_revision (lo toma el supervisor) -> cerrado (lo cierra un administrador).
 * La migración 2026_11_04_000001_normalizar_estado_eventos convierte los
 * valores antiguos ('abierta', 'proceso', 'cerrada') a estos tres.
 */
enum EstadoEvento: string
{
    case Abierto = 'abierto';
    case EnRevision = 'en_revision';
    case Cerrado = 'cerrado';

    /** Valores históricos que aún pueden llegar como filtro desde el frontend. */
    private const ALIAS = [
        'abierta' => self::Abierto,
        'proceso' => self::EnRevision,
        'en_proceso' => self::EnRevision,
        'cerrada' => self::Cerrado,
    ];

    public static function desdeTexto(?string $valor): ?self
    {
        $valor = strtolower(trim((string) $valor));

        return self::tryFrom($valor) ?? (self::ALIAS[$valor] ?? null);
    }

    /** Estados que todavía no se cierran. */
    public static function pendientes(): array
    {
        return [self::Abierto, self::EnRevision];
    }

    /** Valores en texto de los estados pendientes, para consultas SQL. */
    public static function valoresPendientes(): array
    {
        return array_map(fn (self $estado) => $estado->value, self::pendientes());
    }

    public function esPendiente(): bool
    {
        return $this !== self::Cerrado;
    }

    public function puedeTomarse(): bool
    {
        return $this === self::Abierto;
    }

    public function editablePorAutor(): bool
    {
        return $this === self::Abierto;
    }

    public function etiqueta(): string
    {
        return match ($this) {
            self::Abierto => 'Abierto',
            self::EnRevision => 'En revisión',
            self::Cerrado => 'Cerrado',
        };
    }
}
