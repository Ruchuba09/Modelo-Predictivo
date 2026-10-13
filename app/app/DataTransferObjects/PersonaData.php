<?php

namespace App\DataTransferObjects;

final readonly class PersonaData
{
    public function __construct(
        public string $rut,
        public string $nombre1,
        public ?string $nombre2,
        public string $apellido1,
        public ?string $apellido2,
    ) {}

    public static function fromArray(array $datos): self
    {
        return new self(
            rut: $datos['rut'],
            nombre1: $datos['nombre_1'],
            nombre2: $datos['nombre_2'] ?? null,
            apellido1: $datos['apellido_1'],
            apellido2: $datos['apellido_2'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'rut' => $this->rut,
            'nombre_1' => $this->nombre1,
            'nombre_2' => $this->nombre2,
            'apellido_1' => $this->apellido1,
            'apellido_2' => $this->apellido2,
        ];
    }
}