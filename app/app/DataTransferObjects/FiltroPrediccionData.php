<?php

namespace App\DataTransferObjects;

use App\Enums\ObjetivoPrediccion;

/** Objetivo, plazo y, opcionalmente, proyecto de una consulta al modelo predictivo. */
final readonly class FiltroPrediccionData
{
    /** Plazos que ofrece el servicio; todos salen de la misma tasa semanal. */
    public const HORIZONTES_DIAS = [1, 2, 5, 7, 14, 21, 30, 60, 90];

    public const HORIZONTE_PREDETERMINADO = 30;

    public function __construct(
        public ObjetivoPrediccion $objetivo = ObjetivoPrediccion::PREDETERMINADO,
        public int $horizonteDias = self::HORIZONTE_PREDETERMINADO,
        public ?int $idProyecto = null,
    ) {}

    public static function fromArray(array $validated): self
    {
        return new self(
            objetivo: ObjetivoPrediccion::tryFrom((string) ($validated['tipo_objetivo'] ?? '')) ?? ObjetivoPrediccion::PREDETERMINADO,
            horizonteDias: (int) ($validated['horizonte_dias'] ?? self::HORIZONTE_PREDETERMINADO),
            idProyecto: isset($validated['id_proyecto']) ? (int) $validated['id_proyecto'] : null,
        );
    }

    public function conProyecto(int $idProyecto): self
    {
        return new self($this->objetivo, $this->horizonteDias, $idProyecto);
    }

    /** Parámetros de consulta para el servicio Python. */
    public function toQuery(): array
    {
        return array_filter([
            'tipo_objetivo' => $this->objetivo->value,
            'horizonte_dias' => $this->horizonteDias,
            'id_proyecto' => $this->idProyecto,
        ], fn ($valor) => $valor !== null);
    }
}
