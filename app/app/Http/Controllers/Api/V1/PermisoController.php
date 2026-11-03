<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PermisoRequest;
use App\Models\Permiso;
use App\Services\PermisoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PermisoController extends Controller
{
    public function __construct(private readonly PermisoService $servicio) {}

    public function index(Request $request): JsonResponse
    {
        $query = Permiso::query()->with('roles')->orderBy('id_permiso');
        $permisos = $request->boolean('todos')
            ? $query->limit(1000)->get()
            : $query->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json($permisos);
    }

    public function store(PermisoRequest $request): JsonResponse
    {
        $permiso = $this->servicio->crear($request->toData())->load('roles');

        return response()->json($permiso, 201);
    }

    public function show(Permiso $permiso): JsonResponse
    {
        return response()->json($this->servicio->obtenerConRoles($permiso));
    }

    public function update(PermisoRequest $request, Permiso $permiso): JsonResponse
    {
        return response()->json($this->servicio->actualizar($permiso, $request->toData())->load('roles'));
    }

    public function destroy(Permiso $permiso): Response
    {
        $this->servicio->eliminar($permiso);

        return response()->noContent();
    }
}
