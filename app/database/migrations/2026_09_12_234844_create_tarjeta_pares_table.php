<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tarjeta_pares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_trabajador')->constrained('trabajadors', 'id_trabajador');
            $table->foreignId('id_modelo')->constrained('modelo_tarjeta_pare');
            $table->foreignId('id_escala_riesgo')->constrained('escala_riesgos');
            $table->foreignId('id_proyecto')->nullable()->constrained('proyectos');
            $table->string('ubicacion')->nullable();
            $table->text('descripcion');
            $table->string('estado')->default('abierta');
            $table->timestamp('fecha_reporte')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tarjeta_pares');
    }
};