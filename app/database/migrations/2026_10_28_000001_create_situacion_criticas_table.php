<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('situacion_criticas')) {
            return;
        }

        Schema::create('situacion_criticas', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('id_trabajador');
            $table->unsignedBigInteger('id_supervisor')->nullable();
            $table->unsignedBigInteger('id_evento');
            $table->string('referencia', 255);
            $table->smallInteger('condicion');

            $table->foreign('id_trabajador')->references('id_trabajador')->on('trabajadores')->cascadeOnDelete();
            $table->foreign('id_supervisor')->references('id_trabajador')->on('supervisores')->nullOnDelete();
            $table->foreign('id_evento')->references('id_evento')->on('eventos')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('situacion_criticas');
    }
};
