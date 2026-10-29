<?php

namespace Database\Seeders;

use App\Models\Administrativo;
use App\Models\Obrero;
use App\Models\Supervisor;
use App\Models\Trabajador;
use Illuminate\Database\Seeder;

class TrabajadorSeeder extends Seeder
{
    public function run(): void
    {
        $obrero = Trabajador::firstOrCreate(
            ['rut' => '11111111-1'],
            [
                'nombre_1' => 'Pedro', 'nombre_2' => 'José',
                'apellido_1' => 'González', 'apellido_2' => 'Muñoz',
                'cargo' => 'Trabajador', 'id_tipo_trabajador' => 'obrero',
                'fecha_creacion' => now(), 'ultima_act' => now(), 'estado' => 'activo',
            ]
        );
        Obrero::firstOrCreate(['id_trabajador' => $obrero->id_trabajador]);

        $supervisor = Trabajador::firstOrCreate(
            ['rut' => '22222222-2'],
            [
                'nombre_1' => 'Juan', 'nombre_2' => 'Andrés',
                'apellido_1' => 'Pérez', 'apellido_2' => 'Soto',
                'cargo' => 'Supervisor', 'id_tipo_trabajador' => 'supervisor',
                'fecha_creacion' => now(), 'ultima_act' => now(), 'estado' => 'activo',
            ]
        );
        Supervisor::firstOrCreate(['id_trabajador' => $supervisor->id_trabajador]);

        $administrativo = Trabajador::firstOrCreate(
            ['rut' => '33333333-3'],
            [
                'nombre_1' => 'María', 'nombre_2' => 'Fernanda',
                'apellido_1' => 'Rojas', 'apellido_2' => 'Díaz',
                'cargo' => 'Administrativo', 'id_tipo_trabajador' => 'administrativo',
                'fecha_creacion' => now(), 'ultima_act' => now(), 'estado' => 'activo',
            ]
        );
        Administrativo::firstOrCreate(['id_trabajador' => $administrativo->id_trabajador]);
    }
}