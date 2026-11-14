<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * RF-14.3 / RF-15.3: historial de cada Situación Crítica (creación y cada
 * campo modificado, con usuario, fecha y origen del cambio).
 *
 * id_situacion_critica no tiene clave foránea a propósito: la Situación
 * Crítica se borra en cascada con su Tarjeta PARE, pero su historial se
 * conserva (RF-15.6).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('situacion_critica_historial')) {
            return;
        }

        Schema::create('situacion_critica_historial', function (Blueprint $table) {
            $table->id('id_historial');
            $table->unsignedBigInteger('id_situacion_critica');
            $table->unsignedBigInteger('id_evento')->nullable();
            $table->string('origen', 30);
            $table->string('campo', 30)->nullable();
            $table->text('valor_anterior')->nullable();
            $table->text('valor_nuevo')->nullable();
            $table->unsignedBigInteger('id_usuario')->nullable();
            $table->timestamp('fecha')->useCurrent();

            $table->foreign('id_usuario')->references('id_user')->on('users')->nullOnDelete();
            $table->index('id_situacion_critica');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('situacion_critica_historial');
    }
};
