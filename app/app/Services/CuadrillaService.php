<?php

namespace App\Services;

use App\DataTransferObjects\CuadrillaDTO;
use App\Models\Cuadrilla;
use App\Models\Supervisor;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CuadrillaService
{
    public function index(): Collection
    {
        return Cuadrilla::with('supervisor.trabajador.persona')
            ->orderBy('numero_cuadrilla')
            ->get();
    }

    public function store(CuadrillaDTO $dto): Cuadrilla
    {
        return DB::transaction(function () use ($dto) {
            $cuadrilla = Cuadrilla::create($dto->toArray());

            return $cuadrilla->load('supervisor.trabajador.persona');
        });
    }

    public function show(Cuadrilla $cuadrilla): Cuadrilla
    {
        return $cuadrilla->load([
            'supervisor.trabajador.persona',
            'obreros.trabajador.persona',
        ]);
    }

    public function update(
        Cuadrilla $cuadrilla,
        CuadrillaDTO $dto
    ): Cuadrilla {
        return DB::transaction(function () use ($cuadrilla, $dto) {
            $cuadrilla->update($dto->toArray());

            return $cuadrilla->fresh('supervisor.trabajador.persona');
        });
    }

    public function destroy(Cuadrilla $cuadrilla): void
    {
        if ($cuadrilla->trabajadores()->exists()) {
            throw ValidationException::withMessages([
                'cuadrilla' => 'No se puede eliminar: la cuadrilla tiene trabajadores asignados o historial de membresías.',
            ]);
        }

        if ($cuadrilla->asignaciones()->exists()) {
            throw ValidationException::withMessages([
                'cuadrilla' => 'No se puede eliminar: la cuadrilla tiene asignaciones registradas.',
            ]);
        }

        $cuadrilla->delete();
    }

    public function supervisores(): \Illuminate\Support\Collection
    {
        return Supervisor::with('trabajador.persona')
            ->whereHas('trabajador', fn ($query) => $query->where('estado', 'activo'))
            ->get()
            ->map(fn (Supervisor $supervisor) => [
                'id_trabajador' => $supervisor->id_trabajador,
                'nombre' => trim(
                    ($supervisor->trabajador?->persona?->nombre_1 ?? '') . ' ' .
                    ($supervisor->trabajador?->persona?->apellido_1 ?? '')
                ),
            ])
            ->values();
    }
}
