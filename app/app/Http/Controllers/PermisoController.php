<?php

namespace App\Http\Controllers;

use App\Models\Permiso;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PermisoController extends Controller
{
    public function index()
    {
        return Inertia::render('Permisos/Index', [
            'permisos' => Permiso::with('roles')->latest()->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Permisos/PermisosCrear');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'unique:usuarios.permisos,nombre'],
            'nivel' => ['nullable', 'string'],
        ]);

        Permiso::create($validated);

        return redirect()->route('permisos.index')
            ->with('success', 'Permiso creado correctamente.');
    }

    public function show(Permiso $permiso)
    {
        return Inertia::render('Permisos/PermisosMostrar', [
            'permiso' => $permiso->load('roles'),
        ]);
    }

    public function edit(Permiso $permiso)
    {
        return Inertia::render('Permisos/PermisosEditar', [
            'permiso' => $permiso,
        ]);
    }

    public function update(Request $request, Permiso $permiso)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'unique:usuarios.permisos,nombre,' . $permiso->id_permiso . ',id_permiso'],
            'nivel' => ['nullable', 'string'],
        ]);

        $permiso->update($validated);

        return redirect()->route('permisos.index')
            ->with('success', 'Permiso actualizado correctamente.');
    }

    public function destroy(Permiso $permiso)
    {
        $permiso->roles()->detach();
        $permiso->delete();

        return redirect()->route('permisos.index')
            ->with('success', 'Permiso eliminado correctamente.');
    }
}