<?php

namespace App\Services;

use App\Models\Evento;
use App\Models\Evidencia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * Archivos de evidencia de los eventos (de reporte y de cierre).
 *
 * RF-12: cada archivo se guarda en el disco privado y se registra en la tabla
 * `evidencias` (nombre, ruta, tipo, origen y fecha). Las rutas se siguen
 * copiando en eventos.evidencia / evidencia_cierre porque las estadísticas,
 * el detalle web y la app móvil aún las leen desde ahí.
 *
 * RF-13: se sirven con responder(), después de autorizar con EventoPolicy@view.
 */
class EvidenciaEventoService
{
    /** Disco privado (storage/app/private): las evidencias solo se sirven tras autorizar. */
    public const DISCO_EVIDENCIAS = 'local';

    /** Disco donde quedaron las evidencias antiguas; se usa solo para leerlas. */
    public const DISCO_LEGADO = 'public';

    public const CARPETAS_EVIDENCIA = ['evidencias', 'evidencias_cierre'];

    /** Tipos que el navegador muestra sin descargar (RF-13.3.1). */
    private const EXTENSIONES_EN_LINEA = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];

    private const CARPETA_POR_ORIGEN = [
        Evidencia::ORIGEN_REPORTE => 'evidencias',
        Evidencia::ORIGEN_CIERRE => 'evidencias_cierre',
    ];

    /**
     * RF-12: guarda los archivos y registra cada evidencia del evento.
     * Debe llamarse dentro de la transacción del registro o cierre: si algo
     * falla aquí, borra los archivos ya guardados y relanza la excepción para
     * que esa transacción se revierta.
     *
     * @param  array<int, UploadedFile>  $archivos
     * @return list<string> rutas guardadas
     */
    public function registrar(Evento $evento, array $archivos, string $origen): array
    {
        $carpeta = self::CARPETA_POR_ORIGEN[$origen]
            ?? throw new \InvalidArgumentException("Origen de evidencia no válido: {$origen}");

        $rutas = [];

        try {
            foreach ($archivos as $archivo) {
                if (! $archivo instanceof UploadedFile) {
                    continue;
                }

                $ruta = $archivo->store($carpeta, self::DISCO_EVIDENCIAS);
                if ($ruta === false) {
                    throw new \RuntimeException("No se pudo almacenar la evidencia {$archivo->getClientOriginalName()}.");
                }
                $rutas[] = $ruta;

                Evidencia::create([
                    'id_evento' => $evento->id_evento,
                    'nombre' => $this->nombreSeguro($archivo, $ruta),
                    'ruta' => $ruta,
                    'tipo_archivo' => $archivo->getMimeType(),
                    'origen' => $origen,
                    'fecha_creacion' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            $this->eliminar($rutas);
            throw $e;
        }

        return $rutas;
    }

    /**
     * El nombre original lo envía el cliente: se le quita cualquier ruta y
     * carácter de control y se recorta a lo que admite la columna, para que
     * un nombre largo o malicioso no haga fallar el registro.
     */
    private function nombreSeguro(UploadedFile $archivo, string $ruta): string
    {
        $nombre = basename(str_replace('\\', '/', $archivo->getClientOriginalName()));
        $nombre = trim(preg_replace('/[\x00-\x1F\x7F]/u', '', $nombre) ?? '');

        if ($nombre === '') {
            return basename($ruta);
        }
        if (mb_strlen($nombre) <= 255) {
            return $nombre;
        }

        $extension = pathinfo($nombre, PATHINFO_EXTENSION);
        $sufijo = $extension !== '' ? '.'.mb_substr($extension, 0, 10) : '';

        return mb_substr($nombre, 0, 255 - mb_strlen($sufijo)).$sufijo;
    }

    /** RF-13: evidencias del evento, separadas en las del reporte y las del cierre. */
    public function listar(Evento $evento): array
    {
        $porOrigen = $this->evidenciasDe($evento)->groupBy('origen');

        $reporte = $this->describir($evento, $porOrigen->get(Evidencia::ORIGEN_REPORTE, collect()));

        return [
            'total' => count($reporte),
            'evidencias' => $reporte,
            'evidencias_cierre' => $cierre = $this->describir($evento, $porOrigen->get(Evidencia::ORIGEN_CIERRE, collect())),
            'total_cierre' => count($cierre),
        ];
    }

    /**
     * Evidencias registradas en la tabla, más las de eventos anteriores a
     * RF-12 que solo tienen la ruta en la columna del evento.
     *
     * @return Collection<int, array{ruta: string, nombre: ?string, tipo_archivo: ?string, origen: string, fecha_creacion: mixed}>
     */
    private function evidenciasDe(Evento $evento): Collection
    {
        $registradas = $evento->evidencias()->orderBy('id_evidencia')->get()
            ->map(fn (Evidencia $e) => [
                'ruta' => $e->ruta,
                'nombre' => $e->nombre,
                'tipo_archivo' => $e->tipo_archivo,
                'origen' => $e->origen ?? Evidencia::ORIGEN_REPORTE,
                'fecha_creacion' => $e->fecha_creacion,
            ]);

        $enTabla = $registradas->pluck('ruta')->all();
        $antiguas = fn (mixed $columna, string $origen) => collect($this->normalizarRutas($columna))
            ->reject(fn (string $ruta) => in_array($ruta, $enTabla, true))
            ->map(fn (string $ruta) => [
                'ruta' => $ruta,
                'nombre' => null,
                'tipo_archivo' => null,
                'origen' => $origen,
                'fecha_creacion' => null,
            ]);

        return $registradas
            ->concat($antiguas($evento->evidencia, Evidencia::ORIGEN_REPORTE))
            ->concat($antiguas($evento->evidencia_cierre, Evidencia::ORIGEN_CIERRE))
            ->values();
    }

    private function describir(Evento $evento, Collection $evidencias): array
    {
        return $evidencias->map(function (array $evidencia) use ($evento) {
            $archivo = basename($evidencia['ruta']);
            $extension = strtolower(pathinfo($evidencia['nombre'] ?? $archivo, PATHINFO_EXTENSION));

            return [
                // Nombre del archivo guardado: es el que identifica la evidencia en la URL.
                'nombre' => $archivo,
                'nombre_original' => $evidencia['nombre'] ?? $archivo,
                'ruta' => route('eventos.archivo', [$evento->id_evento, $archivo], false),
                'extension' => $extension ?: 'archivo',
                'tipo_archivo' => $evidencia['tipo_archivo'],
                'fecha_creacion' => $evidencia['fecha_creacion']?->toIso8601String(),
                // Se decide por el archivo guardado, no por el nombre que envió el cliente.
                'es_imagen' => in_array(strtolower(pathinfo($archivo, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'gif', 'webp'], true),
            ];
        })->values()->all();
    }

    /**
     * Sirve un archivo del evento. Solo se aceptan archivos que pertenezcan a
     * ese evento (evidencia o evidencia de cierre); la autorización sobre el
     * evento la hace el controlador con EventoPolicy@view.
     */
    public function responder(Evento $evento, string $archivo)
    {
        $nombre = basename($archivo);

        $evidencia = $this->evidenciasDe($evento)
            ->first(fn (array $evidencia) => basename($evidencia['ruta']) === $nombre);

        abort_unless($evidencia, 404, 'Archivo no encontrado');

        $ruta = $evidencia['ruta'];
        $nombreOriginal = $evidencia['nombre'] ?: $nombre;
        // RF-13.3.1: imágenes y PDF se ven en el navegador; el resto se descarga.
        $enLinea = in_array(strtolower(pathinfo($ruta, PATHINFO_EXTENSION)), self::EXTENSIONES_EN_LINEA, true);
        // El navegador no debe adivinar el tipo de un archivo subido por un usuario.
        $cabeceras = ['X-Content-Type-Options' => 'nosniff'];

        foreach ([self::DISCO_EVIDENCIAS, self::DISCO_LEGADO] as $disco) {
            if (Storage::disk($disco)->exists($ruta)) {
                return $enLinea
                    ? Storage::disk($disco)->response($ruta, $nombreOriginal, $cabeceras)
                    : Storage::disk($disco)->download($ruta, $nombreOriginal, $cabeceras);
            }
        }

        abort(404, 'Archivo no encontrado');
    }

    /** Rutas de todas las evidencias (de reporte y de cierre) del evento. */
    public function rutas(Evento $evento): array
    {
        return $this->evidenciasDe($evento)->pluck('ruta')->unique()->values()->all();
    }

    private function normalizarRutas(mixed $valor): array
    {
        if (is_string($valor)) {
            $valor = json_decode($valor, true) ?: [];
        }

        return is_array($valor)
            ? array_values(array_filter($valor, 'is_string'))
            : [];
    }

    public function eliminar(array $rutas): void
    {
        if ($rutas === []) {
            return;
        }

        foreach ([self::DISCO_EVIDENCIAS, self::DISCO_LEGADO] as $disco) {
            Storage::disk($disco)->delete($rutas);
        }
    }
}
