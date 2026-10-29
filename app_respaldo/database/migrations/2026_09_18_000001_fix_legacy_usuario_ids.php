<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = "usuarios";

    public function up(): void
    {
        if (Schema::hasTable("roles") && Schema::hasColumn("roles", "id") && !Schema::hasColumn("roles", "id_rol")) {
            Schema::table("roles", function (Blueprint $table) {
                $table->renameColumn("id", "id_rol");
            });
        }

        if (Schema::hasTable("users") && Schema::hasColumn("users", "id") && !Schema::hasColumn("users", "id_user")) {
            Schema::table("users", function (Blueprint $table) {
                $table->renameColumn("id", "id_user");
            });
        }

        if (Schema::hasTable("permisos") && Schema::hasColumn("permisos", "id") && !Schema::hasColumn("permisos", "id_permiso")) {
            Schema::table("permisos", function (Blueprint $table) {
                $table->renameColumn("id", "id_permiso");
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable("roles") && Schema::hasColumn("roles", "id_rol") && !Schema::hasColumn("roles", "id")) {
            Schema::table("roles", function (Blueprint $table) {
                $table->renameColumn("id_rol", "id");
            });
        }

        if (Schema::hasTable("users") && Schema::hasColumn("users", "id_user") && !Schema::hasColumn("users", "id")) {
            Schema::table("users", function (Blueprint $table) {
                $table->renameColumn("id_user", "id");
            });
        }

        if (Schema::hasTable("permisos") && Schema::hasColumn("permisos", "id_permiso") && !Schema::hasColumn("permisos", "id")) {
            Schema::table("permisos", function (Blueprint $table) {
                $table->renameColumn("id_permiso", "id");
            });
        }
    }
};
