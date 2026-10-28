<?php

namespace Database\Seeders;

use App\Models\Administrativo;
use App\Models\Obrero;
use App\Models\Supervisor;
use App\Models\Trabajador;
use App\Models\Persona;
use Illuminate\Database\Seeder;

class TrabajadorSeeder extends Seeder
{
    public function run(): void
    {
        $obrero = $this->trabajador('11111111-1', ['nombre_1' => 'Pedro', 'nombre_2' => 'José', 'apellido_1' => 'González', 'apellido_2' => 'Muñoz'], 'Trabajador');
        Obrero::firstOrCreate(['id_trabajador' => $obrero->id_trabajador]);

        $supervisor = $this->trabajador('22222222-2', ['nombre_1' => 'Juan', 'nombre_2' => 'Andrés', 'apellido_1' => 'Pérez', 'apellido_2' => 'Soto'], 'Supervisor');
        Supervisor::firstOrCreate(['id_trabajador' => $supervisor->id_trabajador]);

        $administrativo = $this->trabajador('33333333-3', ['nombre_1' => 'María', 'nombre_2' => 'Fernanda', 'apellido_1' => 'Rojas', 'apellido_2' => 'Díaz'], 'Administrativo');
        Administrativo::firstOrCreate(['id_trabajador' => $administrativo->id_trabajador]);
    }

    private function trabajador(string $rut, array $datosPersona, string $cargo): Trabajador
    {
        $persona = Persona::firstOrCreate(['rut' => $rut], $datosPersona);

        return Trabajador::firstOrCreate(
            ['id_persona' => $persona->id_persona],
            ['cargo' => $cargo, 'estado' => 'activo']
        );
    }
}
