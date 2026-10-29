<?php

namespace App\Services;

use App\DataTransferObjects\UsuarioData;
use App\Models\User;
use App\Models\Trabajador;
use Illuminate\Database\Eloquent\Collection;

class UserService
{
    public function listarConRoles(): Collection
    {
        return User::with(['roles', 'trabajador.persona'])->latest()->get();
    }

    public function obtenerConRoles(User $usuario): User
    {
        return $usuario->load(['roles', 'trabajador.persona']);
    }

    public function crear(UsuarioData $datos): User
    {
        $trabajador = Trabajador::whereHas('persona', fn ($query) => $query->where('rut', $datos->rut))->firstOrFail();
        if (User::where('id_trabajador', $trabajador->id_trabajador)->exists()) {
            throw \Illuminate\Validation\ValidationException::withMessages(['rut' => 'Este trabajador ya tiene una cuenta.']);
        }

        $usuario = User::create([
            'id_trabajador' => $trabajador->id_trabajador,
            'email' => $datos->email,
            'password' => $datos->password,
        ]);

        $usuario->roles()->sync($datos->roles);

        return $usuario;
    }

    public function actualizar(User $usuario, UsuarioData $datos): User
    {
        $trabajador = Trabajador::whereHas('persona', fn ($query) => $query->where('rut', $datos->rut))->firstOrFail();
        if (User::where('id_trabajador', $trabajador->id_trabajador)->where('id_user', '!=', $usuario->id_user)->exists()) {
            throw \Illuminate\Validation\ValidationException::withMessages(['rut' => 'Este trabajador ya tiene una cuenta.']);
        }
        $usuario->id_trabajador = $trabajador->id_trabajador;
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
