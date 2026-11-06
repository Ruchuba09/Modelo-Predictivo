<?php

namespace App\DataTransferObjects;

final readonly class FaenaData
{
    public function __construct(
        public string $codigoFaena,
        public string $nombre,
    ) {}

    public static function fromArray(array $datos): self
    {
        return new self(
            codigoFaena: $datos['codigo_faena'],
            nombre: $datos['nombre'],
        );
    }

    public function toArray(): array
    {
        return [
            'codigo_faena' => $this->codigoFaena,
            'nombre' => $this->nombre,
        ];
    }
}
