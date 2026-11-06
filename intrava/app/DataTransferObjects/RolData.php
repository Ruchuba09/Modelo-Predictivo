<?php

namespace App\DataTransferObjects;

final readonly class RolData
{
    /**
     * @param  array<int, int>  $permisos
     */
    public function __construct(
        public string $nombre,
        public array $permisos = [],
    ) {}

    public static function fromArray(array $datos): self
    {
        return new self(
            nombre: $datos['nombre'],
            permisos: array_map('intval', $datos['permisos'] ?? []),
        );
    }
}