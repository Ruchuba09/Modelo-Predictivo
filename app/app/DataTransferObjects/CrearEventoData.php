<?php

namespace App\DataTransferObjects;

use Illuminate\Http\UploadedFile;

final readonly class CrearEventoData
{
    public function __construct(
        public int $idTipoEvento,
        public ?int $condicion,
        public string $descripcion,
        public string $referencia,
        public int $idProyecto,
        public ?int $idArea,
        public bool $esParaMi,
        public ?int $idTrabajador,
        public ?string $severidad,
        public array $evidencias = [],
        public array $detalle = [],
    ) {}

    private const CAMPOS_DETALLE = [
        'id_severidad', 'id_potencial_severidad', 'fecha_ocurrencia', 'id_turno', 'id_actividad',
        'id_categoria_evento', 'id_clasificacion_incidente', 'tipo_detencion', 'dia_ciclo',
    ];

    public static function fromArray(array $datos): self
    {
        return new self(
            idTipoEvento: (int) $datos['id_tipo_evento'],
            condicion: isset($datos['condicion']) ? (int) $datos['condicion'] : null,
            descripcion: $datos['descripcion'],
            referencia: $datos['referencia'],
            idProyecto: (int) $datos['id_proyecto'],
            idArea: isset($datos['id_area'])
                ? (int) $datos['id_area']
                : null,
            esParaMi: (bool) ($datos['es_para_mi'] ?? true),
            idTrabajador: isset($datos['id_trabajador'])
                ? (int) $datos['id_trabajador']
                : null,
            severidad: $datos['severidad'] ?? null,
            evidencias: $datos['evidencia'] ?? [],
            detalle: array_filter(
                array_intersect_key($datos, array_flip(self::CAMPOS_DETALLE)),
                fn ($valor) => $valor !== null && $valor !== '',
            ),
        );
    }
}
