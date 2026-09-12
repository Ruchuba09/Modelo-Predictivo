<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = "usuarios";

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create("proyectos", function (Blueprint $table) {
            $table->id();
            $table->text("centro_costo")->unique();
            $table->text("nombre")->unique();
            $table->text("alias")->unique();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("proyectos");
    }
};
