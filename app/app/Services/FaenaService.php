<?php

namespace App\Services;

use App\DataTransferObjects\FaenaData;
use App\Models\Faena;
use App\Models\Proyecto;
use Illuminate\Database\Eloquent\Collection;

class FaenaService
{
    public function listar(): Collection
    {
        return Faena::withCount(['areas', 'proyectos'])
            ->orderBy('nombre')
            ->get();
    }

    public function crear(FaenaData $datos): Faena
    {
        return Faena::create($datos->toArray());
    }

    public function obtener(Faena $faena): Faena
    {
        return $faena->load(['areas', 'proyectos']);
    }

    public function obtenerParaEditar(Faena $faena): Faena
    {
        return $faena;
    }

    public function actualizar(
        Faena $faena,
        FaenaData $datos
    ): Faena {
        $faena->update($datos->toArray());

        return $faena->refresh();
    }

    public function tieneProyectos(Faena $faena): bool
    {
        return Proyecto::where(
            'id_faena',
            $faena->id_faena
        )->exists();
    }

    public function eliminar(Faena $faena): void
    {
        $faena->delete();
    }
}
