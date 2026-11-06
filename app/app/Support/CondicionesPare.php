<?php

namespace App\Support;

/**
 * Catálogo único de las condiciones de la Tarjeta PARE. La web y la app móvil
 * lo reciben desde aquí; no deben mantener su propia copia de los textos.
 */
final class CondicionesPare
{
    /** Nombre corto, para gráficos y avisos. */
    public const ETIQUETAS = [
        1 => '1. Cond. Inseguras',
        2 => '2. Herramientas',
        3 => '3. Falta EPP',
        4 => '4. Capacitación',
        5 => '5. Procedimientos',
        6 => '6. Recursos',
        7 => '7. AST/VATS/ERT',
        8 => '8. Permisos',
        9 => '9. Est. Físico/Mental',
        10 => '10. Otros',
    ];

    /** Texto completo, para los formularios y el detalle del reporte. */
    public const DESCRIPCIONES = [
        1 => 'Si las condiciones de trabajo NO son seguras.',
        2 => 'Si NO tiene las herramientas adecuadas o están en mal estado.',
        3 => 'Si NO tiene los EPP adecuados.',
        4 => 'Si NO sabe o no está capacitado / autorizado para realizar la actividad.',
        5 => 'Si NO hay un procedimiento / instructivo asociado a la actividad o si este existe pero no ha sido difundido.',
        6 => 'NO contar con el apoyo de recursos humanos y/o materiales necesarios para realizar la actividad.',
        7 => 'NO contar con AST, VATS, ERT.',
        8 => 'NO contar con el o los permisos exigidos para realizar la actividad.',
        9 => 'NO encontrarse en condiciones físicas o emocionales para realizar la actividad.',
        10 => 'Otras condiciones no consideradas que impliquen un riesgo no controlado.',
    ];

    public static function descripcion(mixed $condicion): ?string
    {
        return is_numeric($condicion) ? (self::DESCRIPCIONES[(int) $condicion] ?? null) : null;
    }

    /** @return list<array{id_condicion: int, nombre: string, etiqueta: string}> */
    public static function catalogo(): array
    {
        return array_map(
            fn (int $id) => [
                'id_condicion' => $id,
                'nombre' => self::DESCRIPCIONES[$id],
                'etiqueta' => self::ETIQUETAS[$id],
            ],
            array_keys(self::DESCRIPCIONES),
        );
    }
}
