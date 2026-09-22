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
        Schema::create('asignacions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('id_cliente')
                ->constrained(table: 'clientes', column: 'id_cliente')
                ->restrictOnDelete();

            $table->foreignId('id_dpto')
                ->constrained('departamentos')
                ->restrictOnDelete();

            $table->timestamp('fecha_creacion')->useCurrent();
            $table->date('fecha_inicio');
            $table->date('fecha_termino')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asignacions');
    }
};