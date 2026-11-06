<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUsuarioRequest;
use App\Http\Requests\UpdateUsuarioRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\User;
use App\Models\Rol;
use App\Services\UserService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct(protected UserService $userService)
    {
    }

    public function index()
    {
        return Inertia::render('Usuarios/Index', [
            'usuarios' => UsuarioResource::collection($this->userService->listarConRoles()),
        ]);
    }

    public function create()
    {
        return Inertia::render('Usuarios/UsuariosCrear', [
            'roles' => Rol::select('id_rol', 'nombre')->get(),
        ]);
    }

    public function store(StoreUsuarioRequest $request)
    {
        $this->userService->crear($request->toData());

        return redirect()->route('usuarios.index')
            ->with('success', 'Usuario creado correctamente.');
    }

    public function show(User $usuario)
    {
        return Inertia::render('Usuarios/UsuariosMostrar', [
            'usuario' => new UsuarioResource($this->userService->obtenerConRoles($usuario)),
        ]);
    }

    public function edit(User $usuario)
    {
        return Inertia::render('Usuarios/UsuariosEditar', [
            'usuario' => new UsuarioResource($this->userService->obtenerConRoles($usuario)),
            'roles' => Rol::select('id_rol', 'nombre')->get(),
        ]);
    }

    public function update(UpdateUsuarioRequest $request, User $usuario)
    {
        $this->userService->actualizar($usuario, $request->toData());

        return redirect()->route('usuarios.index')
            ->with('success', 'Usuario actualizado correctamente.');
    }

    public function destroy(Request $request, User $usuario)
    {
        $this->userService->eliminar($usuario, $request->user());

        return redirect()->route('usuarios.index')
            ->with('success', 'Usuario eliminado correctamente.');
    }
}
