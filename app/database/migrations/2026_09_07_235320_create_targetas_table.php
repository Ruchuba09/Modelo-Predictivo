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
            $table->id();
            $table->string("rut")->foreignId('rut')->constrained('trabajador')->onDelete('cascade');
            $table->string("medida")->foreignId('medida')->constrained('medida')->onDelete('cascade');
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
