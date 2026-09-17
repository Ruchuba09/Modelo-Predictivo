<?php

namespace App\Http\Controllers;

use App\DataTransferObjects\UsuarioData;
use App\Http\Resources\UsuarioResource;
use App\Models\User;
use App\Models\Rol;
use App\http\Services\UserService;
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rut' => ['required', 'string', 'unique:usuarios.users,rut'],
            'email' => ['required', 'email', 'unique:usuarios.users,email'],
            'password' => ['required', 'confirmed', 'min:8'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['exists:usuarios.roles,id_rol'],
        ]);

        $this->userService->crear(UsuarioData::fromArray($validated));

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

    public function update(Request $request, User $usuario)
    {
        $validated = $request->validate([
            'rut' => ['required', 'string', 'unique:usuarios.users,rut,' . $usuario->id_user . ',id_user'],
            'email' => ['required', 'email', 'unique:usuarios.users,email,' . $usuario->id_user . ',id_user'],
            'password' => ['nullable', 'confirmed', 'min:8'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['exists:usuarios.roles,id_rol'],
        ]);

        $this->userService->actualizar($usuario, UsuarioData::fromArray($validated));

        return redirect()->route('usuarios.index')
            ->with('success', 'Usuario actualizado correctamente.');
    }

    public function destroy(User $usuario)
    {
        $this->userService->eliminar($usuario);

        return redirect()->route('usuarios.index')
            ->with('success', 'Usuario eliminado correctamente.');
    }
}