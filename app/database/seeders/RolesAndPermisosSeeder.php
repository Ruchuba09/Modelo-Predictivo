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
            'eventos.ver', 'eventos.crear', 'eventos.editar', 'eventos.eliminar',
            'eventos.tomar', 'eventos.cerrar', 'eventos.mis-reportes', 'eventos.estadisticas',
            'proyectos.ver', 'proyectos.crear', 'proyectos.editar', 'proyectos.eliminar',
            'cuadrillas.ver', 'cuadrillas.crear', 'cuadrillas.editar', 'cuadrillas.eliminar',
            'trabajadores.ver', 'trabajadores.crear', 'trabajadores.editar', 'trabajadores.eliminar',
        ];

        foreach ($permisos as $nombre) {
            Permiso::firstOrCreate(['nombre' => $nombre]);
        }

        // Roles base
        $admin = Rol::updateOrCreate(['nombre' => 'admin'], ['estado' => 'activo']);
        $supervisor = Rol::updateOrCreate(['nombre' => 'supervisor'], ['estado' => 'activo']);
        $usuario = Rol::updateOrCreate(['nombre' => 'usuario'], ['estado' => 'activo']);
        $rrhh = Rol::updateOrCreate(['nombre' => 'rrhh'], ['estado' => 'activo']);

        // El admin tiene todos los permisos
        $admin->permisos()->sync(Permiso::pluck('id_permiso'));

        $porNombre = Permiso::pluck('id_permiso', 'nombre');
        $supervisor->permisos()->sync(collect([
            'eventos.ver', 'eventos.tomar', 'eventos.mis-reportes',
            'eventos.estadisticas', 'cuadrillas.ver', 'trabajadores.ver',
            'proyectos.ver',
        ])->map(fn ($nombre) => $porNombre[$nombre])->all());
        $usuario->permisos()->sync(collect([
            'eventos.crear', 'eventos.mis-reportes',
        ])->map(fn ($nombre) => $porNombre[$nombre])->all());
        $rrhh->permisos()->sync(collect([
            'trabajadores.ver', 'trabajadores.crear', 'trabajadores.editar',
        ])->map(fn ($nombre) => $porNombre[$nombre])->all());
    }
}
