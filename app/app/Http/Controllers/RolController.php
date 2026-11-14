<?php

namespace App\Http\Controllers;

use App\Exceptions\RolNoEliminableException;
use App\Http\Requests\RolRequest;
use App\Models\Rol;
use App\Services\RolService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/** Administración de Roles (RF-19 a RF-22), solo en el portal web. */
class RolController extends Controller
{
    public const MENSAJE_ERROR_REGISTRO = 'No se pudo completar el registro, intente nuevamente.';

    public const MENSAJE_ERROR_ACTUALIZACION = 'No se pudo completar la actualización, intente nuevamente.';

    public const MENSAJE_ERROR_ELIMINACION = 'No se pudo completar la eliminación, intente nuevamente.';

    public function __construct(
        private readonly RolService $servicio
    ) {}

    /** RF-21.2: listado con búsqueda por nombre. */
    public function index(Request $request): Response
    {
        $busqueda = mb_substr(trim($request->string('buscar')->toString()), 0, 100);

        return Inertia::render('Roles/Index', [
            'roles' => $this->servicio->listar($busqueda),
            'buscar' => $busqueda,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Roles/RolesCrear', [
            'permisos' => $this->servicio->listarPermisosDisponibles(),
        ]);
    }

    /** RF-19.4 */
    public function store(RolRequest $request): RedirectResponse
    {
        try {
            $this->servicio->crear($request->toData());
        } catch (Throwable $e) {
            report($e);

            return back()->withInput()->withErrors(['general' => self::MENSAJE_ERROR_REGISTRO]);
        }

        return redirect()->route('roles.index')->with('success', 'Rol registrado exitosamente.');
    }

    /** RF-21.3 */
    public function show(Rol $rol): Response
    {
        return Inertia::render('Roles/RolesMostrar', [
            'rol' => $this->servicio->obtenerConPermisos($rol),
        ]);
    }

    public function edit(Rol $rol): Response
    {
        return Inertia::render('Roles/RolesEditar', [
            'rol' => $this->servicio->obtenerConPermisos($rol),
            'permisos' => $this->servicio->listarPermisosDisponibles(),
        ]);
    }

    /** RF-20.4 */
    public function update(RolRequest $request, Rol $rol): RedirectResponse
    {
        try {
            $this->servicio->actualizar($rol, $request->toData());
        } catch (Throwable $e) {
            report($e);

            return back()->withInput()->withErrors(['general' => self::MENSAJE_ERROR_ACTUALIZACION]);
        }

        return redirect()->route('roles.index')->with('success', 'Rol actualizado exitosamente.');
    }

    /** RF-22: los rechazos y fallos vuelven a la pantalla desde la que se pidió. */
    public function destroy(Rol $rol): RedirectResponse
    {
        try {
            $this->servicio->eliminar($rol);
        } catch (RolNoEliminableException $e) {
            return back()->with('error', $e->getMessage());
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', self::MENSAJE_ERROR_ELIMINACION);
        }

        return redirect()->route('roles.index')->with('success', 'Rol eliminado exitosamente.');
    }
}
