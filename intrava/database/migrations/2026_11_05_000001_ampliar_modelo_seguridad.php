<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(fn () => DB::unprepared(file_get_contents(database_path('sql/2026_11_05_modelo_seguridad.sql'))));
    }

    public function down(): void
    {
        // No se revierte de forma automática: trasladó y eliminó trabajador_cuadrilla,
        // y cambió la escala de severidad. Para volver atrás, restaura un respaldo.
    }
};
