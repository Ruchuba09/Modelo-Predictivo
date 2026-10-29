<?php

namespace App\DataTransferObjects;

final readonly class CerrarEventoData
{
    public function __construct(
        public string $justificacion,
        public array $evidenciasCierre = [],
    ) {}

    public static function fromArray(array $datos): self
    {
        return new self(
            justificacion: $datos['justificacion'],
            evidenciasCierre: $datos['evidencia_cierre'] ?? [],
        );
    }
}
