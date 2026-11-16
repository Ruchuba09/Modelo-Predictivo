<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Http\Resources\UsuarioResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Mi perfil". El usuario ve sus datos y cambia su correo. No puede cambiar
 * su RUT (RF-28) ni eliminar su propia cuenta (RF-30.3.1): eso lo hace otro
 * usuario con usuarios.gestionar.
 */
class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $usuario = $request->user()->load(['roles', 'trabajador.persona']);

        return Inertia::render('settings/profile', [
            'usuario' => (new UsuarioResource($usuario))->resolve($request),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $usuario = $request->user();
        $usuario->fill(['email' => $request->validated('email')]);

        if ($usuario->isDirty('email')) {
            $usuario->email_verified_at = null;
        }

        $usuario->save();

        return to_route('profile.edit')->with('success', 'Perfil actualizado exitosamente.');
    }
}
