<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Rol;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $usuarios = User::with('roles')->latest()->get();

        return Inertia::render('Usuarios/Index', [
            'usuarios' => $usuarios,
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

        $usuario = User::create([
            'rut' => $validated['rut'],
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        $usuario->roles()->sync($validated['roles']);

        return redirect()->route('usuarios.index')
            ->with('success', 'Usuario creado correctamente.');
    }

    public function show(User $usuario)
    {
        return Inertia::render('Usuarios/UsuariosMostrar', [
            'usuario' => $usuario->load('roles'),
        ]);
    }

    public function edit(User $usuario)
    {
        return Inertia::render('Usuarios/UsuariosEditar', [
            'usuario' => $usuario->load('roles'),
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

        $usuario->rut = $validated['rut'];
        $usuario->email = $validated['email'];

        if (!empty($validated['password'])) {
            $usuario->password = $validated['password'];
        }

        $usuario->save();
        $usuario->roles()->sync($validated['roles']);

        return redirect()->route('usuarios.index')
            ->with('success', 'Usuario actualizado correctamente.');
    }

    public function destroy(User $usuario)
    {
        $usuario->roles()->detach();
        $usuario->delete();

        return redirect()->route('usuarios.index')
            ->with('success', 'Usuario eliminado correctamente.');
    }
}