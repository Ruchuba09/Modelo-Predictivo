<?php

namespace App\Policies;

use App\Models\SituacionCritica;
use App\Models\User;
use App\Support\Permisos;
use Illuminate\Auth\Access\Response;

/**
 * Acceso a Situaciones Críticas (RF-14 a RF-16). Se aplica igual en web y API.
 * Lo deciden los permisos (CA-1); por defecto el Administrador los tiene
 * todos y el Supervisor tiene situaciones.ver.
 */
class SituacionCriticaPolicy
{
    private const SIN_PERMISO = 'No tiene permiso para ver esta información.';

    /** RF-16.1: quien tenga situaciones.ver o situaciones.ver-todas. */
    public function viewAny(User $user): Response
    {
        return $user->tienePermiso(Permisos::SITUACIONES_VER, Permisos::SITUACIONES_VER_TODAS)
            ? Response::allow()
            : Response::deny(self::SIN_PERMISO);
    }

    /** RF-16.1: con situaciones.ver-todas, todas; con situaciones.ver, solo aquellas en que figura como supervisor. */
    public function view(User $user, SituacionCritica $situacion): Response
    {
        $permitido = $user->tienePermiso(Permisos::SITUACIONES_VER_TODAS)
            || ($user->tienePermiso(Permisos::SITUACIONES_VER)
                && $user->trabajador
                && (int) $situacion->id_supervisor === (int) $user->trabajador->id_trabajador);

        return $permitido ? Response::allow() : Response::deny(self::SIN_PERMISO);
    }

    /** RF-14.2: registro manual. */
    public function create(User $user): bool
    {
        return $user->tienePermiso(Permisos::SITUACIONES_GESTIONAR);
    }

    /** RF-15.2: edición manual. */
    public function update(User $user, SituacionCritica $situacion): bool
    {
        return $user->tienePermiso(Permisos::SITUACIONES_GESTIONAR);
    }

    /** RF-15.6: no se eliminan manualmente; solo junto con su Tarjeta PARE. */
    public function delete(User $user, SituacionCritica $situacion): bool
    {
        return false;
    }
}
