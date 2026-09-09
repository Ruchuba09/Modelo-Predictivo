<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('targetas', function (Blueprint $table) {
            $table->id('id_tarjeta');
            $table->string("id_modelo_tarjeta")->foreignId('id_modelo_tarjeta')->constrained('modelo_tarjeta')->onDelete('cascade');
            $table->string("rut")->foreignId('rut')->constrained('trabajador')->onDelete('cascade');
            $table->string("medida")->foreignId('medida')->constrained('medida')->onDelete('cascade');
            $table->string("id_escala_riesgo")->foreignId('id_escala_riesgo')->constrained('escala_riesgo')->onDelete('cascade');
            $table->string('ubicacion', 255)->nullable();
            $table->text('descripcion');
            $table->string('estado', 50)->default('abierta');
            $table->timestamp('fecha_reporte')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('targetas');
    }
};
