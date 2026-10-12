<?php

namespace App\DataTransferObjects;

final readonly class TipoObreroData
{
    public function __construct(
        public string $nombre,
        public ?string $descripcion,
        public ?string $estado,
    ) {}

    public static function fromArray(array $datos): self
    {
        return new self(
            nombre: $datos['nombre'],
            descripcion: $datos['descripcion'] ?? null,
            estado: $datos['estado'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'estado' => $this->estado,
        ], fn ($valor, $clave) => $valor !== null || $clave === 'descripcion', ARRAY_FILTER_USE_BOTH);
    }
}