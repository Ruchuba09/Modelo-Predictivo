<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Registra quién creó cada evento. Hasta ahora solo se guardaba a la persona
 * reportada (id_trabajador), y quien reportaba a un tercero perdía el acceso.
 * Los eventos anteriores quedan sin autor: el dato no existe y no se puede deducir.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('eventos') || Schema::hasColumn('eventos', 'id_autor')) {
            return;
        }

        Schema::table('eventos', function (Blueprint $table) {
            $table->unsignedBigInteger('id_autor')->nullable();
            $table->foreign('id_autor')->references('id_user')->on('users')->nullOnDelete();
            $table->index('id_autor');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('eventos', 'id_autor')) {
            return;
        }

        Schema::table('eventos', function (Blueprint $table) {
            $table->dropForeign(['id_autor']);
            $table->dropIndex(['id_autor']);
            $table->dropColumn('id_autor');
        });
    }
};
