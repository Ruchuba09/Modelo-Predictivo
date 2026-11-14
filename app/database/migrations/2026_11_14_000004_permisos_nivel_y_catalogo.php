<?php

use App\Support\Permisos;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * RF-23 E-3: Nivel del permiso (1 Básico, 2 Intermedio, 3 Crítico; opcional).
 * Además crea el catálogo de permisos del sistema y se los asigna a los roles
 * que antes daban ese acceso, para que el paso de roles a permisos no cambie
 * lo que cada usuario puede hacer.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('permisos', 'nivel')) {
            Schema::table('permisos', fn (Blueprint $table) => $table->smallInteger('nivel')->nullable());
            DB::statement('ALTER TABLE permisos ADD CONSTRAINT permisos_nivel_check CHECK (nivel BETWEEN 1 AND 3)');
        }

        Permisos::sincronizar();
    }

    public function down(): void
    {
        // Los permisos creados se conservan: pueden estar asignados a roles.
        if (Schema::hasColumn('permisos', 'nivel')) {
            DB::statement('ALTER TABLE permisos DROP CONSTRAINT IF EXISTS permisos_nivel_check');
            Schema::table('permisos', fn (Blueprint $table) => $table->dropColumn('nivel'));
        }
    }
};
