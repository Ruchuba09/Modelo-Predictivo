<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class ServirModeloPredictivo extends Command
{
    protected $signature = 'modelo:servir';

    protected $description = 'Levanta el servicio Python del modelo predictivo con la misma base de datos de Laravel.';

    private const HOSTS_LOCALES = ['127.0.0.1', 'localhost', '::1'];

    public function handle(): int
    {
        $url = parse_url((string) config('services.predictive_model.url'));
        $host = $url['host'] ?? '127.0.0.1';

        // Con Docker el servicio tiene su propio contenedor. Se termina sin error
        // para que `composer run dev` no detenga los demás procesos.
        if (! in_array($host, self::HOSTS_LOCALES, true)) {
            $this->components->info("El modelo predictivo se atiende en {$host}; no se levanta localmente.");

            return self::SUCCESS;
        }

        $directorio = dirname(base_path()).DIRECTORY_SEPARATOR.'python';
        $python = $this->interpreteLocal($directorio);

        if ($python === null) {
            $this->components->warn(
                "No se encontró el entorno virtual en {$directorio}. Consulta python/README.md para crearlo."
            );

            return self::SUCCESS;
        }

        $conexion = config('database.connections.'.config('database.default'));
        $puerto = (string) ($url['port'] ?? 8000);

        $proceso = new Process(
            [$python, '-m', 'uvicorn', 'servicio:app', '--host', $host, '--port', $puerto],
            $directorio,
            ['DATABASE_URL' => self::urlBaseDatos($conexion), 'PYTHONDONTWRITEBYTECODE' => '1'],
        );
        $proceso->setTimeout(null);

        $this->components->info("Modelo predictivo en http://{$host}:{$puerto} (base: {$conexion['database']}).");

        return $proceso->run(fn (string $tipo, string $salida) => $this->output->write($salida));
    }

    /** Traduce una conexión de Laravel al formato de SQLAlchemy. */
    public static function urlBaseDatos(array $conexion): string
    {
        if (! empty($conexion['url'])) {
            return preg_replace('#^[a-z0-9+]+://#i', 'postgresql+psycopg2://', $conexion['url']);
        }

        return sprintf(
            'postgresql+psycopg2://%s:%s@%s:%s/%s',
            rawurlencode((string) $conexion['username']),
            rawurlencode((string) $conexion['password']),
            $conexion['host'],
            $conexion['port'],
            rawurlencode((string) $conexion['database']),
        );
    }

    private function interpreteLocal(string $directorio): ?string
    {
        foreach (['venv/Scripts/python.exe', 'venv/bin/python'] as $ruta) {
            $python = $directorio.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $ruta);

            if (is_file($python)) {
                return $python;
            }
        }

        return null;
    }
}
