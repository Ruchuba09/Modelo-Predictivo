<?php

namespace App\Http\Services;

use App\DataTransferObjects\UsuarioData;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class UserService
{
    public function listarConRoles(): Collection
    {
        return User::with('roles')->latest()->get();
    }

    public function obtenerConRoles(User $usuario): User
    {
        return $usuario->load('roles');
    }

    public function crear(UsuarioData $datos): User
    {
        $usuario = User::create([
            'rut' => $datos->rut,
            'email' => $datos->email,
            'password' => $datos->password,
        ]);

        $usuario->roles()->sync($datos->roles);

        return $usuario;
    }

    public function actualizar(User $usuario, UsuarioData $datos): User
    {
        $usuario->rut = $datos->rut;
        $usuario->email = $datos->email;

        if (!empty($datos->password)) {
            $usuario->password = $datos->password;
        }

        $usuario->save();
        $usuario->roles()->sync($datos->roles);

        return $usuario;
    }

    public function eliminar(User $usuario): void
    {
        $usuario->roles()->detach();
        $usuario->delete();
    }
}