<?php

namespace App\DataTransferObjects;

final readonly class ActividadData
{
    public function __construct(
        public ?int $idAsignacion,
        public ?string $nombre,
        public ?string $descripcion,
        public ?string $fechaInicio,
        public ?string $fechaTermino,
        public ?string $estado,
        public array $camposInformados = [],
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            idAsignacion: isset($data['id_asignacion']) ? (int) $data['id_asignacion'] : null,
            nombre: $data['nombre'] ?? null,
            descripcion: $data['descripcion'] ?? null,
            fechaInicio: $data['fecha_inicio'] ?? null,
            fechaTermino: $data['fecha_termino'] ?? null,
            estado: $data['estado'] ?? null,
            camposInformados: array_keys($data),
        );
    }

    public function toArray(): array
    {
        return array_intersect_key([
            'id_asignacion' => $this->idAsignacion,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'fecha_inicio' => $this->fechaInicio,
            'fecha_termino' => $this->fechaTermino,
            'estado' => $this->estado,
        ], array_flip($this->camposInformados));
    }
}
