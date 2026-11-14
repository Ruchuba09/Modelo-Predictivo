<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use App\Services\RolService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Solo lectura: la administración de Roles es exclusiva del portal web
 * (RF-19 a RF-22). Se mantiene la consulta porque el alta de usuarios por la
 * API necesita los identificadores de los roles.
 */
class RolController extends Controller
{
    public function __construct(private readonly RolService $servicio) {}

    public function index(Request $request): JsonResponse
    {
        $query = Rol::query()->with('permisos')->withCount('usuarios')
            ->when(trim($request->string('buscar')->toString()), fn ($query, $buscar) =>
                $query->where('nombre', 'ilike', '%'.addcslashes($buscar, '%_\\').'%'))
            ->orderByRaw('LOWER(nombre)');
        $roles = $request->boolean('todos')
            ? $query->limit(1000)->get()
            : $query->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json($roles);
    }

    public function show(Rol $rol): JsonResponse
    {
        return response()->json($this->servicio->obtenerConPermisos($rol));
    }
}
