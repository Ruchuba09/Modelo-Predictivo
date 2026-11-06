<?php

namespace App\Services;

use App\DataTransferObjects\CuadrillaDTO;
use App\Models\Cuadrilla;
use App\Models\JefeZona;
use App\Models\Obrero;
use App\Models\Supervisor;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CuadrillaService
{
    public function index(): Collection
    {
        return Cuadrilla::with(['supervisor.trabajador.persona', 'jefeZona.trabajador.persona'])
            ->withCount('integrantes')
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
        if ($cuadrilla->integrantes()->exists()) {
            throw ValidationException::withMessages([
                'cuadrilla' => 'No se puede eliminar: la cuadrilla tiene trabajadores asignados o historial de membresías.',
            ]);
        }

        if ($cuadrilla->asignaciones()->exists()) {
            throw ValidationException::withMessages([
                'cuadrilla' => 'No se puede eliminar: la cuadrilla tiene asignaciones registradas.',
            ]);
        }

        DB::transaction(function () use ($cuadrilla) {
            DB::table('trabajadores_cuadrillas')->where('id_cuadrilla', $cuadrilla->id_cuadrilla)->delete();
            $cuadrilla->delete();
        });
    }

    public function jefesZona(): \Illuminate\Support\Collection
    {
        return JefeZona::with('trabajador.persona')->get()->map(fn (JefeZona $jefe) => [
            'id_trabajador' => $jefe->id_trabajador,
            'nombre' => trim(($jefe->trabajador?->persona?->nombre_1 ?? '').' '.($jefe->trabajador?->persona?->apellido_1 ?? '')),
        ])->values();
    }

    /** Obreros disponibles e indicación de cuáles integran esta cuadrilla. */
    public function miembros(Cuadrilla $cuadrilla): \Illuminate\Support\Collection
    {
        return Obrero::with('trabajador.persona')->get()
            ->map(fn (Obrero $obrero) => [
                'id_trabajador' => $obrero->id_trabajador,
                'nombre' => trim(($obrero->trabajador?->persona?->nombre_1 ?? '').' '.($obrero->trabajador?->persona?->apellido_1 ?? '')),
                'cargo' => $obrero->trabajador?->cargo,
                'id_cuadrilla' => $obrero->id_cuadrilla,
                'integra' => (int) $obrero->id_cuadrilla === (int) $cuadrilla->id_cuadrilla,
            ])
            ->sortBy('nombre')
            ->values();
    }

    public function sincronizarMiembros(Cuadrilla $cuadrilla, array $idsTrabajadores): void
    {
        DB::transaction(function () use ($cuadrilla, $idsTrabajadores) {
            Obrero::where('id_cuadrilla', $cuadrilla->id_cuadrilla)
                ->whereNotIn('id_trabajador', $idsTrabajadores)
                ->get()
                ->each(fn (Obrero $obrero) => $obrero->update(['id_cuadrilla' => null]));
            Obrero::whereIn('id_trabajador', $idsTrabajadores)
                ->get()
                ->each(fn (Obrero $obrero) => $obrero->update(['id_cuadrilla' => $cuadrilla->id_cuadrilla]));
        });
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
