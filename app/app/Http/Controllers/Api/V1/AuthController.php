<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UsuarioResource;
use App\Services\AutenticacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

/** Inicio (RF-31) y cierre (RF-32) de sesión de la aplicación móvil. */
class AuthController extends Controller
{
    public const MENSAJE_CIERRE = 'Sesión cerrada correctamente.';

    public const MENSAJE_CIERRE_TODAS = 'Se cerraron todas las sesiones de la aplicación móvil.';

    public function __construct(private readonly AutenticacionService $autenticacion) {}

    /** RF-31.5: entrega un token de acceso y los datos del usuario con sus roles y permisos. */
    public function login(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'rut' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ], LoginRequest::mensajes());

        $usuario = $this->autenticacion->autenticar($datos['rut'], $datos['password'], (string) $request->ip());

        $minutos = config('sanctum.expiration');
        $token = $usuario->createToken($datos['device_name'] ?? 'api', ['*'], $minutos ? now()->addMinutes((int) $minutos) : null);
        $usuario->load(['roles', 'trabajador.persona']);

        return response()->json([
            'token_type' => 'Bearer',
            'access_token' => $token->plainTextToken,
            'expires_at' => $token->accessToken->expires_at?->toIso8601String(),
            'user' => [
                ...(new UsuarioResource($usuario))->resolve($request),
                'permisos' => $usuario->permisosArray(),
            ],
        ]);
    }

    /**
     * RF-32: revoca el token con que se hizo la petición; con "todas" revoca
     * todos los tokens del usuario. Si la petición viene con la sesión del
     * portal (sin token), cierra esa sesión.
     */
    public function logout(Request $request): JsonResponse
    {
        $usuario = $request->user();

        if ($request->boolean('todas')) {
            $usuario->tokens()->delete();
            $usuario->setRememberToken(Str::random(60));
            $usuario->save();

            return response()->json(['message' => self::MENSAJE_CIERRE_TODAS]);
        }

        $token = $usuario->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        } elseif ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => self::MENSAJE_CIERRE]);
    }
}
