<?php

namespace App\Http\Controllers;

use App\Exceptions\PermisoNoEliminableException;
use App\Http\Requests\PermisoRequest;
use App\Models\Permiso;
use App\Services\PermisoService;
use App\Support\Permisos;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/** Administración de Permisos (RF-23 a RF-26), solo en el portal web. */
class PermisoController extends Controller
{
    public function __construct(
        private readonly PermisoService $servicio
    ) {}

    /** RF-25.2: listado con búsqueda por nombre o descripción. */
    public function index(Request $request): Response
    {
        $busqueda = mb_substr(trim($request->string('buscar')->toString()), 0, 100);

        return Inertia::render('Permisos/Index', [
            'permisos' => $this->servicio->listar($busqueda),
            'buscar' => $busqueda,
            'niveles' => Permisos::NIVELES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Permisos/PermisosCrear', [
            'niveles' => Permisos::NIVELES,
        ]);
    }

    /** RF-23.4 */
    public function store(PermisoRequest $request): RedirectResponse
    {
        try {
            $this->servicio->crear($request->toData());
        } catch (Throwable $e) {
            report($e);

            return back()->withInput()->withErrors(['general' => RolController::MENSAJE_ERROR_REGISTRO]);
        }

        return redirect()->route('permisos.index')->with('success', 'Permiso registrado exitosamente.');
    }

    /** RF-25.3 */
    public function show(Permiso $permiso): Response
    {
        return Inertia::render('Permisos/PermisosMostrar', [
            'permiso' => $this->servicio->obtenerConRoles($permiso),
            'niveles' => Permisos::NIVELES,
        ]);
    }

    public function edit(Permiso $permiso): Response
    {
        return Inertia::render('Permisos/PermisosEditar', [
            'permiso' => $permiso->loadCount('roles'),
            'niveles' => Permisos::NIVELES,
        ]);
    }

    /** RF-24.4 */
    public function update(PermisoRequest $request, Permiso $permiso): RedirectResponse
    {
        try {
            $this->servicio->actualizar($permiso, $request->toData());
        } catch (Throwable $e) {
            report($e);

            return back()->withInput()->withErrors(['general' => RolController::MENSAJE_ERROR_ACTUALIZACION]);
        }

        return redirect()->route('permisos.index')->with('success', 'Permiso actualizado exitosamente.');
    }

    /** RF-26: los rechazos y fallos vuelven a la pantalla desde la que se pidió. */
    public function destroy(Permiso $permiso): RedirectResponse
    {
        try {
            $roles = $this->servicio->eliminar($permiso);
        } catch (PermisoNoEliminableException $e) {
            return back()->with('error', $e->getMessage());
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', RolController::MENSAJE_ERROR_ELIMINACION);
        }

        $detalle = $roles > 0
            ? ' Se desvinculó de '.$roles.($roles === 1 ? ' rol.' : ' roles.')
            : '';

        return redirect()->route('permisos.index')->with('success', 'Permiso eliminado exitosamente.'.$detalle);
    }
}
