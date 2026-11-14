<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UsuarioResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Solo consulta: los Usuarios se administran en el portal web (RF-27 a RF-30). */
class UsuarioController extends Controller
{
    public function __construct(private readonly UserService $servicio) {}

    public function index(Request $request): JsonResponse
    {
        $buscar = mb_substr(trim($request->string('buscar')->toString()), 0, 100);
        $patron = '%'.addcslashes($buscar, '%_\\').'%';

        $query = User::query()->with(['roles', 'trabajador.persona'])
            ->when($buscar !== '', fn ($query) => $query->where(fn ($user) => $user
                ->whereHas('trabajador.persona', fn ($persona) => $persona->where('rut', 'ilike', $patron))
                ->orWhere('email', 'ilike', $patron)))
            ->orderByRaw('LOWER(email)');

        $usuarios = $request->boolean('todos')
            ? $query->limit(1000)->get()
            : $query->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return UsuarioResource::collection($usuarios)->response();
    }

    public function show(User $usuario): JsonResponse
    {
        return (new UsuarioResource($this->servicio->obtenerConRoles($usuario)))->response();
    }
}
