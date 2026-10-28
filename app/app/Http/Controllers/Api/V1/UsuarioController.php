<?php

namespace App\Http\Controllers\Api\V1;

use App\DataTransferObjects\UsuarioData;
use App\Http\Controllers\Controller;
use App\Http\Resources\UsuarioResource;
use App\Models\Rol;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class UsuarioController extends Controller
{
    public function __construct(private readonly UserService $servicio) {}

    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with('roles')
            ->when($request->string('buscar')->toString(), function ($query, $buscar) {
                $query->where(fn ($user) => $user
                    ->where('rut', 'ilike', "%{$buscar}%")
                    ->orWhere('email', 'ilike', "%{$buscar}%"));
            })
            ->orderBy('id_user');

        $usuarios = $request->boolean('todos')
            ? $query->limit(1000)->get()
            : $query->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return UsuarioResource::collection($usuarios)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rut' => ['required', 'string', 'max:20', 'unique:usuarios.users,rut'],
            'email' => ['required', 'email', 'max:255', 'unique:usuarios.users,email'],
            'password' => ['required', 'confirmed', 'min:8'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['integer', 'distinct', 'exists:usuarios.roles,id_rol'],
        ]);

        $usuario = $this->servicio->crear(UsuarioData::fromArray($validated))->load('roles');

        return (new UsuarioResource($usuario))->response()->setStatusCode(201);
    }

    public function show(User $usuario): JsonResponse
    {
        return (new UsuarioResource($this->servicio->obtenerConRoles($usuario)))->response();
    }

    public function update(Request $request, User $usuario): JsonResponse
    {
        $validated = $request->validate([
            'rut' => [
                'required', 'string', 'max:20',
                Rule::unique('usuarios.users', 'rut')->ignore($usuario->id_user, 'id_user'),
            ],
            'email' => [
                'required', 'email', 'max:255',
                Rule::unique('usuarios.users', 'email')->ignore($usuario->id_user, 'id_user'),
            ],
            'password' => ['nullable', 'confirmed', 'min:8'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['integer', 'distinct', 'exists:usuarios.roles,id_rol'],
        ]);

        $usuario = $this->servicio->actualizar($usuario, UsuarioData::fromArray($validated))->load('roles');

        return (new UsuarioResource($usuario))->response();
    }

    public function destroy(User $usuario): Response
    {
        abort_if(auth()->id() === $usuario->getKey(), 409, 'No puedes eliminar tu propia cuenta.');
        $this->servicio->eliminar($usuario);

        return response()->noContent();
    }
}
