<?php

namespace App\Http\Services;

use App\DataTransferObjects\ProyectoData;
use App\Models\Proyecto;
use Illuminate\Database\Eloquent\Collection;

class ProyectoService
{
    private const RELACIONES = ['faena', 'cliente'];

    public function listarConRelaciones(): Collection
    {
        return Proyecto::with(self::RELACIONES)
            ->orderBy('id_proyecto', 'desc')
            ->get();
    }

    public function obtenerConRelaciones(Proyecto $proyecto): Proyecto
    {
        return $proyecto->load(self::RELACIONES);
    }

    public function crear(ProyectoData $datos): Proyecto
    {
        $proyecto = Proyecto::create($datos->toArray());

        return $proyecto->load(self::RELACIONES);
    }

    public function actualizar(Proyecto $proyecto, ProyectoData $datos): Proyecto
    {
        $proyecto->update($datos->toArray());

        return $proyecto->load(self::RELACIONES);
    }

    public function eliminar(Proyecto $proyecto): void
    {
        $proyecto->delete();
    }
}