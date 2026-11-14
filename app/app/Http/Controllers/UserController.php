<?php

namespace App\Http\Controllers;

use App\Exceptions\UsuarioNoModificableException;
use App\Http\Requests\UsuarioRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/** Administración de Usuarios (RF-27 a RF-30), solo en el portal web. */
class UserController extends Controller
{
    public function __construct(private readonly UserService $servicio) {}

    /** RF-29.2: listado con búsqueda por RUT, nombre o correo. */
    public function index(Request $request): Response
    {
        $busqueda = mb_substr(trim($request->string('buscar')->toString()), 0, 100);

        return Inertia::render('Usuarios/Index', [
            'usuarios' => UsuarioResource::collection($this->servicio->listar($busqueda)),
            'buscar' => $busqueda,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Usuarios/UsuariosCrear', [
            'roles' => $this->servicio->rolesAsignables(),
        ]);
    }

    /** RF-27.4 */
    public function store(UsuarioRequest $request): RedirectResponse
    {
        try {
            $this->servicio->crear($request->toData());
        } catch (Throwable $e) {
            report($e);

            return back()->withInput($request->except('password', 'password_confirmation'))
                ->withErrors(['general' => RolController::MENSAJE_ERROR_REGISTRO]);
        }

        return redirect()->route('usuarios.index')->with('success', 'Usuario registrado exitosamente.');
    }

    /** RF-29.3 */
    public function show(User $usuario): Response
    {
        return Inertia::render('Usuarios/UsuariosMostrar', [
            'usuario' => new UsuarioResource($this->servicio->obtenerConRoles($usuario)),
        ]);
    }

    public function edit(User $usuario): Response
    {
        return Inertia::render('Usuarios/UsuariosEditar', [
            'usuario' => new UsuarioResource($this->servicio->obtenerConRoles($usuario)),
            'roles' => $this->servicio->rolesAsignables($usuario),
        ]);
    }

    /** RF-28.4 */
    public function update(UsuarioRequest $request, User $usuario): RedirectResponse
    {
        $datos = $request->toData();

        try {
            $this->servicio->actualizar($usuario, $datos);
        } catch (UsuarioNoModificableException $e) {
            return back()->withErrors([$e->campo => $e->getMessage()]);
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors(['general' => RolController::MENSAJE_ERROR_ACTUALIZACION]);
        }

        // Quien cambia su propia contraseña conserva esta sesión; las demás se cierran (RF-28.4).
        if ($datos->password !== null && $request->user()?->is($usuario)) {
            Auth::guard('web')->setUser($usuario->fresh());
        }

        return redirect()->route('usuarios.index')->with('success', 'Usuario actualizado exitosamente.');
    }

    /** RF-30: los rechazos y fallos vuelven a la pantalla desde la que se pidió. */
    public function destroy(Request $request, User $usuario): RedirectResponse
    {
        try {
            $this->servicio->eliminar($usuario, $request->user());
        } catch (UsuarioNoModificableException $e) {
            return back()->with('error', $e->getMessage());
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', RolController::MENSAJE_ERROR_ELIMINACION);
        }

        return redirect()->route('usuarios.index')->with('success', 'Usuario eliminado exitosamente.');
    }
}
