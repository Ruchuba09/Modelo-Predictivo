<?php

namespace App\Services;

use App\DataTransferObjects\ActividadData;
use App\Models\Actividad;
use Illuminate\Database\Eloquent\Collection;

class ActividadService
{
    public function listar(?int $idAsignacion = null): Collection
    {
        return Actividad::with('asignacion.proyecto')
            ->when($idAsignacion, fn ($query) => $query->where('id_asignacion', $idAsignacion))
            ->orderBy('fecha_inicio')
            ->orderBy('id_actividad')
            ->get();
    }

    public function obtener(Actividad $actividad): Actividad
    {
        return $actividad->load('asignacion.proyecto');
    }

    public function crear(ActividadData $datos): Actividad
    {
        return Actividad::create($datos->toArray())->load('asignacion.proyecto');
    }

    public function actualizar(Actividad $actividad, ActividadData $datos): Actividad
    {
        $actividad->update($datos->toArray());

        return $actividad->fresh('asignacion.proyecto');
    }

    public function eliminar(Actividad $actividad): void
    {
        $actividad->delete();
    }
}
