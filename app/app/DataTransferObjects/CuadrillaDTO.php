<?php

namespace App\DataTransferObjects;

class CuadrillaDTO
{
    public function __construct(
        public readonly ?int $id_supervisor = null,
        public readonly ?string $numero_cuadrilla = null,
        public readonly ?int $id_jefe_zona = null,
        public readonly bool $jefe_informado = false,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id_supervisor: isset($data['id_supervisor'])
                ? (int) $data['id_supervisor']
                : null,
            numero_cuadrilla: $data['numero_cuadrilla'] ?? null,
            id_jefe_zona: isset($data['id_jefe_zona']) ? (int) $data['id_jefe_zona'] : null,
            jefe_informado: array_key_exists('id_jefe_zona', $data),
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'id_supervisor' => $this->id_supervisor,
            'numero_cuadrilla' => $this->numero_cuadrilla,
        ], fn ($value) => $value !== null) + ($this->jefe_informado ? ['id_jefe_zona' => $this->id_jefe_zona] : []);
    }
}