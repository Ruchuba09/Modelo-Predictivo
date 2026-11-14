<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * RF-12: cada evidencia registra si se adjuntó al reportar o al cerrar el
 * evento, para listarlas por separado (RF-13). Las filas existentes quedan
 * como evidencia del reporte.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('evidencias') || Schema::hasColumn('evidencias', 'origen')) {
            return;
        }

        Schema::table('evidencias', function (Blueprint $table) {
            $table->string('origen', 20)->default('reporte');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('evidencias', 'origen')) {
            return;
        }

        Schema::table('evidencias', function (Blueprint $table) {
            $table->dropColumn('origen');
        });
    }
};
