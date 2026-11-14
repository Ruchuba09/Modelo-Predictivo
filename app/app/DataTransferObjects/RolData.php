<?php

namespace App\DataTransferObjects;

use App\Models\Rol;

final readonly class RolData
{
    /**
     * @param  array<int, int>  $permisos
     */
    public function __construct(
        public string $nombre,
        public ?string $descripcion = null,
        public string $estado = Rol::ESTADO_ACTIVO,
        public array $permisos = [],
    ) {}

    public static function fromArray(array $datos): self
    {
        $descripcion = isset($datos['descripcion']) ? trim((string) $datos['descripcion']) : '';

        return new self(
            nombre: trim($datos['nombre']),
            descripcion: $descripcion !== '' ? $descripcion : null,
            estado: $datos['estado'] ?? Rol::ESTADO_ACTIVO,
            permisos: array_values(array_unique(array_map('intval', $datos['permisos'] ?? []))),
        );
    }

    public function campos(): array
    {
        return [
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'estado' => $this->estado,
        ];
    }
}
