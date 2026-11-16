<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Envía el enlace para restablecer la contraseña. El correo se compara en
     * minúsculas, como se almacena (RF-27 E-2), y la respuesta es la misma
     * exista o no la cuenta, para no revelar qué correos están registrados.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'max:255', 'email'],
        ], [
            'email.required' => 'Debe ingresar su correo electrónico.',
            'email.string' => 'El correo electrónico no es válido.',
            'email.max' => 'El correo electrónico no puede superar los 255 caracteres.',
            'email.email' => 'El correo electrónico no tiene un formato válido.',
        ]);

        Password::sendResetLink(NewPasswordController::credencialesCorreo((string) $request->input('email')));

        return back()->with('status', 'Si la cuenta existe, se enviará un enlace para restablecer la contraseña.');
    }
}
