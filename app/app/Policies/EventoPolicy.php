<?php

namespace App\Policies;

use App\Models\Evento;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Reglas de acceso a eventos. Se aplica igual en las rutas web y en la API v1.
 */
class EventoPolicy
{
    /** Listado general (no "mis reportes"). */
    public function viewAny(User $user): bool
    {
        return $user->tieneRol('Administrador', 'Supervisor');
    }

    public function view(User $user, Evento $evento): Response
    {
        return $this->decidir(
            $this->puedeVer($user, $evento),
            'No tienes permisos para ver este reporte.'
        );
    }

    public function create(User $user): bool
    {
        return true;
    }

    /** El administrador siempre; el autor solo mientras el evento siga abierto. */
    public function update(User $user, Evento $evento): Response
    {
        $idTrabajador = $this->idTrabajador($user);

        return $this->decidir(
            $user->tieneRol('Administrador')
                || ($idTrabajador
                    && (int) $evento->id_trabajador === $idTrabajador
                    && $evento->estado?->editablePorAutor()),
            'No tienes permiso para editar este reporte.'
        );
    }

    public function tomar(User $user, Evento $evento): Response
    {
        return $this->decidir(
            $user->tieneRol('Supervisor'),
            'Solo un supervisor puede tomar un reporte.'
        );
    }

    public function cerrar(User $user, Evento $evento): Response
    {
        return $this->decidir(
            $user->tieneRol('Administrador'),
            'Solo un administrador puede cerrar un reporte.'
        );
    }

    public function delete(User $user, Evento $evento): Response
    {
        return $this->decidir(
            $user->tieneRol('Administrador'),
            'Solo un administrador puede eliminar reportes.'
        );
    }

    private function puedeVer(User $user, Evento $evento): bool
    {
        if ($user->tieneRol('Administrador')) {
            return true;
        }

        $idTrabajador = $this->idTrabajador($user);
        if (! $idTrabajador) {
            return false;
        }

        if ((int) $evento->id_trabajador === $idTrabajador) {
            return true;
        }

        return $user->tieneRol('Supervisor') && $this->supervisaEvento($evento, $idTrabajador);
    }

    private function decidir(bool $permitido, string $mensaje): Response
    {
        return $permitido ? Response::allow() : Response::deny($mensaje);
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
