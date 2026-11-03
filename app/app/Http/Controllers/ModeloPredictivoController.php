<?php

namespace App\Http\Controllers;

use App\Models\Proyecto;
use App\Models\Trabajador;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ModeloPredictivoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'tipo_objetivo' => ['sometimes', 'string', 'max:100'],
            'horizonte' => ['sometimes', 'integer', 'between:1,52'],
            'id_proyecto' => ['sometimes', 'integer', 'min:1'],
        ]);

        $parametros = [
            'tipo_objetivo' => $filtros['tipo_objetivo'] ?? 'todos',
            'horizonte' => $filtros['horizonte'] ?? 4,
        ];
        if (isset($filtros['id_proyecto'])) {
            $parametros['id_proyecto'] = $filtros['id_proyecto'];
        }

        return $this->solicitarModelo('/predicciones', $parametros);
    }

    public function tipos(): JsonResponse
    {
        return $this->solicitarModelo('/tipos');
    }

    public function show(Request $request, Proyecto $proyecto): JsonResponse
    {
        $filtros = $request->validate([
            'tipo_objetivo' => ['sometimes', 'string', 'max:100'],
            'horizonte' => ['sometimes', 'integer', 'between:1,52'],
        ]);

        return $this->solicitarModelo('/predicciones', [
            'id_proyecto' => $proyecto->getKey(),
            'tipo_objetivo' => $filtros['tipo_objetivo'] ?? 'todos',
            'horizonte' => $filtros['horizonte'] ?? 4,
        ]);
    }

    private function solicitarModelo(string $ruta, array $parametros = []): JsonResponse
    {
        try {
            $response = Http::acceptJson()
                ->timeout((int) config('services.predictive_model.timeout', 180))
                ->get(rtrim((string) config('services.predictive_model.url'), '/') . $ruta, $parametros);
        } catch (ConnectionException) {
            return response()->json([
                'message' => 'El servicio del modelo predictivo no está disponible.',
            ], 503);
        }

        $datos = $response->json();
        if ($response->successful() && is_array($datos) && isset($datos['predicciones']) && is_array($datos['predicciones'])) {
            $ids = collect($datos['predicciones'])
                ->pluck('id_proyecto')
                ->filter()
                ->unique()
                ->values();
            $proyectos = Proyecto::query()
                ->whereIn((new Proyecto())->getKeyName(), $ids)
                ->get(['id_proyecto', 'nombre'])
                ->keyBy('id_proyecto');

            $datos['predicciones'] = array_map(function (array $prediccion) use ($proyectos): array {
                $proyecto = $proyectos->get($prediccion['id_proyecto'] ?? null);

                return [
                    ...$prediccion,
                    'nombre_proyecto' => $proyecto?->nombre,
                ];
            }, $datos['predicciones']);

            $entidades = $datos['analisis_entidades']['entidades'] ?? null;
            if (is_array($entidades)) {
                $idsTrabajadores = collect($entidades['trabajadores'] ?? [])
                    ->pluck('id_trabajador')
                    ->merge(collect($entidades['trabajador_actividad'] ?? [])->pluck('id_trabajador'))
                    ->merge(collect($entidades['cuadrillas'] ?? [])->flatMap(fn (array $cuadrilla) => $cuadrilla['miembros'] ?? []))
                    ->filter()
                    ->unique()
                    ->values();
                $trabajadores = Trabajador::query()
                    ->with('persona')
                    ->whereIn('id_trabajador', $idsTrabajadores)
                    ->get()
                    ->mapWithKeys(fn (Trabajador $trabajador) => [
                        $trabajador->id_trabajador => trim(implode(' ', array_filter([
                            $trabajador->persona?->nombre_1,
                            $trabajador->persona?->nombre_2,
                            $trabajador->persona?->apellido_1,
                            $trabajador->persona?->apellido_2,
                        ]))),
                    ]);

                foreach (['trabajadores', 'trabajador_actividad'] as $grupo) {
                    $entidades[$grupo] = array_map(function (array $entidad) use ($trabajadores): array {
                        $id = $entidad['id_trabajador'] ?? null;

                        return [...$entidad, 'nombre_trabajador' => $trabajadores->get($id) ?: null];
                    }, $entidades[$grupo] ?? []);
                }
                $entidades['cuadrillas'] = array_map(function (array $cuadrilla) use ($trabajadores): array {
                    $cuadrilla['miembros_detalle'] = array_map(fn ($id) => [
                        'id_trabajador' => $id,
                        'nombre' => $trabajadores->get($id) ?: null,
                    ], $cuadrilla['miembros'] ?? []);

                    return $cuadrilla;
                }, $entidades['cuadrillas'] ?? []);
                $datos['analisis_entidades']['entidades'] = $entidades;
            }
        }

        return response()->json($datos ?? [
            'message' => 'El servicio del modelo predictivo devolvió una respuesta inválida.',
        ], $response->status());
    }
}
