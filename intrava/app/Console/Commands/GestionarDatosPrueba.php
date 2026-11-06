<?php

namespace App\Console\Commands;

use App\Services\DatosPruebaService;
use Illuminate\Console\Command;
use RuntimeException;

class GestionarDatosPrueba extends Command
{
    protected $signature = 'datos:prueba
        {accion : poblar o limpiar}
        {tamano=mediana : pequena, mediana o grande (solo para poblar)}
        {--force : Limpia sin pedir confirmación}';

    protected $description = 'Pobla o limpia los datos de prueba; conserva usuarios, roles y permisos.';

    public function handle(DatosPruebaService $servicio): int
    {
        $accion = $this->argument('accion');
        $tamano = $this->argument('tamano');

        if (! in_array($accion, ['poblar', 'limpiar'], true)) {
            $this->error('La acción debe ser poblar o limpiar.');

            return self::FAILURE;
        }
        if ($accion === 'poblar' && ! isset(DatosPruebaService::TAMANOS[$tamano])) {
            $this->error('El tamaño debe ser pequena, mediana o grande.');

            return self::FAILURE;
        }
        if ($accion === 'limpiar' && ! $this->option('force') && ! $this->confirm('¿Borrar todos los datos, salvo usuarios, roles y permisos?')) {
            return self::SUCCESS;
        }

        try {
            $cambios = $accion === 'poblar' ? $servicio->poblar($tamano) : $servicio->limpiar();
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->table(['Tabla', $accion === 'poblar' ? 'Creados' : 'Eliminados'], collect($cambios)->map(fn ($total, $tabla) => [$tabla, $total])->values());

        return self::SUCCESS;
    }
}
