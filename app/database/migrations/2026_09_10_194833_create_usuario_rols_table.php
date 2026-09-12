<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = "usuarios";

    public function up(): void
    {
        Schema::create('usuario_rols', function (Blueprint $table) {
            $table->foreignId("id_user")
                ->constrained("users", "id_user")
                ->onDelete("cascade");

            $table->foreignId("id_rol")
                ->constrained("roles", "id_rol")
                ->onDelete("cascade");

            $table->primary(["id_user", "id_rol"]);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuario_rols');
    }
};