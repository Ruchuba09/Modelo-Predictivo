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
