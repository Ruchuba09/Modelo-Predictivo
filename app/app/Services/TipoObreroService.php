<?php
namespace App\Services;

use App\DataTransferObjects\TipoObreroData;
use App\Models\tipo_obrero;
use Illuminate\Database\Eloquent\Collection;

class TipoObreroService
{
    public function listar(): Collection
    {
        return tipo_obrero::orderBy('nombre')->get();
    }

    public function crear(TipoObreroData $datos): tipo_obrero
    {
        return tipo_obrero::create($datos->toArray());
    }

    public function actualizar(tipo_obrero $tipoObrero, TipoObreroData $datos): tipo_obrero
    {
        $tipoObrero->update($datos->toArray());

        return $tipoObrero;
    }

    public function eliminar(tipo_obrero $tipoObrero): void
    {
        $tipoObrero->delete();
    }
}