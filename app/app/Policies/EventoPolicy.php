<?php

namespace App\Policies;

use App\Models\Evento;
use App\Models\User;
use App\Support\Permisos;
use Illuminate\Auth\Access\Response;

/**
 * Reglas de acceso a eventos. Se aplica igual en las rutas web y en la API v1.
 * Lo deciden los permisos (CA-1); el autor siempre ve lo suyo.
 */
class EventoPolicy
{
    /** Listado general (no "mis reportes"). */
    public function viewAny(User $user): bool
    {
        return $user->tienePermiso(Permisos::EVENTOS_VER);
    }

    public function view(User $user, Evento $evento): Response
    {
        return $this->decidir(
            $this->puedeVer($user, $evento),
            'No tiene permiso para ver este evento.'
        );
    }

    public function create(User $user): bool
    {
        return true;
    }

    /** Con eventos.editar siempre; el autor solo mientras el evento siga abierto. */
    public function update(User $user, Evento $evento): Response
    {
        $idTrabajador = $this->idTrabajador($user);
        $esPropio = $this->esAutor($user, $evento)
            || ($idTrabajador && (int) $evento->id_trabajador === $idTrabajador);

        return $this->decidir(
            $user->tienePermiso(Permisos::EVENTOS_EDITAR)
                || ($esPropio && $evento->estado?->editablePorAutor()),
            'No tienes permiso para editar este reporte.'
        );
    }

    public function tomar(User $user, Evento $evento): Response
    {
        return $this->decidir(
            $user->tienePermiso(Permisos::EVENTOS_TOMAR),
            'No tienes permiso para tomar este reporte.'
        );
    }

    public function cerrar(User $user, Evento $evento): Response
    {
        return $this->decidir(
            $user->tienePermiso(Permisos::EVENTOS_CERRAR),
            'No tienes permiso para cerrar este reporte.'
        );
    }

    public function delete(User $user, Evento $evento): Response
    {
        return $this->decidir(
            $user->tienePermiso(Permisos::EVENTOS_ELIMINAR),
            'No tienes permiso para eliminar este reporte.'
        );
    }

    private function puedeVer(User $user, Evento $evento): bool
    {
        if ($user->tienePermiso(Permisos::EVENTOS_VER_TODOS) || $this->esAutor($user, $evento)) {
            return true;
        }

        $idTrabajador = $this->idTrabajador($user);
        if (! $idTrabajador) {
            return false;
        }

        if ((int) $evento->id_trabajador === $idTrabajador) {
            return true;
        }

        return $user->tienePermiso(Permisos::EVENTOS_VER) && $this->supervisaEvento($evento, $idTrabajador);
    }

    private function decidir(bool $permitido, string $mensaje): Response
    {
        return $permitido ? Response::allow() : Response::deny($mensaje);
    }

    private function esAutor(User $user, Evento $evento): bool
    {
        return $evento->id_autor !== null && (int) $evento->id_autor === (int) $user->id_user;
    }

    private function idTrabajador(User $user): ?int
    {
        $id = $user->trabajador?->id_trabajador;

        return $id ? (int) $id : null;
    }

    /** El supervisor está asignado al evento o supervisa la cuadrilla actual del autor. */
    private function supervisaEvento(Evento $evento, int $idSupervisor): bool
    {
        if ((int) $evento->id_supervisor === $idSupervisor) {
            return true;
        }

        $cuadrilla = $evento->trabajador?->cuadrillaActual();

        return $cuadrilla && (int) $cuadrilla->id_supervisor === $idSupervisor;
    }
}
