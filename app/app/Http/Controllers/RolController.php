<?php

namespace App\Http\Controllers;

use App\Models\Rol;
use App\Models\Permiso;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RolController extends Controller
{
    public function index()
    {
        return Inertia::render('Roles/Index', [
            'roles' => Rol::with('permisos')->latest('id_rol')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Roles/RolesCrear', [
            'permisos' => Permiso::select('id_permiso', 'nombre')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'unique:usuarios.roles,nombre'],
            'permisos' => ['nullable', 'array'],
            'permisos.*' => ['exists:usuarios.permisos,id_permiso'],
        ]);

        $rol = Rol::create(['nombre' => $validated['nombre']]);

        $rol->permisos()->sync($validated['permisos'] ?? []);

        return redirect()->route('roles.index')
            ->with('success', 'Rol creado correctamente.');
    }

    public function show(Rol $rol)
    {
        return Inertia::render('Roles/RolesMostrar', [
            'rol' => $rol->load('permisos'),
        ]);
    }

    public function edit(Rol $rol)
    {
        return Inertia::render('Roles/RolesEditar', [
            'rol' => $rol->load('permisos'),
            'permisos' => Permiso::select('id_permiso', 'nombre')->get(),
        ]);
    }

    public function update(Request $request, Rol $rol)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'unique:usuarios.roles,nombre,' . $rol->id_rol . ',id_rol'],
            'permisos' => ['nullable', 'array'],
            'permisos.*' => ['exists:usuarios.permisos,id_permiso'],
        ]);

        $rol->nombre = $validated['nombre'];
        $rol->save();

        $rol->permisos()->sync($validated['permisos'] ?? []);

        return redirect()->route('roles.index')
            ->with('success', 'Rol actualizado correctamente.');
    }

    public function destroy(Rol $rol)
    {
        $rol->permisos()->detach();
        $rol->usuarios()->detach();
        $rol->delete();

        return redirect()->route('roles.index')
            ->with('success', 'Rol eliminado correctamente.');
    }
}