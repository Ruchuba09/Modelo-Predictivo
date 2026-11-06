<?php

namespace App\DataTransferObjects;

final readonly class ActualizarEventoData
{
    public function __construct(
        public int $condicion,
        public string $descripcion,
        public string $referencia,
    ) {}

    public static function fromArray(array $datos): self
    {
        return new self(
            condicion: (int) $datos['condicion'],
            descripcion: $datos['descripcion'],
            referencia: $datos['referencia'],
        );
    }

    public function toArray(): array
    {
        return [
            'condicion' => $this->condicion,
            'descripcion' => $this->descripcion,
            'referencia' => $this->referencia,
        ];
    }
}
