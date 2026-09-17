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
        // rol_permisos — CORREGIDO
        Schema::create('rol_permisos', function (Blueprint $table) {
            $table->foreignId("id_rol")
                ->constrained("roles", "id_rol")
                ->onDelete("cascade");

            $table->foreignId("id_permiso")
                ->constrained("permisos", "id_permiso")
                ->onDelete("cascade");

            $table->primary(["id_rol", "id_permiso"]);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rol_permisos');
    }
};
