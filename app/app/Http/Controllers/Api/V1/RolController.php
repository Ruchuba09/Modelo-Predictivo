<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RolRequest;
use App\Models\Rol;
use App\Services\RolService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class RolController extends Controller
{
    public function __construct(private readonly RolService $servicio) {}

    public function index(Request $request): JsonResponse
    {
        $query = Rol::query()->with('permisos')
            ->when($request->string('buscar')->toString(), fn ($query, $buscar) =>
                $query->where('nombre', 'ilike', "%{$buscar}%"))
            ->orderBy('id_rol');
        $roles = $request->boolean('todos')
            ? $query->limit(1000)->get()
            : $query->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json($roles);
    }

    public function store(RolRequest $request): JsonResponse
    {
        $rol = $this->servicio->crear($request->toData())->load('permisos');

        return response()->json($rol, 201);
    }

    public function show(Rol $rol): JsonResponse
    {
        return response()->json($this->servicio->obtenerConPermisos($rol));
    }

    public function update(RolRequest $request, Rol $rol): JsonResponse
    {
        return response()->json($this->servicio->actualizar($rol, $request->toData())->load('permisos'));
    }

    public function destroy(Rol $rol): Response
    {
        $this->servicio->eliminar($rol);

        return response()->noContent();
    }
}
