<?php

namespace App\DataTransferObjects;

class CuadrillaDTO
{
    public function __construct(
        public readonly ?int $id_supervisor = null,
        public readonly ?string $numero_cuadrilla = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id_supervisor: isset($data['id_supervisor'])
                ? (int) $data['id_supervisor']
                : null,
            numero_cuadrilla: $data['numero_cuadrilla'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'id_supervisor' => $this->id_supervisor,
            'numero_cuadrilla' => $this->numero_cuadrilla,
        ], fn ($value) => $value !== null);
    }
}