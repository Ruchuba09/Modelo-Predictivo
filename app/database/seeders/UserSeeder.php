<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Trabajador;
use App\Models\Rol;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Las bases legacy pueden tener IDs insertados manualmente sin avanzar
        // la secuencia SERIAL/IDENTITY de PostgreSQL.
        DB::statement(<<<'SQL'
            WITH current_ids AS (
                SELECT MAX(id_user) AS max_id FROM users
            ), sequence_info AS (
                SELECT pg_get_serial_sequence('users', 'id_user')::regclass AS sequence_name
            )
            SELECT setval(
                sequence_name,
                GREATEST(
                    COALESCE(max_id, 1),
                    COALESCE(pg_sequence_last_value(sequence_name), 1)
                ),
                max_id IS NOT NULL OR pg_sequence_last_value(sequence_name) IS NOT NULL
            )
            FROM current_ids CROSS JOIN sequence_info
            SQL);

        $usuario = Rol::where('nombre', 'usuario')->firstOrFail();
        $supervisorRol = Rol::where('nombre', 'supervisor')->firstOrFail();
        $admin = Rol::where('nombre', 'admin')->firstOrFail();

        foreach ([
            ['rut' => '11111111-1', 'email' => 'trabajador@ejemplo.com', 'rol' => $usuario],
            ['rut' => '22222222-2', 'email' => 'supervisor@ejemplo.com', 'rol' => $supervisorRol],
            ['rut' => '33333333-3', 'email' => 'admin@empresa.cl', 'rol' => $admin],
        ] as $datos) {
            $trabajador = Trabajador::whereHas('persona', fn ($query) => $query->where('rut', $datos['rut']))
                ->firstOrFail();
            $cuenta = User::updateOrCreate(
                ['id_trabajador' => $trabajador->id_trabajador],
                ['email' => $datos['email'], 'password' => Hash::make('12345678')]
            );
            $cuenta->roles()->sync([$datos['rol']->id_rol]);
        }
    }
}
