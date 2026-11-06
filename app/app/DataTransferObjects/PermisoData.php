<?php

namespace App\DataTransferObjects;

final readonly class PermisoData
{
    public function __construct(
        public string $nombre,
        public ?string $nivel,
    ) {}

    public static function fromArray(array $datos): self
    {
        return new self(
            nombre: $datos['nombre'],
            nivel: $datos['nivel'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'nombre' => $this->nombre,
            'nivel' => $this->nivel,
        ];
    }
}