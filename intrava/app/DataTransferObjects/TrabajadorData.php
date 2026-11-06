<?php

namespace App\DataTransferObjects;

final readonly class TrabajadorData
{
    public function __construct(
        public string $rut,
        public string $nombre1,
        public ?string $nombre2,
        public string $apellido1,
        public ?string $apellido2,
        public string $cargo,
        public ?string $estado,
        public string $idTipoTrabajador,
        public ?int $idTipoObrero,
        public string $email,
    ) {}

    public static function fromArray(array $datos): self
    {
        return new self(
            rut: $datos['rut'],
            nombre1: $datos['nombre_1'],
            nombre2: $datos['nombre_2'] ?? null,
            apellido1: $datos['apellido_1'],
            apellido2: $datos['apellido_2'] ?? null,
            cargo: $datos['cargo'],
            estado: $datos['estado'] ?? null,
            idTipoTrabajador: $datos['id_tipo_trabajador'],
            idTipoObrero: isset($datos['id_tipo_obrero']) ? (int) $datos['id_tipo_obrero'] : null,
            email: $datos['email'],
        );
    }
}