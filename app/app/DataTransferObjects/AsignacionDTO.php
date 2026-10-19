<?php

namespace App\DTOs;

class AsignacionDTO
{
    public function __construct(
        public readonly ?int $id_proyecto = null,
        public readonly ?int $id_cuadrilla = null,
        public readonly ?string $fecha_inicio = null,
        public readonly ?string $fecha_termino = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id_proyecto: isset($data['id_proyecto'])
                ? (int) $data['id_proyecto']
                : null,
            id_cuadrilla: isset($data['id_cuadrilla'])
                ? (int) $data['id_cuadrilla']
                : null,
            fecha_inicio: $data['fecha_inicio'] ?? null,
            fecha_termino: $data['fecha_termino'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'id_proyecto' => $this->id_proyecto,
            'id_cuadrilla' => $this->id_cuadrilla,
            'fecha_inicio' => $this->fecha_inicio,
            'fecha_termino' => $this->fecha_termino,
        ], fn ($value) => $value !== null);
    }
}