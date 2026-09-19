<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('obreros', function (Blueprint $table) {
            $table->foreignId('id_trabajador')
                ->primary()
                ->constrained('trabajadors', 'id_trabajador')
                ->cascadeOnDelete();
            $table->foreignId('id_cuadrilla')->nullable()->constrained('cuadrillas', 'id_cuadrilla');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('obreros');
    }
};
