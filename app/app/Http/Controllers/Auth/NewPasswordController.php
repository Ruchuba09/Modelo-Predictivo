<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\UsuarioRequest;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    public const MENSAJE_ENLACE_INVALIDO = 'El enlace para restablecer la contraseña no es válido o ya venció.';

    /**
     * Show the password reset page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Restablece la contraseña con las reglas de RF-27 E-3. Como en RF-28.4,
     * se cierran todas las sesiones del usuario en el portal y en la
     * aplicación móvil.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'max:255', 'email'],
            'password' => UsuarioRequest::reglasContrasena(),
        ], [
            'token.required' => self::MENSAJE_ENLACE_INVALIDO,
            'token.string' => self::MENSAJE_ENLACE_INVALIDO,
            'email.required' => 'Debe ingresar su correo electrónico.',
            'email.string' => 'El correo electrónico no es válido.',
            'email.max' => 'El correo electrónico no puede superar los 255 caracteres.',
            'email.email' => 'El correo electrónico no tiene un formato válido.',
            ...UsuarioRequest::mensajesContrasena(),
        ]);

        $status = Password::reset(
            [
                ...self::credencialesCorreo((string) $request->input('email')),
                ...$request->only('password', 'password_confirmation', 'token'),
            ],
            function (User $user) use ($request) {
                DB::transaction(function () use ($user, $request) {
                    // El cast "hashed" del modelo la cifra.
                    $user->forceFill([
                        'password' => $request->input('password'),
                        'remember_token' => Str::random(60),
                    ])->save();
                    $user->tokens()->delete();
                });

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PasswordReset) {
            return to_route('login')->with('status', 'Contraseña restablecida. Ya puede iniciar sesión.');
        }

        throw ValidationException::withMessages([
            'email' => $status === Password::ResetThrottled
                ? 'Demasiados intentos. Intente nuevamente en unos minutos.'
                : self::MENSAJE_ENLACE_INVALIDO,
        ]);
    }

    /**
     * Busca la cuenta por correo sin distinguir mayúsculas de minúsculas
     * (RF-27 E-2). El proveedor de usuarios acepta una clausura como valor.
     */
    public static function credencialesCorreo(string $email): array
    {
        $email = mb_strtolower(trim($email));

        return ['email' => fn ($query) => $query->whereRaw('LOWER(email) = ?', [$email])];
    }
}
