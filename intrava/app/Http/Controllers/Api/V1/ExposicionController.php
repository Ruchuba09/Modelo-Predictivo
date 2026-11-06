<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Horas-hombre y asistencia: permiten medir riesgo por hora trabajada y no solo contar eventos. */
class ExposicionController extends Controller
{
    public function horas(Request $request): JsonResponse
    {
        $datos = $request->validate(['id_proyecto' => ['required', 'integer', 'exists:proyectos,id_proyecto']]);

        return response()->json(
            DB::table('horas_hombre as h')
                ->leftJoin('cuadrillas as c', 'c.id_cuadrilla', '=', 'h.id_cuadrilla')
                ->where('h.id_proyecto', $datos['id_proyecto'])
                ->orderByDesc('h.fecha')
                ->limit(30)
                ->get(['h.id_horas', 'h.fecha', 'h.id_cuadrilla', 'c.numero_cuadrilla', 'h.n_trabajadores', 'h.horas_normales', 'h.horas_extra'])
        );
    }

    public function guardarHoras(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'id_proyecto' => ['required', 'integer', 'exists:proyectos,id_proyecto'],
            'id_cuadrilla' => ['required', 'integer', 'exists:cuadrillas,id_cuadrilla'],
            'fecha' => ['required', 'date', 'before_or_equal:today'],
            'n_trabajadores' => ['required', 'integer', 'min:0', 'max:5000'],
            'horas_normales' => ['required', 'numeric', 'min:0', 'max:99999'],
            'horas_extra' => ['required', 'numeric', 'min:0', 'max:99999'],
        ]);

        DB::table('horas_hombre')->updateOrInsert(
            ['id_proyecto' => $datos['id_proyecto'], 'id_cuadrilla' => $datos['id_cuadrilla'], 'fecha' => $datos['fecha']],
            [
                'n_trabajadores' => $datos['n_trabajadores'], 'horas_normales' => $datos['horas_normales'],
                'horas_extra' => $datos['horas_extra'], 'fuente' => 'manual',
            ],
        );

        return response()->json(['guardado' => true], 201);
    }

    public function asistencia(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'id_proyecto' => ['required', 'integer', 'exists:proyectos,id_proyecto'],
            'id_cuadrilla' => ['required', 'integer', 'exists:cuadrillas,id_cuadrilla'],
            'fecha' => ['required', 'date'],
        ]);

        return response()->json(
            DB::table('obreros as o')
                ->join('trabajadores as t', 't.id_trabajador', '=', 'o.id_trabajador')
                ->join('personas as p', 'p.id_persona', '=', 't.id_persona')
                ->leftJoin('asistencia_diaria as a', function ($join) use ($datos) {
                    $join->on('a.id_trabajador', '=', 'o.id_trabajador')
                        ->where('a.id_proyecto', $datos['id_proyecto'])
                        ->where('a.fecha', $datos['fecha']);
                })
                ->where('o.id_cuadrilla', $datos['id_cuadrilla'])
                ->orderBy('p.apellido_1')
                ->get(['o.id_trabajador', DB::raw("p.nombre_1 || ' ' || p.apellido_1 AS nombre"), 't.cargo', 'a.horas_normales', 'a.horas_extra', 'a.ausente', 'a.tipo_ausencia'])
        );
    }

    public function guardarAsistencia(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'id_proyecto' => ['required', 'integer', 'exists:proyectos,id_proyecto'],
            'fecha' => ['required', 'date', 'before_or_equal:today'],
            'registros' => ['required', 'array', 'min:1'],
            'registros.*.id_trabajador' => ['required', 'integer', 'exists:trabajadores,id_trabajador'],
            'registros.*.horas_normales' => ['required', 'numeric', 'min:0', 'max:24'],
            'registros.*.horas_extra' => ['required', 'numeric', 'min:0', 'max:24'],
            'registros.*.ausente' => ['required', 'boolean'],
            'registros.*.tipo_ausencia' => ['nullable', 'in:falta,permiso,licencia,vacaciones,otro'],
        ]);

        DB::transaction(function () use ($datos) {
            foreach ($datos['registros'] as $registro) {
                DB::table('asistencia_diaria')->updateOrInsert(
                    ['id_trabajador' => $registro['id_trabajador'], 'id_proyecto' => $datos['id_proyecto'], 'fecha' => $datos['fecha']],
                    [
                        'horas_normales' => $registro['ausente'] ? 0 : $registro['horas_normales'],
                        'horas_extra' => $registro['ausente'] ? 0 : $registro['horas_extra'],
                        'ausente' => $registro['ausente'],
                        'tipo_ausencia' => $registro['ausente'] ? ($registro['tipo_ausencia'] ?? 'falta') : null,
                    ],
                );
            }
        });

        return response()->json(['guardados' => count($datos['registros'])], 201);
    }
}
