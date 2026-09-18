<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eventos', function (Blueprint $table) {
            $table->id('id_evento');

            $table->foreignId('id_trabajador')->constrained('trabajadors', 'id_trabajador');
            $table->foreignId('id_supervisor')->nullable()->constrained('trabajadors', 'id_trabajador');
            $table->foreignId('id_administrativo')->nullable()->constrained('trabajadors', 'id_trabajador');

            $table->enum('tipo', ['incidente', 'fatalidad']);
            $table->enum('estado', ['abierta', 'proceso', 'cerrada'])->default('abierta');

            $table->timestamp('fecha_creacion')->useCurrent();
            $table->timestamp('fecha_ult_act')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('fecha_cierre')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventos');
    }
};