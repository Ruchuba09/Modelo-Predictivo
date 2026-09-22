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
        Schema::create('faenas', function (Blueprint $table) {
             $table->id();

            $table->foreignId('id_cliente')
                ->constrained('clientes')
                ->restrictOnDelete();

            $table->foreignId('id_dpto')
                ->constrained('departamentos')
                ->restrictOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('faenas');
    }
};
