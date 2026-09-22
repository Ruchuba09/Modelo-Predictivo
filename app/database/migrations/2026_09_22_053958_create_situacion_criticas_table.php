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
        Schema::create('situacion_criticas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_trabajador')->constrained('trabajadors', 'id_trabajador');
            $table->foreignId('id_supervisor')->nullable()->constrained('supervisors', 'id_trabajador');
            $table->foreignId('id_evento')
                ->constrained('eventos', 'id_evento')
                ->cascadeOnDelete();
            $table->string('referencia');
            $table->enum('condicion', ['1', '2']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('situacion_criticas');
    }
};