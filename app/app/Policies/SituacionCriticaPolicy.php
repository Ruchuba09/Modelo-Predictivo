<?php

namespace App\Policies;

use App\Models\SituacionCritica;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Acceso a Situaciones Críticas (RF-14 a RF-16). Se aplica igual en web y API.
 */
class SituacionCriticaPolicy
{
    private const SIN_PERMISO = 'No tiene permiso para ver esta información.';

    /** RF-16.1: Administrador y Supervisor. */
    public function viewAny(User $user): Response
    {
        return $user->tieneRol('Administrador', 'Supervisor')
            ? Response::allow()
            : Response::deny(self::SIN_PERMISO);
    }

    /** RF-16.1: el Administrador ve todas; el Supervisor solo aquellas en que figura como supervisor. */
    public function view(User $user, SituacionCritica $situacion): Response
    {
        $permitido = $user->tieneRol('Administrador')
            || ($user->tieneRol('Supervisor')
                && $user->trabajador
                && (int) $situacion->id_supervisor === (int) $user->trabajador->id_trabajador);

        return $permitido ? Response::allow() : Response::deny(self::SIN_PERMISO);
    }

    /** RF-14.2: registro manual. */
    public function create(User $user): bool
    {
        return $user->tieneRol('Administrador');
    }

    /** RF-15.2: edición manual. */
    public function update(User $user, SituacionCritica $situacion): bool
    {
        return $user->tieneRol('Administrador');
    }

    /** RF-15.6: no se eliminan manualmente; solo junto con su Tarjeta PARE. */
    public function delete(User $user, SituacionCritica $situacion): bool
    {
        return false;
    }
}
