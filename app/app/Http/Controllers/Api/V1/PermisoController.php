<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Permiso;
use App\Services\PermisoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Solo consulta: los Permisos se administran en el portal web (RF-23 a RF-26). */
class PermisoController extends Controller
{
    public function __construct(private readonly PermisoService $servicio) {}

    public function index(Request $request): JsonResponse
    {
        $query = Permiso::query()->withCount('roles')->orderByRaw('LOWER(nombre)');
        $permisos = $request->boolean('todos')
            ? $query->limit(1000)->get()
            : $query->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json($permisos);
    }

    public function show(Permiso $permiso): JsonResponse
    {
        return response()->json($this->servicio->obtenerConRoles($permiso));
    }
}
