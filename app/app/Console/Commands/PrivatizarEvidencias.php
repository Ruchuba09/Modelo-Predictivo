<?php

namespace App\Console\Commands;

use App\Services\EvidenciaEventoService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Mueve las evidencias que quedaron en el disco público (accesibles sin
 * sesión en /storage/...) al disco privado. Las rutas guardadas en la base
 * no cambian, porque ambas carpetas usan la misma ruta relativa.
 */
class PrivatizarEvidencias extends Command
{
    protected $signature = 'evidencias:privatizar {--dry-run : Solo muestra lo que se movería}';

    protected $description = 'Mueve las evidencias de eventos de storage/app/public a storage/app/private';

    public function handle(): int
    {
        $origen = Storage::disk(EvidenciaEventoService::DISCO_LEGADO);
        $destino = Storage::disk(EvidenciaEventoService::DISCO_EVIDENCIAS);
        $movidos = 0;

        foreach (EvidenciaEventoService::CARPETAS_EVIDENCIA as $carpeta) {
            foreach ($origen->allFiles($carpeta) as $ruta) {
                if ($this->option('dry-run')) {
                    $this->line("moveria {$ruta}");
                    $movidos++;

                    continue;
                }

                if (! $destino->exists($ruta)) {
                    $destino->writeStream($ruta, $origen->readStream($ruta));
                }

                $origen->delete($ruta);
                $movidos++;
            }
        }

        $this->info(($this->option('dry-run') ? 'Se moverían ' : 'Movidos ').$movidos.' archivos.');

        return self::SUCCESS;
    }
}
