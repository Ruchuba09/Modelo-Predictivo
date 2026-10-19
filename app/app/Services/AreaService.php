<?php

namespace App\Services;

use App\DTOs\AreaDTO;
use App\Models\Area;
use App\Models\Evento;
use App\Models\Faena;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AreaService
{
    public function index(?int $idFaena = null): Collection
    {
        $query = Area::with('faena');

        if ($idFaena !== null) {
            $query->where('id_faena', $idFaena);
        }

        return $query->orderBy('codigo_area')->get();
    }

    public function faenas(): Collection
    {
        return Faena::orderBy('nombre')->get();
    }

    public function store(AreaDTO $dto): Area
    {
        return DB::transaction(function () use ($dto) {
            return Area::create($dto->toArray());
        });
    }

    public function show(Area $area): Area
    {
        return $area->load('faena');
    }

    public function update(Area $area, AreaDTO $dto): Area
    {
        return DB::transaction(function () use ($area, $dto) {
            $area->update($dto->toArray());

            return $area->fresh('faena');
        });
    }

    public function tieneEventos(Area $area): bool
    {
        return Evento::where('id_area', $area->id_area)->exists();
    }

    public function destroy(Area $area): void
    {
        $area->delete();
    }
}