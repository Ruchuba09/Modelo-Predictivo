<?php

namespace Database\Seeders;

use App\Models\Permiso;
use App\Models\Rol;
use App\Support\Permisos;
use Illuminate\Database\Seeder;

/**
 * Roles base y catálogo de Permisos del sistema (RF-19 a RF-26). El
 * Administrador no necesita permisos asignados: los tiene todos.
 */
class RolesAndPermisosSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'Administrador' => 'Administra el sistema; tiene todos los permisos.',
            'Supervisor' => 'Supervisa cuadrillas y gestiona sus eventos.',
            'Trabajador' => 'Reporta eventos y consulta los propios.',
            'RRHH' => 'Consulta los catálogos de personal.',
        ];

        foreach ($roles as $nombre => $descripcion) {
            Rol::firstOrCreate(['nombre' => $nombre], ['descripcion' => $descripcion, 'estado' => Rol::ESTADO_ACTIVO]);
        }

        // Crea los permisos del catálogo y asigna los del Supervisor.
        Permisos::sincronizar();

        $rrhh = Rol::where('nombre', 'RRHH')->firstOrFail();
        $rrhh->permisos()->syncWithoutDetaching(
            Permiso::whereIn('nombre', [Permisos::CATALOGOS_VER])->pluck('id_permiso')->all()
        );
    }
}
