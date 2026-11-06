<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\DatosPruebaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

class DatosPruebaController extends Controller
{
    public function __construct(private readonly DatosPruebaService $servicio) {}

    public function index(): JsonResponse
    {
        return response()->json($this->servicio->resumen());
    }

    public function poblar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'tamano' => ['required', 'string', Rule::in(array_keys(DatosPruebaService::TAMANOS))],
        ]);

        return $this->ejecutar(fn () => $this->servicio->poblar($datos['tamano']));
    }

    public function limpiar(Request $request): JsonResponse
    {
        $request->validate(
            ['confirmacion' => ['required', 'string', Rule::in(['LIMPIAR'])]],
            ['confirmacion.in' => 'Escribe LIMPIAR para confirmar.', 'confirmacion.required' => 'Escribe LIMPIAR para confirmar.'],
        );

        return $this->ejecutar(fn () => $this->servicio->limpiar());
    }

    private function ejecutar(callable $accion): JsonResponse
    {
        abort_unless($this->servicio->habilitado(), 403, 'Los datos de prueba están deshabilitados en producción.');
        // Un lote grande puede superar el límite de ejecución predeterminado de PHP.
        set_time_limit(0);

        try {
            $cambios = $accion();
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json(['cambios' => $cambios, ...$this->servicio->resumen()]);
    }
}
