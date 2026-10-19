<?php

namespace App\DTOs;

class AreaDTO
{
    public function __construct(
        public readonly int $id_faena,
        public readonly string $codigo_area,
        public readonly ?string $descripcion = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id_faena: (int) $data['id_faena'],
            codigo_area: $data['codigo_area'],
            descripcion: $data['descripcion'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'id_faena' => $this->id_faena,
            'codigo_area' => $this->codigo_area,
            'descripcion' => $this->descripcion,
        ];
    }
}