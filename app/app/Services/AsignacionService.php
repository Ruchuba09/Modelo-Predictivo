<?php

namespace App\Services;

use App\DataTransferObjects\AsignacionDTO;
use App\Models\Asignacion;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class AsignacionService
{
    private const RELACIONES = [
        'administrador.trabajador.persona',
        'proyecto',
        'cuadrilla',
    ];

    public function index(array $filtros): Collection
    {
        $query = Asignacion::with(self::RELACIONES);

        if (!empty($filtros['id_proyecto'])) {
            $query->where('id_proyecto', $filtros['id_proyecto']);
        }

        if (!empty($filtros['id_cuadrilla'])) {
            $query->where('id_cuadrilla', $filtros['id_cuadrilla']);
        }

        return $query->orderByDesc('fecha_inicio')->get();
    }

    public function store(
        AsignacionDTO $dto,
        int $idAdministrador
    ): Asignacion {
        $datos = $dto->toArray();
        $datos['id_administrador'] = $idAdministrador;

        $asignacion = Asignacion::create($datos);

        return $asignacion->load(self::RELACIONES);
    }

    public function show(Asignacion $asignacion): Asignacion
    {
        return $asignacion->load([
            'administrador.trabajador.persona',
            'proyecto',
            'cuadrilla.supervisor.trabajador.persona',
        ]);
    }

    public function update(
        Asignacion $asignacion,
        AsignacionDTO $dto
    ): Asignacion {
        $asignacion->update($dto->toArray());

        return $asignacion->fresh(self::RELACIONES);
    }

    public function destroy(Asignacion $asignacion): void
    {
        $asignacion->delete();
    }
}
