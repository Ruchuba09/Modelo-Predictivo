<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * RF-14: cada Tarjeta PARE tiene a lo más una Situación Crítica. El índice
 * único lo garantiza en la base aunque dos registros lleguen a la vez, y
 * acelera la búsqueda por evento que usa la sincronización (RF-15.1).
 */
return new class extends Migration
{
    private const INDICE = 'situacion_criticas_id_evento_unique';

    public function up(): void
    {
        $duplicados = DB::table('situacion_criticas')
            ->select('id_evento')->groupBy('id_evento')->havingRaw('COUNT(*) > 1')->pluck('id_evento');

        if ($duplicados->isNotEmpty()) {
            throw new RuntimeException(
                'Hay eventos con más de una Situación Crítica; corríjalos antes de migrar: '.$duplicados->join(', ')
            );
        }

        if (! Schema::hasIndex('situacion_criticas', self::INDICE)) {
            Schema::table('situacion_criticas', fn (Blueprint $table) => $table->unique('id_evento', self::INDICE));
        }
    }

    public function down(): void
    {
        if (Schema::hasIndex('situacion_criticas', self::INDICE)) {
            Schema::table('situacion_criticas', fn (Blueprint $table) => $table->dropUnique(self::INDICE));
        }
    }
};
