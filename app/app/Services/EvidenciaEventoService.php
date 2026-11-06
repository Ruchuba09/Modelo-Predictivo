<?php

namespace App\Services;

use App\Models\Evento;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Archivos de evidencia de los eventos (de reporte y de cierre).
 *
 * Se guardan en el disco privado; nunca quedan accesibles por /storage.
 * Para servirlos se usa responder(), después de autorizar con EventoPolicy@view.
 */
class EvidenciaEventoService
{
    /** Disco privado (storage/app/private): las evidencias solo se sirven tras autorizar. */
    public const DISCO_EVIDENCIAS = 'local';

    /** Disco donde quedaron las evidencias antiguas; se usa solo para leerlas. */
    public const DISCO_LEGADO = 'public';

    public const CARPETAS_EVIDENCIA = ['evidencias', 'evidencias_cierre'];

    public function listar(Evento $evento): array
    {
        $archivos = $this->describir($evento, $this->normalizarRutas($evento->evidencia));

        return [
            'total' => count($archivos),
            'evidencias' => $archivos,
            'evidencias_cierre' => $this->describir($evento, $this->normalizarRutas($evento->evidencia_cierre)),
        ];
    }

    private function describir(Evento $evento, array $rutas): array
    {
        return array_map(function (string $ruta) use ($evento) {
            $nombre = basename($ruta);
            $extension = strtolower(pathinfo($ruta, PATHINFO_EXTENSION));

            return [
                'nombre' => $nombre,
                'ruta' => route('eventos.archivo', [$evento->id_evento, $nombre], false),
                'extension' => $extension ?: 'archivo',
                'es_imagen' => in_array(
                    $extension,
                    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
                    true
                ),
            ];
        }, $rutas);
    }

    /**
     * Sirve un archivo del evento. Solo se aceptan archivos que pertenezcan a
     * ese evento (evidencia o evidencia de cierre); la autorización sobre el
     * evento la hace el controlador con EventoPolicy@view.
     */
    public function responder(Evento $evento, string $archivo)
    {
        $nombre = basename($archivo);

        $ruta = collect($this->rutas($evento))
            ->first(fn (string $ruta) => basename($ruta) === $nombre);

        abort_unless($ruta, 404, 'Archivo no encontrado');

        foreach ([self::DISCO_EVIDENCIAS, self::DISCO_LEGADO] as $disco) {
            if (Storage::disk($disco)->exists($ruta)) {
                return Storage::disk($disco)->response($ruta);
            }
        }

        abort(404, 'Archivo no encontrado');
    }

    /** Rutas de todas las evidencias (de reporte y de cierre) del evento. */
    public function rutas(Evento $evento): array
    {
        return array_merge(
            $this->normalizarRutas($evento->evidencia),
            $this->normalizarRutas($evento->evidencia_cierre),
        );
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

    public function guardar(
        array $archivos,
        string $carpeta
    ): array {
        $rutas = [];

        foreach ($archivos as $archivo) {
            if (! $archivo instanceof UploadedFile) {
                continue;
            }

            $rutas[] = $archivo->store($carpeta, self::DISCO_EVIDENCIAS);
        }

        return $rutas;
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
