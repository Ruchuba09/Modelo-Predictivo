<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incidentes', function (Blueprint $table) {
            $table->foreignId('id_evento')
                ->primary()
                ->constrained('eventos', 'id_evento')
                ->cascadeOnDelete();

            $table->string('gravedad');
            $table->boolean('requiere_investigacion')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incidentes');
    }
};