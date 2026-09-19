<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cuadrillas', function (Blueprint $table) {
            $table->id('id_cuadrilla');
            $table->string('nombre');
            $table->foreignId('id_supervisor')->constrained('supervisors', 'id_trabajador');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cuadrillas');
    }
};