<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fatalidades', function (Blueprint $table) {
            $table->foreignId('id_evento')
                ->primary()
                ->constrained('eventos', 'id_evento')
                ->cascadeOnDelete();

            $table->string('causa_muerte');
            $table->foreignId('id_victima')->constrained('trabajadors', 'id_trabajador');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fatalidades');
    }
};