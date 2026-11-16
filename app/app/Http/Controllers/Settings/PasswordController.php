<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\UsuarioRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Cambio de la propia contraseña, con las reglas de RF-27 E-3. Igual que en
 * RF-28.4, se cierran las demás sesiones del portal y todas las de la
 * aplicación móvil; la sesión desde la que se hizo el cambio se conserva.
 */
class PasswordController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string', 'current_password:web'],
            'password' => UsuarioRequest::reglasContrasena(),
        ], [
            'current_password.required' => 'Debe ingresar su contraseña actual.',
            'current_password.string' => 'La contraseña actual no es válida.',
            'current_password.current_password' => 'La contraseña actual no es correcta.',
            ...UsuarioRequest::mensajesContrasena(),
        ]);

        $usuario = $request->user();

        DB::transaction(function () use ($usuario, $validated) {
            // El cast "hashed" del modelo la cifra.
            $usuario->forceFill([
                'password' => $validated['password'],
                'remember_token' => Str::random(60),
            ])->save();
            $usuario->tokens()->delete();
        });

        // CerrarSesionesTrasCambioDeClave guarda el nuevo hash en esta sesión,
        // que sigue abierta; las demás quedan cerradas.
        Auth::guard('web')->setUser($usuario);

        return back()->with('success', 'Contraseña actualizada exitosamente.');
    }
}
