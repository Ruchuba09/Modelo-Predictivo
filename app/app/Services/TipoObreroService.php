<?php
namespace App\Services;

use App\DataTransferObjects\TipoObreroData;
use App\Models\TipoObrero;
use Illuminate\Database\Eloquent\Collection;

class TipoObreroService
{
    public function listar(): Collection
    {
        return TipoObrero::orderBy('nombre')->get();
    }

    public function crear(TipoObreroData $datos): TipoObrero
    {
        return TipoObrero::create($datos->toArray());
    }

    public function actualizar(TipoObrero $tipoObrero, TipoObreroData $datos): TipoObrero
    {
        $tipoObrero->update($datos->toArray());

        return $tipoObrero;
    }

    public function eliminar(TipoObrero $tipoObrero): void
    {
        $tipoObrero->delete();
    }
}