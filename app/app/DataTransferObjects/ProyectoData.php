<?php

namespace App\DataTransferObjects;

final readonly class ProyectoData
{
    /**
     * @param  array<int, string>  $camposInformados  Campos presentes en la petición (permite actualizaciones parciales).
     */
    public function __construct(
        public ?int $idFaena,
        public ?int $idCliente,
        public ?string $nombre,
        public ?string $descripcion,
        public ?string $ubicacion,
        public ?int $idProyectoIntrava,
        public ?string $centroCosto,
        public ?string $alias,
        public ?string $numContrato,
        public ?string $fechaInicio,
        public ?string $fechaTermino,
        public ?string $estado,
        public array $camposInformados = [],
    ) {}

    public static function fromArray(array $datos): self
    {
        return new self(
            idFaena: isset($datos['id_faena']) ? (int) $datos['id_faena'] : null,
            idCliente: isset($datos['id_cliente']) ? (int) $datos['id_cliente'] : null,
            nombre: $datos['nombre'] ?? null,
            descripcion: $datos['descripcion'] ?? null,
            ubicacion: $datos['ubicacion'] ?? null,
            idProyectoIntrava: isset($datos['id_proyecto_intrava']) ? (int) $datos['id_proyecto_intrava'] : null,
            centroCosto: $datos['centro_costo'] ?? null,
            alias: $datos['alias'] ?? null,
            numContrato: $datos['num_contrato'] ?? null,
            fechaInicio: $datos['fecha_inicio'] ?? null,
            fechaTermino: $datos['fecha_termino'] ?? null,
            estado: $datos['estado'] ?? null,
            camposInformados: array_keys($datos),
        );
    }

    /**
     * Devuelve solo los campos informados, listos para persistir.
     */
    public function toArray(): array
    {
        $todos = [
            'id_faena' => $this->idFaena,
            'id_cliente' => $this->idCliente,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'ubicacion' => $this->ubicacion,
            'id_proyecto_intrava' => $this->idProyectoIntrava,
            'centro_costo' => $this->centroCosto,
            'alias' => $this->alias,
            'num_contrato' => $this->numContrato,
            'fecha_inicio' => $this->fechaInicio,
            'fecha_termino' => $this->fechaTermino,
            'estado' => $this->estado,
        ];

        return array_intersect_key($todos, array_flip($this->camposInformados));
    }
}
