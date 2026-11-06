<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega al esquema base (provisionado por SQL) lo que el código ya usa:
 * eventos.severidad, los datos de INTRAVA del proyecto y password_reset_tokens.
 * Cada cambio se omite si ya existe, para que sirva en bases nuevas y antiguas.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('eventos') && ! Schema::hasColumn('eventos', 'severidad')) {
            Schema::table('eventos', function (Blueprint $table) {
                $table->string('severidad', 100)->nullable();
            });
        }

        if (Schema::hasTable('proyectos')) {
            $columnas = [
                'id_proyecto_intrava' => fn (Blueprint $table) => $table->bigInteger('id_proyecto_intrava')->nullable()->unique(),
                'centro_costo' => fn (Blueprint $table) => $table->string('centro_costo', 50)->nullable(),
                'alias' => fn (Blueprint $table) => $table->string('alias', 255)->nullable(),
                'num_contrato' => fn (Blueprint $table) => $table->string('num_contrato', 100)->nullable(),
            ];

            foreach ($columnas as $columna => $definir) {
                if (! Schema::hasColumn('proyectos', $columna)) {
                    Schema::table('proyectos', $definir);
                }
            }
        }

        if (! Schema::hasTable('password_reset_tokens')) {
            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        // No reversible: estas columnas y tablas forman parte del esquema base.
    }
};
