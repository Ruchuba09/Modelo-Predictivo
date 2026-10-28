<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Trabajador;
use App\Models\Rol;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $usuario = Rol::where('nombre', 'usuario')->firstOrFail();
        $admin = Rol::where('nombre', 'admin')->firstOrFail();

        foreach ([
            ['rut' => '11111111-1', 'email' => 'trabajador@ejemplo.com', 'rol' => $usuario],
            ['rut' => '22222222-2', 'email' => 'supervisor@ejemplo.com', 'rol' => $usuario],
            ['rut' => '33333333-3', 'email' => 'administrativo@ejemplo.com', 'rol' => $admin],
        ] as $datos) {
            $trabajador = Trabajador::whereHas('persona', fn ($query) => $query->where('rut', $datos['rut']))
                ->firstOrFail();
            $cuenta = User::updateOrCreate(
                ['email' => $datos['email']],
                ['id_trabajador' => $trabajador->id_trabajador, 'password' => Hash::make('12345678')]
            );
            $cuenta->roles()->syncWithoutDetaching([$datos['rol']->id_rol]);
        }
    }
}
