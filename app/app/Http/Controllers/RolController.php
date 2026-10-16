<?php

namespace App\Http\Controllers;

use App\Http\Requests\RolRequest;
use App\Models\Rol;
use App\Services\RolService;
use Inertia\Inertia;

class RolController extends Controller
{
    public function __construct(
        private readonly RolService $servicio
    ) {}

    public function index()
    {
        return Inertia::render('Roles/Index', [
            'roles' => $this->servicio->listarConPermisos(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Roles/RolesCrear', [
            'permisos' => $this->servicio->listarPermisosDisponibles(),
        ]);
    }

    public function store(RolRequest $request)
    {
        $this->servicio->crear($request->toData());

        return redirect()
            ->route('roles.index')
            ->with('success', 'Rol creado correctamente.');
    }

    public function show(Rol $rol)
    {
        return Inertia::render('Roles/RolesMostrar', [
            'rol' => $this->servicio->obtenerConPermisos($rol),
        ]);
    }

    public function edit(Rol $rol)
    {
        return Inertia::render('Roles/RolesEditar', [
            'rol' => $this->servicio->obtenerConPermisos($rol),
            'permisos' => $this->servicio->listarPermisosDisponibles(),
        ]);
    }

    public function update(RolRequest $request, Rol $rol)
    {
        $this->servicio->actualizar($rol, $request->toData());

        return redirect()
            ->route('roles.index')
            ->with('success', 'Rol actualizado correctamente.');
    }

    public function destroy(Rol $rol)
    {
        $this->servicio->eliminar($rol);

        return redirect()
            ->route('roles.index')
            ->with('success', 'Rol eliminado correctamente.');
    }
}