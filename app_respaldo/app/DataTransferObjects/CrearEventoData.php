<?php

namespace App\DataTransferObjects;

use Illuminate\Http\UploadedFile;

final readonly class CrearEventoData
{
    public function __construct(
        public int $idTipoEvento,
        public int $condicion,
        public string $descripcion,
        public string $referencia,
        public int $idProyecto,
        public bool $esParaMi,
        public ?int $idTrabajador,
        public ?string $severidad,
        public array $evidencias = [],
    ) {}

    public static function fromArray(array $datos): self
    {
        return new self(
            idTipoEvento: (int) $datos['id_tipo_evento'],
            condicion: (int) $datos['condicion'],
            descripcion: $datos['descripcion'],
            referencia: $datos['referencia'],
            idProyecto: (int) $datos['id_proyecto'],
            esParaMi: (bool) ($datos['es_para_mi'] ?? true),
            idTrabajador: isset($datos['id_trabajador'])
                ? (int) $datos['id_trabajador']
                : null,
            severidad: $datos['severidad'] ?? null,
            evidencias: $datos['evidencia'] ?? [],
        );
    }
}
