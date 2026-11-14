<?php

namespace App\Services;

use App\DataTransferObjects\UsuarioData;
use App\Exceptions\UsuarioNoModificableException;
use App\Models\Rol;
use App\Models\Trabajador;
use App\Models\User;
use App\Support\Rut;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Cuentas de Usuario (RF-27 a RF-30). */
class UserService
{
    public const MENSAJE_ULTIMO_ADMIN_ROLES = 'No puedes quitar el rol Administrador al último administrador.';

    public const MENSAJE_ULTIMO_ADMIN_ELIMINAR = 'No puedes eliminar al último administrador.';

    public const MENSAJE_PROPIA_CUENTA = 'No puedes eliminar tu propia cuenta.';

    /**
     * RF-29.2: listado ordenado por correo; filtra por RUT, nombre o correo.
     * Incluye cuántos eventos registró cada usuario (RF-30.2).
     */
    public function listar(?string $busqueda = null): Collection
    {
        $busqueda = trim((string) $busqueda);
        $patron = '%'.addcslashes($busqueda, '%_\\').'%';
        $patronRut = '%'.addcslashes(str_replace('.', '', mb_strtoupper($busqueda)), '%_\\').'%';

        return User::query()
            ->with(['roles' => fn ($q) => $q->orderByRaw('LOWER(nombre)'), 'trabajador.persona'])
            ->withCount('eventosRegistrados')
            ->when($busqueda !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('email', 'ilike', $patron)
                ->orWhereHas('trabajador.persona', fn ($p) => $p
                    ->where('rut', 'ilike', $patronRut)
                    ->orWhereRaw("concat_ws(' ', nombre_1, nombre_2, apellido_1, apellido_2) ilike ?", [$patron])
                    ->orWhereRaw("concat_ws(' ', nombre_1, apellido_1) ilike ?", [$patron]))))
            ->orderByRaw('LOWER(email)')
            ->get();
    }

    /** RF-29.3: detalle con sus roles (y su estado) y la cantidad de eventos que registró. */
    public function obtenerConRoles(User $usuario): User
    {
        return $usuario
            ->load(['roles' => fn ($q) => $q->orderByRaw('LOWER(nombre)'), 'trabajador.persona'])
            ->loadCount('eventosRegistrados');
    }

    /** Roles que se pueden asignar: activos, más los que el usuario ya tiene (RF-27.2, RF-28.2). */
    public function rolesAsignables(?User $usuario = null): Collection
    {
        return Rol::query()
            ->where(fn ($q) => $q->where('estado', Rol::ESTADO_ACTIVO)
                ->when($usuario, fn ($w) => $w->orWhereIn('id_rol', $usuario->roles()->select('roles.id_rol'))))
            ->orderByRaw('LOWER(nombre)')
            ->get(['id_rol', 'nombre', 'descripcion', 'estado']);
    }

    /** RF-27.4: la cuenta y sus roles en una sola operación. */
    public function crear(UsuarioData $datos): User
    {
        return DB::transaction(function () use ($datos) {
            // El índice único de users.id_trabajador evita dos cuentas para el mismo trabajador.
            $trabajador = Trabajador::whereHas('persona', fn ($q) => $q->where('rut', Rut::clean((string) $datos->rut)))
                ->lockForUpdate()
                ->firstOrFail();

            $usuario = User::create([
                'id_trabajador' => $trabajador->id_trabajador,
                'email' => $datos->email,
                'password' => $datos->password,
            ]);
            $usuario->roles()->sync($datos->roles);

            return $usuario;
        });
    }

    /**
     * RF-28.4: reemplaza correo, contraseña (si se informa) y roles en una
     * sola operación. Si cambia la contraseña se revocan sus accesos de la
     * aplicación móvil; la sesión web la cierra el middleware auth.session.
     *
     * @throws UsuarioNoModificableException
     */
    public function actualizar(User $usuario, UsuarioData $datos): User
    {
        return DB::transaction(function () use ($usuario, $datos) {
            $this->bloquearAdministradores();

            if ($this->esAdministrador($usuario) && ! $this->incluyeAdministrador($datos->roles)) {
                $this->asegurarOtroAdministrador($usuario, self::MENSAJE_ULTIMO_ADMIN_ROLES, 'roles');
            }

            $usuario->email = $datos->email;
            if ($datos->password !== null) {
                $usuario->password = $datos->password;
                $usuario->setRememberToken(Str::random(60));
                $usuario->tokens()->delete();
            }
            $usuario->save();
            $usuario->roles()->sync($datos->roles);
            $usuario->olvidarPermisos();

            return $usuario;
        });
    }

    /**
     * RF-30.4: revoca sus accesos, desvincula sus roles y elimina la cuenta en
     * una sola operación. Los eventos que registró quedan sin autor.
     *
     * @throws UsuarioNoModificableException
     */
    public function eliminar(User $usuario, ?User $actor = null): void
    {
        if ($actor && $actor->is($usuario)) {
            throw new UsuarioNoModificableException(self::MENSAJE_PROPIA_CUENTA);
        }

        DB::transaction(function () use ($usuario) {
            $this->bloquearAdministradores();

            if ($this->esAdministrador($usuario)) {
                $this->asegurarOtroAdministrador($usuario, self::MENSAJE_ULTIMO_ADMIN_ELIMINAR);
            }

            $usuario->tokens()->delete();
            $usuario->roles()->detach();
            $usuario->delete();
        });
    }

    /** Ids de los roles que el sistema reconoce como Administrador (CA-2). */
    private function idsRolesAdministrador(): array
    {
        return Rol::all()->filter(fn (Rol $rol) => $rol->todos_los_permisos)->modelKeys();
    }

    /**
     * Serializa los cambios que pueden dejar al sistema sin administrador: dos
     * operaciones simultáneas sobre los dos últimos no pueden pasar a la vez.
     */
    private function bloquearAdministradores(): void
    {
        Rol::whereKey($this->idsRolesAdministrador())->lockForUpdate()->get();
    }

    private function esAdministrador(User $usuario): bool
    {
        return $usuario->rolesActivos()->whereIn('roles.id_rol', $this->idsRolesAdministrador())->exists();
    }

    private function incluyeAdministrador(array $idsRoles): bool
    {
        return Rol::whereKey(array_intersect($idsRoles, $this->idsRolesAdministrador()))
            ->where('estado', Rol::ESTADO_ACTIVO)
            ->exists();
    }

    /** @throws UsuarioNoModificableException si $usuario es el único administrador. */
    private function asegurarOtroAdministrador(User $usuario, string $mensaje, string $campo = 'general'): void
    {
        $hayOtro = User::whereKeyNot($usuario->getKey())
            ->whereHas('rolesActivos', fn ($q) => $q->whereIn('roles.id_rol', $this->idsRolesAdministrador()))
            ->exists();

        if (! $hayOtro) {
            throw new UsuarioNoModificableException($mensaje, $campo);
        }
    }
}
