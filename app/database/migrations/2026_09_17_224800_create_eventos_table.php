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

            $table->foreignId('id_trabajador')->constrained('obreros', 'id_trabajador');
            $table->foreignId('id_supervisor')->nullable()->constrained('supervisors', 'id_trabajador');
            $table->foreignId('id_administrativo')->nullable()->constrained('administrativos', 'id_trabajador');

            $table->enum('tipo', ['incidente', 'situacionCritica']);
            $table->enum('estado', ['abierta', 'proceso', 'cerrada'])->default('abierta');

            //$table->string('condicion');
            $table->text('descripcion');
            //$table->string('referencia');
            $table->string('evidencia_path')->nullable();
            $table->string('evidencia_tipo')->nullable();

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