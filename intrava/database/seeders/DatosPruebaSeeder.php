<?php

namespace Database\Seeders;

use App\Services\DatosPruebaService;
use Illuminate\Database\Seeder;

class DatosPruebaSeeder extends Seeder
{
    public function run(DatosPruebaService $servicio): void
    {
        $servicio->poblar('mediana');
    }
}
