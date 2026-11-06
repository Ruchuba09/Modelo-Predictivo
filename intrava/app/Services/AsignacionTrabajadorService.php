<?php

namespace App\Services;

use App\Models\Actividad;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Regla de negocio: un trabajador tiene una sola actividad activa, hasta completarla o ser desasignado. */
class AsignacionTrabajadorService
{
    public function listar(Actividad $actividad): Collection
    {
        $idCuadrilla = $actividad->asignacion?->id_cuadrilla;

        return DB::table('obreros as o')
            ->join('trabajadores as t', 't.id_trabajador', '=', 'o.id_trabajador')
            ->join('personas as p', 'p.id_persona', '=', 't.id_persona')
            ->leftJoin('actividad_trabajador as at', function ($join) {
                $join->on('at.id_trabajador', '=', 'o.id_trabajador')->whereNull('at.fecha_fin');
            })
            ->leftJoin('actividades as otra', 'otra.id_actividad', '=', 'at.id_actividad')
            ->where('o.id_cuadrilla', $idCuadrilla)
            ->orderBy('p.apellido_1')
            ->get(['o.id_trabajador', 'p.nombre_1', 'p.apellido_1', 't.cargo', 'at.id_actividad', 'otra.nombre as actividad'])
            ->map(fn ($fila) => [
                'id_trabajador' => $fila->id_trabajador,
                'nombre' => trim("{$fila->nombre_1} {$fila->apellido_1}"),
                'cargo' => $fila->cargo,
                'id_actividad_actual' => $fila->id_actividad,
                'actividad_actual' => $fila->actividad,
            ]);
    }

    public function asignar(Actividad $actividad, int $idTrabajador, ?int $idAsignadoPor): void
    {
        $idCuadrilla = $actividad->asignacion?->id_cuadrilla;
        $enCuadrilla = DB::table('obreros')->where('id_trabajador', $idTrabajador)->where('id_cuadrilla', $idCuadrilla)->exists();
        if (! $enCuadrilla) {
            throw ValidationException::withMessages(['id_trabajador' => 'El trabajador no integra la cuadrilla de esta actividad.']);
        }

        $actual = DB::table('actividad_trabajador')->where('id_trabajador', $idTrabajador)->whereNull('fecha_fin')->first();
        if ($actual) {
            throw ValidationException::withMessages([
                'id_trabajador' => 'El trabajador ya tiene una actividad activa. Debe completarse o desasignarse primero.',
            ]);
        }

        DB::table('actividad_trabajador')->insert([
            'id_actividad' => $actividad->id_actividad,
            'id_trabajador' => $idTrabajador,
            'id_asignado_por' => $idAsignadoPor,
            'fecha_inicio' => now(),
        ]);
    }

    public function desasignar(Actividad $actividad, int $idTrabajador): void
    {
        DB::table('actividad_trabajador')
            ->where('id_actividad', $actividad->id_actividad)
            ->where('id_trabajador', $idTrabajador)
            ->whereNull('fecha_fin')
            ->update(['fecha_fin' => now(), 'motivo_fin' => 'desasignada']);
    }

    public function finalizarTodos(Actividad $actividad, string $motivo): void
    {
        DB::table('actividad_trabajador')
            ->where('id_actividad', $actividad->id_actividad)
            ->whereNull('fecha_fin')
            ->update(['fecha_fin' => now(), 'motivo_fin' => $motivo]);
    }
}
