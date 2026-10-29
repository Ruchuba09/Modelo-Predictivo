<?php

namespace Database\Seeders;

use App\Models\Permiso;
use App\Models\Rol;
use Illuminate\Database\Seeder;

class RolesAndPermisosSeeder extends Seeder
{
    public function run(): void
    {
        // Permisos base
        $permisos = [
            'usuarios.ver',
            'usuarios.crear',
            'usuarios.editar',
            'usuarios.eliminar',
            'roles.gestionar',
        ];

        foreach ($permisos as $nombre) {
            Permiso::firstOrCreate(['nombre' => $nombre]);
        }

        // Roles base
        $admin = Rol::firstOrCreate(['nombre' => 'admin']);
        $usuario = Rol::firstOrCreate(['nombre' => 'usuario']);

        // El admin tiene todos los permisos
        $admin->permisos()->sync(Permiso::pluck('permission_id'));

        // El usuario normal solo puede ver
        $usuario->permisos()->sync(
            Permiso::where('nombre', 'usuarios.ver')->pluck('permission_id')
        );
    }
}