<?php

namespace App\Http\Controllers;

use App\Http\Requests\PermisoRequest;
use App\Models\Permiso;
use App\Http\Services\PermisoService;
use Inertia\Inertia;

class PermisoController extends Controller
{
    public function __construct(
        private readonly PermisoService $servicio
    ) {}

    public function index()
    {
        return Inertia::render('Permisos/Index', [
            'permisos' => $this->servicio->listarConRoles(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Permisos/PermisosCrear');
    }

    public function store(PermisoRequest $request)
    {
        $this->servicio->crear($request->toData());

        return redirect()
            ->route('permisos.index')
            ->with('success', 'Permiso creado correctamente.');
    }

    public function show(Permiso $permiso)
    {
        return Inertia::render('Permisos/PermisosMostrar', [
            'permiso' => $this->servicio->obtenerConRoles($permiso),
        ]);
    }

    public function edit(Permiso $permiso)
    {
        return Inertia::render('Permisos/PermisosEditar', [
            'permiso' => $permiso,
        ]);
    }

    public function update(PermisoRequest $request, Permiso $permiso)
    {
        $this->servicio->actualizar($permiso, $request->toData());

        return redirect()
            ->route('permisos.index')
            ->with('success', 'Permiso actualizado correctamente.');
    }

    public function destroy(Permiso $permiso)
    {
        $this->servicio->eliminar($permiso);

        return redirect()
            ->route('permisos.index')
            ->with('success', 'Permiso eliminado correctamente.');
    }
}