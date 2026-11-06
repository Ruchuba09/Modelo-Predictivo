<?php

namespace App\DataTransferObjects;

final readonly class CerrarEventoData
{
    public function __construct(
        public string $justificacion,
        public array $evidenciasCierre = [],
        public array $detalle = [],
    ) {}

    private const CAMPOS_DETALLE = [
        'fecha_reinicio', 'id_clasificacion_incidente', 'id_severidad', 'id_potencial_severidad',
        'id_causa_inmediata', 'id_causa_basica',
    ];

    public static function fromArray(array $datos): self
    {
        return new self(
            justificacion: $datos['justificacion'],
            evidenciasCierre: $datos['evidencia_cierre'] ?? [],
            detalle: array_filter(
                array_intersect_key($datos, array_flip(self::CAMPOS_DETALLE)),
                fn ($valor) => $valor !== null && $valor !== '',
            ),
        );
    }
}
