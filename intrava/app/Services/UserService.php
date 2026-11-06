<?php

namespace App\Services;

use App\DataTransferObjects\UsuarioData;
use App\Models\Rol;
use App\Models\Trabajador;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserService
{
    /** Nombres (en minúsculas) que el sistema trata como rol de administrador. */
    private const ROLES_ADMIN = ['admin', 'administrador'];

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
        return (new User)->getConnection()->transaction(function () use ($datos) {
            $trabajador = $this->trabajadorPorRut($datos->rut);

            if (User::where('id_trabajador', $trabajador->id_trabajador)->exists()) {
                throw ValidationException::withMessages(['rut' => 'Este trabajador ya tiene una cuenta.']);
            }

            $usuario = User::create([
                'id_trabajador' => $trabajador->id_trabajador,
                'email' => $datos->email,
                'password' => $datos->password,
            ]);

            $usuario->roles()->sync($datos->roles);

            return $usuario;
        });
    }

    public function actualizar(User $usuario, UsuarioData $datos): User
    {
        return $usuario->getConnection()->transaction(function () use ($usuario, $datos) {
            $trabajador = $this->trabajadorPorRut($datos->rut);

            $duplicado = User::where('id_trabajador', $trabajador->id_trabajador)
                ->whereKeyNot($usuario->getKey())
                ->exists();
            if ($duplicado) {
                throw ValidationException::withMessages(['rut' => 'Este trabajador ya tiene una cuenta.']);
            }

            if ($this->esAdministrador($usuario) && ! $this->incluyeRolAdmin($datos->roles)) {
                $this->asegurarOtroAdministrador($usuario, 'roles', 'No puedes quitar el rol de administrador al último administrador.');
            }

            $usuario->id_trabajador = $trabajador->id_trabajador;
            $usuario->email = $datos->email;

            if (! empty($datos->password)) {
                $usuario->password = $datos->password;
            }

            $usuario->save();
            $usuario->roles()->sync($datos->roles);

            return $usuario;
        });
    }

    /**
     * @param  User|null  $actor  Usuario que pide el borrado (no puede borrarse a sí mismo).
     */
    public function eliminar(User $usuario, ?User $actor = null): void
    {
        if ($actor && $actor->is($usuario)) {
            throw ValidationException::withMessages(['usuario' => 'No puedes eliminar tu propia cuenta.']);
        }

        $usuario->getConnection()->transaction(function () use ($usuario) {
            if ($this->esAdministrador($usuario)) {
                $this->asegurarOtroAdministrador($usuario, 'usuario', 'No puedes eliminar al último administrador.');
            }

            $usuario->roles()->detach();
            $usuario->delete();
        });
    }

    private function trabajadorPorRut(string $rut): Trabajador
    {
        return Trabajador::whereHas('persona', fn ($query) => $query->where('rut', $rut))->firstOrFail();
    }

    private function esAdministrador(User $usuario): bool
    {
        return $usuario->tieneRol(...self::ROLES_ADMIN);
    }

    private function incluyeRolAdmin(array $idsRoles): bool
    {
        return Rol::whereIn('id_rol', $idsRoles)
            ->where('estado', 'activo')
            ->pluck('nombre')
            ->contains(fn (string $nombre) => in_array(mb_strtolower(trim($nombre)), self::ROLES_ADMIN, true));
    }

    /** Lanza un error de validación si $usuario es el único administrador activo. */
    private function asegurarOtroAdministrador(User $usuario, string $campo, string $mensaje): void
    {
        $hayOtro = User::whereKeyNot($usuario->getKey())
            ->whereHas('rolesActivos', fn ($q) => $q->whereIn(
                DB::raw('lower(trim(roles.nombre))'),
                self::ROLES_ADMIN
            ))
            ->exists();

        if (! $hayOtro) {
            throw ValidationException::withMessages([$campo => $mensaje]);
        }
    }
}
