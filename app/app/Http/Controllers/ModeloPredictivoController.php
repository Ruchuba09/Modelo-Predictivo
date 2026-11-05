<?php

namespace App\Http\Controllers;

use App\Models\Proyecto;
use App\Models\Trabajador;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;

class ModeloPredictivoController extends Controller
{
    public const HORIZONTES_DIAS = [1, 2, 5, 7, 14, 21, 30, 60, 90];

    public function index(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'tipo_objetivo' => ['sometimes', 'string', 'max:100'],
            'horizonte_dias' => ['sometimes', 'integer', Rule::in(self::HORIZONTES_DIAS)],
            'id_proyecto' => ['sometimes', 'integer', 'min:1'],
        ]);

        $parametros = [
            'tipo_objetivo' => $filtros['tipo_objetivo'] ?? 'incidentes_reales',
            'horizonte_dias' => $filtros['horizonte_dias'] ?? 30,
        ];
        if (isset($filtros['id_proyecto'])) {
            $parametros['id_proyecto'] = $filtros['id_proyecto'];
        }

        return $this->solicitarModelo('/predicciones', $parametros);
    }

    public function entidades(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'tipo_objetivo' => ['sometimes', 'string', 'max:100'],
            'horizonte_dias' => ['sometimes', 'integer', Rule::in(self::HORIZONTES_DIAS)],
        ]);

        return $this->solicitarModelo('/predicciones/entidades', [
            'tipo_objetivo' => $filtros['tipo_objetivo'] ?? 'incidentes_reales',
            'horizonte_dias' => $filtros['horizonte_dias'] ?? 30,
        ]);
    }

    public function evaluacion(): JsonResponse
    {
        return $this->solicitarModelo('/modelo/evaluacion');
    }

    public function tipos(): JsonResponse
    {
        return $this->solicitarModelo('/tipos');
    }

    public function show(Request $request, Proyecto $proyecto): JsonResponse
    {
        $filtros = $request->validate([
            'tipo_objetivo' => ['sometimes', 'string', 'max:100'],
            'horizonte_dias' => ['sometimes', 'integer', Rule::in(self::HORIZONTES_DIAS)],
        ]);

        return $this->solicitarModelo('/predicciones', [
            'id_proyecto' => $proyecto->getKey(),
            'tipo_objetivo' => $filtros['tipo_objetivo'] ?? 'incidentes_reales',
            'horizonte_dias' => $filtros['horizonte_dias'] ?? 30,
        ]);
    }

    public function redNeuronal(Request $request): JsonResponse
    {
        return $this->solicitarModelo('/red-neuronal', $this->horizonteValidado($request));
    }

    public function pruebaRedNeuronal(Request $request): JsonResponse
    {
        return $this->solicitarModelo('/red-neuronal/prueba', $this->horizonteValidado($request));
    }

    public function trazaRedNeuronal(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'horizonte_dias' => ['sometimes', 'integer', Rule::in(self::HORIZONTES_DIAS)],
            'desde' => ['sometimes', 'integer', 'min:0'],
            'limite' => ['sometimes', 'integer', 'between:1,500'],
        ]);

        return $this->solicitarModelo('/red-neuronal/traza', [
            'horizonte_dias' => $filtros['horizonte_dias'] ?? 30,
            'desde' => $filtros['desde'] ?? 0,
            'limite' => $filtros['limite'] ?? 200,
        ]);
    }

    public function entrenarRedNeuronal(Request $request): JsonResponse
    {
        $parametros = $this->horizonteValidado($request);

        try {
            // El servicio entrena en segundo plano y responde de inmediato.
            $response = Http::acceptJson()
                ->timeout(30)
                ->post(rtrim((string) config('services.predictive_model.url'), '/') . '/red-neuronal/entrenar?' . http_build_query($parametros));
        } catch (ConnectionException) {
            return response()->json([
                'message' => 'El servicio del modelo predictivo no está disponible.',
            ], 503);
        }

        return response()->json($response->json() ?? [
            'message' => 'El servicio del modelo predictivo devolvió una respuesta inválida.',
        ], $response->status());
    }

    public function prediccionRedNeuronal(Request $request, Proyecto $proyecto): JsonResponse
    {
        return $this->solicitarModelo('/red-neuronal/proyectos/' . $proyecto->getKey(), $this->horizonteValidado($request));
    }

    private function horizonteValidado(Request $request): array
    {
        $filtros = $request->validate(['horizonte_dias' => ['sometimes', 'integer', Rule::in(self::HORIZONTES_DIAS)]]);

        return ['horizonte_dias' => $filtros['horizonte_dias'] ?? 30];
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
