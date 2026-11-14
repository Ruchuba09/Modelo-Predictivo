<?php

namespace App\DataTransferObjects;

/** Datos de un Permiso (RF-23, RF-24). */
final readonly class PermisoData
{
    public function __construct(
        public string $nombre,
        public ?string $descripcion = null,
        public ?int $nivel = null,
    ) {}

    public static function fromArray(array $datos): self
    {
        $descripcion = isset($datos['descripcion']) ? trim((string) $datos['descripcion']) : '';
        $nivel = $datos['nivel'] ?? null;

        return new self(
            nombre: trim($datos['nombre']),
            descripcion: $descripcion !== '' ? $descripcion : null,
            nivel: $nivel === null || $nivel === '' ? null : (int) $nivel,
        );
    }

    public function toArray(): array
    {
        return [
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'nivel' => $this->nivel,
        ];
    }
}
