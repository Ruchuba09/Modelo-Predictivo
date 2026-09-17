<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trabajadors', function (Blueprint $table) {
            $table->id('id_trabajador');
            $table->string('nombre_1');
            $table->string('nombre_2');
            $table->string('apellido_1');
            $table->string('apellido_2');
            $table->string('cargo');
            $table->string('id_tipo_trabajador');
            $table->string('rut')->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trabajadors');
    }
};