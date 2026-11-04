<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUsuarioRequest;
use App\Http\Requests\UpdateUsuarioRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class UsuarioController extends Controller
{
    public function __construct(private readonly UserService $servicio) {}

    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with('roles')
            ->when($request->string('buscar')->toString(), function ($query, $buscar) {
                $query->where(fn ($user) => $user
                    ->whereHas('trabajador.persona', fn ($persona) => $persona->where('rut', 'ilike', "%{$buscar}%"))
                    ->orWhere('email', 'ilike', "%{$buscar}%"));
            })
            ->orderBy('id_user');

        $usuarios = $request->boolean('todos')
            ? $query->limit(1000)->get()
            : $query->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return UsuarioResource::collection($usuarios)->response();
    }

    public function store(StoreUsuarioRequest $request): JsonResponse
    {
        $usuario = $this->servicio->crear($request->toData())->load('roles');

        return (new UsuarioResource($usuario))->response()->setStatusCode(201);
    }

    public function show(User $usuario): JsonResponse
    {
        return (new UsuarioResource($this->servicio->obtenerConRoles($usuario)))->response();
    }

    public function update(UpdateUsuarioRequest $request, User $usuario): JsonResponse
    {
        $usuario = $this->servicio->actualizar($usuario, $request->toData())->load('roles');

        return (new UsuarioResource($usuario))->response();
    }

    public function destroy(Request $request, User $usuario): Response
    {
        $this->servicio->eliminar($usuario, $request->user());

        return response()->noContent();
    }
}
